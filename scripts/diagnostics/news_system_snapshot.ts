import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

type Row = Record<string, any>;

function nowStamp() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function fmt(n: any) {
    if (n === null || n === undefined) return '—';
    return String(n);
}

function pct(part: number, total: number) {
    if (!total) return '0%';
    return `${Math.round((part / total) * 100)}%`;
}

function mdTable(rows: Row[], cols: { key: string; label: string }[]) {
    const head = `| ${cols.map(c => c.label).join(' | ')} |\n| ${cols.map(() => '---').join(' | ')} |\n`;
    const body = rows.map(r => `| ${cols.map(c => fmt(r[c.key])).join(' | ')} |`).join('\n');
    return head + (body || `| ${cols.map(() => '—').join(' | ')} |`);
}

function safeExec(cmd: string) {
    try {
        return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' }).trim();
    } catch (e: any) {
        return `ERROR: ${e?.message || e}`;
    }
}

async function main() {
    const stamp = nowStamp();
    const outDir = path.join(process.cwd(), 'docs', 'audits');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `NEWS_SYSTEM_SNAPSHOT_${stamp}.md`);

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

    if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL / VITE_SUPABASE_URL');
    if (!SUPABASE_ANON) throw new Error('Missing SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
    const supabaseAdmin = SUPABASE_SERVICE ? createClient(SUPABASE_URL, SUPABASE_SERVICE) : null;

    const urlHost = new URL(SUPABASE_URL).host;

    const lines: string[] = [];
    lines.push(`# NEWS SYSTEM SNAPSHOT`);
    lines.push(`- Generated at: ${new Date().toISOString()}`);
    lines.push(`- SUPABASE_URL host: \`${urlHost}\``);
    lines.push(`- ANON key present: \`${Boolean(SUPABASE_ANON)}\``);
    lines.push(`- SERVICE key present: \`${Boolean(SUPABASE_SERVICE)}\``);
    lines.push(``);

    // --- SECTION 0: GitHub Actions (READ-ONLY) ---
    lines.push(`## 0) GitHub Actions (READ-ONLY status)`);
    lines.push(`> Uses \`gh\` CLI if available. If not installed/authenticated, shows an error string.`);
    const ghWho = safeExec('gh auth status -t');
    lines.push(`- gh auth: \`${ghWho.split('\n')[0] || ghWho}\``);

    const ghWf = safeExec('gh workflow list --all');
    lines.push(`\n### Workflows (list)\n\`\`\`\n${ghWf}\n\`\`\``);

    const ghRuns = safeExec('gh run list --limit 25');
    lines.push(`\n### Recent runs (top 25)\n\`\`\`\n${ghRuns}\n\`\`\``);

    // --- SECTION 1: News freshness ---
    lines.push(`\n## 1) News freshness & totals`);
    // newest/oldest created_at
    const newest = await supabase.from('news').select('id, title, status, image_status, created_at, published_at, city, land, scope, type').order('created_at', { ascending: false }).limit(5);
    if (newest.error) throw newest.error;

    const oldestPending = await supabase
        .from('news')
        .select('id, title, status, image_status, created_at, published_at, image_generation_attempts, image_last_attempt_at, city, land, scope, type')
        .in('status', ['POOL', 'ACTIVE'])
        .neq('image_status', 'generated')
        .order('created_at', { ascending: true })
        .limit(5);

    if (oldestPending.error) {
        // If column missing, continue.
        lines.push(`⚠️ Could not query oldest pending non-generated items: ${oldestPending.error.message}`);
    }

    // total count (cheap-ish)
    const totalCount = await supabase.from('news').select('id', { count: 'exact', head: true });
    if (totalCount.error) throw totalCount.error;

    lines.push(`- Total rows in news: **${totalCount.count || 0}**`);
    lines.push(`\n### Newest 5 by created_at`);
    lines.push(mdTable(newest.data || [], [
        { key: 'id', label: 'id' },
        { key: 'status', label: 'status' },
        { key: 'image_status', label: 'image_status' },
        { key: 'created_at', label: 'created_at' },
        { key: 'published_at', label: 'published_at' },
        { key: 'scope', label: 'scope' },
        { key: 'land', label: 'land' },
        { key: 'city', label: 'city' },
        { key: 'type', label: 'type' },
        { key: 'title', label: 'title' },
    ]));

    if (oldestPending.data) {
        lines.push(`\n### Oldest 5 pending (status POOL/ACTIVE and image_status != generated)`);
        lines.push(mdTable(oldestPending.data, [
            { key: 'id', label: 'id' },
            { key: 'status', label: 'status' },
            { key: 'image_status', label: 'image_status' },
            { key: 'image_generation_attempts', label: 'attempts' },
            { key: 'image_last_attempt_at', label: 'last_attempt' },
            { key: 'created_at', label: 'created_at' },
            { key: 'scope', label: 'scope' },
            { key: 'land', label: 'land' },
            { key: 'city', label: 'city' },
            { key: 'type', label: 'type' },
            { key: 'title', label: 'title' },
        ]));
    }

    // --- SECTION 2: Distributions ---
    lines.push(`\n## 2) Distributions (status/scope/type/geo)`);
    async function groupCount(column: string) {
        // Using PostgREST group is awkward; do a limited select and aggregate in JS to avoid RPC dependency.
        // We'll pull lightweight columns for last N rows to estimate, plus exact counts for key fields via multiple queries.
        const { data, error } = await supabase.from('news').select(`id, ${column}`).limit(5000).order('created_at', { ascending: false });
        if (error) throw error;
        const map = new Map<string, number>();
        for (const r of data || []) {
            const k = (r as any)[column] ?? '(null)';
            map.set(String(k), (map.get(String(k)) || 0) + 1);
        }
        const rows = Array.from(map.entries()).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count);
        return rows;
    }

    const statusDist = await groupCount('status');
    lines.push(`\n### status (sample last 5000)`);
    lines.push(mdTable(statusDist, [{ key: 'key', label: 'status' }, { key: 'count', label: 'count' }]));

    const imageStatusDist = await groupCount('image_status');
    lines.push(`\n### image_status (sample last 5000)`);
    lines.push(mdTable(imageStatusDist, [{ key: 'key', label: 'image_status' }, { key: 'count', label: 'count' }]));

    const scopeDist = await groupCount('scope');
    lines.push(`\n### scope (sample last 5000)`);
    lines.push(mdTable(scopeDist, [{ key: 'key', label: 'scope' }, { key: 'count', label: 'count' }]));

    const typeDist = await groupCount('type');
    lines.push(`\n### type (sample last 5000)`);
    lines.push(mdTable(typeDist, [{ key: 'key', label: 'type' }, { key: 'count', label: 'count' }]));

    // --- SECTION 3: Image-only policy violations ---
    lines.push(`\n## 3) Image-only policy violations (should be ZERO in UI)`);
    const missingImageUrl = await supabase
        .from('news')
        .select('id', { count: 'exact', head: true })
        .eq('image_status', 'generated')
        .is('image_url', null);

    if (!missingImageUrl.error) {
        lines.push(`- generated BUT image_url IS NULL: **${missingImageUrl.count || 0}**`);
    } else {
        lines.push(`⚠️ Could not count generated-but-missing-url: ${missingImageUrl.error.message}`);
    }

    const activeNotGenerated = await supabase
        .from('news')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .neq('image_status', 'generated');

    if (!activeNotGenerated.error) {
        lines.push(`- ACTIVE BUT image_status != generated: **${activeNotGenerated.count || 0}**`);
    } else {
        lines.push(`⚠️ Could not count ACTIVE non-generated: ${activeNotGenerated.error.message}`);
    }

    // --- SECTION 4: Backlog / retry health ---
    lines.push(`\n## 4) Backlog & retry health`);
    const pending = await supabase
        .from('news')
        .select('id', { count: 'exact', head: true })
        .in('status', ['POOL', 'ACTIVE'])
        .neq('image_status', 'generated');

    if (!pending.error) {
        lines.push(`- Pending items (POOL/ACTIVE and not generated): **${pending.count || 0}**`);
    } else {
        lines.push(`⚠️ Could not count pending items: ${pending.error.message}`);
    }

    // attempt histogram (best effort)
    const { data: attemptRows, error: attemptErr } = await supabase
        .from('news')
        .select('image_generation_attempts')
        .in('status', ['POOL', 'ACTIVE'])
        .limit(5000);

    if (!attemptErr) {
        const hist = new Map<string, number>();
        for (const r of attemptRows || []) {
            const v = (r as any).image_generation_attempts;
            const k = (v === null || v === undefined) ? '(null)' : String(v);
            hist.set(k, (hist.get(k) || 0) + 1);
        }
        const rows = Array.from(hist.entries()).map(([k, v]) => ({ attempts: k, count: v })).sort((a, b) => Number(a.attempts) - Number(b.attempts));
        lines.push(`\n### image_generation_attempts histogram (sample last 5000 pool/active)`);
        lines.push(mdTable(rows, [{ key: 'attempts', label: 'attempts' }, { key: 'count', label: 'count' }]));
    } else {
        lines.push(`⚠️ Could not build attempts histogram: ${attemptErr.message}`);
    }

    // --- SECTION 5: Storage sanity check (HEAD a few image URLs) ---
    lines.push(`\n## 5) Storage sanity (sample HEAD checks)`);
    const sampleImgs = await supabase
        .from('news')
        .select('id, image_url')
        .eq('image_status', 'generated')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (sampleImgs.error) throw sampleImgs.error;

    const headResults: Row[] = [];
    for (const r of sampleImgs.data || []) {
        const url = r.image_url;
        let ok = 'skip';
        let status = '—';
        if (url) {
            try {
                const res = await fetch(url, { method: 'HEAD' });
                ok = res.ok ? 'OK' : 'BAD';
                status = String(res.status);
            } catch (e: any) {
                ok = 'ERR';
                status = e?.name || 'fetch_error';
            }
        }
        headResults.push({ id: r.id, head_ok: ok, status, url: url ? String(url).slice(0, 80) + '…' : '(null)' });
    }

    lines.push(mdTable(headResults, [
        { key: 'id', label: 'id' },
        { key: 'head_ok', label: 'head_ok' },
        { key: 'status', label: 'status' },
        { key: 'url', label: 'image_url (truncated)' },
    ]));

    // --- SECTION 6: User state quick peek (optional) ---
    lines.push(`\n## 6) User state sanity (optional)`);
    if (!supabaseAdmin) {
        lines.push(`- SERVICE key missing -> skipping auth admin lookup.`);
    } else {
        const adminUrl = `${SUPABASE_URL}/auth/v1/admin/users?per_page=1`;
        const res = await fetch(adminUrl, {
            headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE}`,
                apikey: SUPABASE_SERVICE,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const t = await res.text();
            lines.push(`- Auth admin users fetch failed: ${res.status} ${res.statusText} :: ${t.slice(0, 200)}`);
        } else {
            const j: any = await res.json();
            const user = Array.isArray(j?.users) ? j.users[0] : null;
            const userId = user?.id || '(none)';
            lines.push(`- Example userId: \`${String(userId).slice(0, 8)}...\``);

            const { data: st, error: stErr } = await supabase
                .from('user_news_states')
                .select('user_id, state')
                .eq('user_id', userId)
                .maybeSingle();

            if (stErr) {
                lines.push(`- user_news_states query error: ${stErr.message}`);
            } else if (!st) {
                lines.push(`- user_news_states: none for this user yet.`);
            } else {
                const hist = st.state?.history || {};
                const a = Array.isArray(hist.archived) ? hist.archived.length : 0;
                const d = Array.isArray(hist.deleted) ? hist.deleted.length : 0;
                const s = Array.isArray(hist.shown) ? hist.shown.length : 0;
                lines.push(`- user_news_states history counts: archived=${a}, deleted=${d}, shown=${s}`);
            }
        }
    }

    // --- SECTION 7: Conclusions (heuristics) ---
    lines.push(`\n## 7) Heuristic conclusions (read-only)`);
    const newestCreated = newest.data?.[0]?.created_at ? new Date(newest.data[0].created_at).getTime() : 0;
    const ageMin = newestCreated ? Math.round((Date.now() - newestCreated) / 60000) : null;

    lines.push(`- Newest created_at age: **${ageMin === null ? '—' : `${ageMin} min`}**`);
    lines.push(`- If newest age is high and Actions are paused -> “no new news” is expected.`);
    lines.push(`- Pending backlog > 0 + image_status not generated -> Image generator likely paused/stuck or failing.`);
    lines.push(`- ACTIVE but not generated > 0 -> UI must NOT show them (image-only policy).`);
    lines.push(``);

    fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
    console.log(`✅ Wrote report: ${outPath}`);
    console.log(`Open it locally to review.`);
}

main().catch((e) => {
    console.error('❌ Diagnostics failed:', e);
    process.exit(1);
});
