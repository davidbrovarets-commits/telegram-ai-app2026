import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// --- CONFIGURATION (READ-ONLY monitor) ---
const TABLE = "news"; // Reverted to known working table
const MAX_GENERATION_ATTEMPTS = 3; // Keep in sync with lib/imageStatus.ts

// Thresholds
const THRESHOLD_FAIL_STUCK = 3;
const THRESHOLD_FAIL_RECENT = 10;
const THRESHOLD_WARN_FAIL_RECENT = 3;
const THRESHOLD_WARN_HIGH_ATTEMPTS = 5;
const THRESHOLD_FAIL_CONTRACT_RATE = 0.5; // 50%
const THRESHOLD_WARN_CONTRACT_RATE = 0.8; // 80%

// Stuck threshold (minutes)
const STUCK_MINUTES = 45;

// --- SETUP ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPERS ---
function log(msg: string) {
    console.log(msg);
}

function warn(msg: string) {
    console.log(`⚠️  ${msg}`);
}

function fail(msg: string) {
    console.log(`❌ ${msg}`);
}

// Prompt contract checks (non-brittle regex-based)
function checkPromptContract(promptRaw: string): string[] {
    const p = (promptRaw || "").toLowerCase();
    const violations: string[] = [];

    // must include a negative section marker
    if (!p.includes("exclude:")) violations.push('Missing "Exclude:"');

    // lighting present (word-based; avoids brittle token lists)
    if (!p.includes("lighting")) violations.push("Missing Lighting keyword");

    // realism count: allow 1–2 occurrences of "realism:" or "photoreal" marker
    const realismMarkers = [
        /realism\s*:/g,
        /photoreal/g,
    ];
    let realismCount = 0;
    for (const re of realismMarkers) {
        const m = p.match(re);
        if (m) realismCount += m.length;
    }
    // If generator encodes realism via tokens only, accept at least 1 realism-like artifact marker
    // such as film grain / chromatic aberration / dust particles / motion blur (count 1–2 total)
    const realismArtifacts = ["film grain", "chromatic aberration", "dust particles", "subtle motion blur"];
    const artifactCount = realismArtifacts.filter(t => p.includes(t)).length;

    const effectiveRealism = Math.max(realismCount, artifactCount);
    if (effectiveRealism < 1 || effectiveRealism > 2) {
        violations.push(`Realism marker count ${effectiveRealism} (want 1–2)`);
    }

    // lens mandatory (e.g. "35mm lens", "50mm lens", etc.)
    const hasLens = /\b\d{2,3}\s*mm\s*lens\b/.test(p);
    if (!hasLens) violations.push("Missing Lens (e.g. '35mm lens')");

    // aperture mandatory (e.g. "f/2.8")
    const hasAperture = /\bf\/\d+(\.\d+)?\b/.test(p) || p.includes("aperture");
    if (!hasAperture) violations.push("Missing Aperture (e.g. 'f/2.8')");

    return violations;
}

async function countByStatus(status: string): Promise<number> {
    const { count, error } = await supabase
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("image_status", status);

    if (error) throw error;
    return count || 0;
}

async function main() {
    log("\n=== NEWS IMAGES MONITOR (READ-ONLY) ===\n");

    let warnings = 0;
    let failures = 0;

    try {
        // 1) Status Counts
        log("--- 1. Status Counts ---");
        const statuses = ["placeholder", "generating", "generated", "failed"] as const;
        const countsArr = await Promise.all(statuses.map(s => countByStatus(s)));
        const counts: Record<string, number> = {};
        statuses.forEach((s, idx) => (counts[s] = countsArr[idx]));
        for (const s of statuses) {
            log(`   ${s.padEnd(12)}: ${counts[s]}`);
        }

        // 2) Stuck Generating (> 45m) — use image_last_attempt_at (NOT created_at)
        log(`\n--- 2. Stuck Generating (> ${STUCK_MINUTES}m) ---`);
        const cutoff = new Date(Date.now() - STUCK_MINUTES * 60 * 1000).toISOString();

        const { data: stuckItems, error: stuckErr } = await supabase
            .from(TABLE)
            .select("id, image_last_attempt_at, image_generation_attempts")
            .eq("image_status", "generating")
            .lt("image_last_attempt_at", cutoff)
            .limit(50);

        if (stuckErr) throw stuckErr;

        const stuckCount = stuckItems?.length || 0;
        if (stuckCount > 0) {
            stuckItems?.forEach(i =>
                log(`   ID ${i.id}: last_attempt=${i.image_last_attempt_at}, attempts=${i.image_generation_attempts}`)
            );
        } else {
            log("   None.");
        }

        if (stuckCount >= THRESHOLD_FAIL_STUCK) {
            fail(`Stuck items (${stuckCount}) >= FAIL threshold (${THRESHOLD_FAIL_STUCK})`);
            failures++;
        }

        // 3) Recent Failures (Last 3h) — based on image_last_attempt_at
        log("\n--- 3. Recent Failures (Last 3h) ---");
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

        const { count: recentFailCount, error: recentFailErr } = await supabase
            .from(TABLE)
            .select("id", { count: "exact", head: true })
            .eq("image_status", "failed")
            .gte("image_last_attempt_at", threeHoursAgo);

        if (recentFailErr) throw recentFailErr;

        log(`   Count: ${recentFailCount || 0}`);
        if ((recentFailCount || 0) >= THRESHOLD_FAIL_RECENT) {
            fail(`Recent failures (${recentFailCount}) >= FAIL threshold (${THRESHOLD_FAIL_RECENT})`);
            failures++;
        } else if ((recentFailCount || 0) >= THRESHOLD_WARN_FAIL_RECENT) {
            warn(`Recent failures (${recentFailCount}) >= WARN threshold (${THRESHOLD_WARN_FAIL_RECENT})`);
            warnings++;
        }

        // 4) High Attempts (>= MAX-1) in Last 24h — based on image_last_attempt_at
        log("\n--- 4. High Attempts (Last 24h) ---");
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: highAttemptItems, error: highAttemptErr } = await supabase
            .from(TABLE)
            .select("id, image_generation_attempts, image_status")
            .gte("image_generation_attempts", MAX_GENERATION_ATTEMPTS - 1)
            .gte("image_last_attempt_at", twentyFourHoursAgo)
            .limit(50);

        if (highAttemptErr) throw highAttemptErr;

        const highAttemptCount = highAttemptItems?.length || 0;
        if (highAttemptCount > 0) {
            highAttemptItems?.slice(0, 10).forEach(i =>
                log(`   ID ${i.id}: attempts=${i.image_generation_attempts} (${i.image_status})`)
            );
            if (highAttemptCount > 10) log(`   ... and ${highAttemptCount - 10} more.`);
        } else {
            log("   None.");
        }

        if (highAttemptCount >= THRESHOLD_WARN_HIGH_ATTEMPTS) {
            warn(`High-attempt items (${highAttemptCount}) >= WARN threshold (${THRESHOLD_WARN_HIGH_ATTEMPTS})`);
            warnings++;
        }

        // 5) Prompt Contract Sanity (Latest 25 generated Imagen items)
        log("\n--- 5. Prompt Contract Sanity (Latest 25) ---");
        const { data: recentPrompts, error: promptErr } = await supabase
            .from(TABLE)
            .select("id, image_prompt, created_at")
            .eq("image_status", "generated")
            .eq("image_source_type", "imagen")
            .not("image_prompt", "is", null)
            .neq("id", "1817") // Exclude legacy test item
            .order("created_at", { ascending: false })
            .limit(25);

        if (promptErr) throw promptErr;

        let passed = 0;
        let checked = 0;

        if (recentPrompts && recentPrompts.length > 0) {
            for (const item of recentPrompts) {
                checked++;
                const violations = checkPromptContract(item.image_prompt || "");
                if (violations.length === 0) {
                    passed++;
                } else {
                    log(`   ID ${item.id} FAIL: ${violations.join(", ")}`);
                }
            }

            const passRate = checked > 0 ? passed / checked : 1.0;
            log(`   Pass Rate: ${(passRate * 100).toFixed(1)}% (${passed}/${checked})`);

            if (passRate < THRESHOLD_FAIL_CONTRACT_RATE) {
                fail(`Contract pass rate < ${(THRESHOLD_FAIL_CONTRACT_RATE * 100).toFixed(0)}%`);
                failures++;
            } else if (passRate < THRESHOLD_WARN_CONTRACT_RATE) {
                warn(`Contract pass rate < ${(THRESHOLD_WARN_CONTRACT_RATE * 100).toFixed(0)}%`);
                warnings++;
            }
        } else {
            log("   No recent Imagen items to check.");
        }

        // 6) Static Aspect Ratio Check (codebase)
        log('\n--- 6. Static Code Check (aspectRatio "4:3") ---');
        const scriptPath = path.join(process.cwd(), "scripts", "generate_news_banners.ts");
        if (fs.existsSync(scriptPath)) {
            const content = fs.readFileSync(scriptPath, "utf-8");
            const has43 =
                content.includes('aspectRatio: "4:3"') ||
                content.includes("aspectRatio: '4:3'") ||
                content.includes('"aspectRatio":"4:3"') ||
                content.includes('"aspectRatio": "4:3"');
            if (has43) {
                log('   ✅ aspectRatio "4:3" found in code.');
            } else {
                fail('   ❌ aspectRatio "4:3" NOT found in scripts/generate_news_banners.ts');
                failures++;
            }
        } else {
            warn("   ⚠️ scripts/generate_news_banners.ts not found (skipping).");
            warnings++;
        }

        // Summary
        log("\n=== SUMMARY ===");
        log(`Failures: ${failures}`);
        log(`Warnings: ${warnings}`);

        if (failures > 0) {
            log("\n❌ MONITOR FAILED");
            process.exit(1);
        } else {
            log("\n✅ MONITOR PASSED");
            process.exit(0);
        }
    } catch (err: any) {
        console.error("\n❌ FATAL ERROR:", err?.message || err);
        process.exit(1);
    }
}

main();
