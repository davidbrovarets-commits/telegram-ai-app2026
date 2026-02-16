
import { SOURCE_REGISTRY } from './registries/source-registry';
import Parser from 'rss-parser';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIG ---
const IS_CI = process.env.CI === 'true';
const TIMEOUT = 8000;
const MAX_CONCURRENT = 5;

// --- TYPES ---
type ValidationResult = 'VALID_FEED' | 'INVALID_FEED' | 'BLOCKED' | 'NONE' | 'SKIPPED';
type FeedType = 'RSS' | 'ATOM' | 'JSON' | 'UNKNOWN';

interface SourceInventory {
    source_id: string;
    level: string; // derived from ID prefix (sn_ = LAND, city_ = CITY, etc, though registry doesn't have explicit level, we can infer or just report id)
    current_url: string;
    url_type: 'HTML' | 'RSS_CANDIDATE';
    discovered_feed_url: string | null;
    validation_result: ValidationResult;
    evidence: string;
}

// --- HELPER: Infer Level ---
function inferLevel(id: string): string {
    if (id.startsWith('breg_') || id.startsWith('tagesschau') || id.startsWith('zeit') || id.startsWith('spiegel')) return 'COUNTRY';
    if (id.includes('_')) return 'BUNDESLAND'; // Default assumption for xx_yyyy
    return 'UNKNOWN';
}

function isRssCandidate(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.endsWith('.xml') || lower.endsWith('.rss') || lower.includes('/rss') || lower.includes('/feed') || lower.includes('.rdf');
}

// --- NETWORK HELPERS ---
async function fetchWithTimeout(url: string): Promise<{ ok: boolean, text: string, status: number, contentType: string | null }> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const text = await res.text();
        return {
            ok: res.ok,
            text,
            status: res.status,
            contentType: res.headers.get('content-type')
        };
    } catch (e: any) {
        return { ok: false, text: '', status: e.name === 'AbortError' ? 408 : 0, contentType: null };
    } finally {
        clearTimeout(id);
    }
}

// --- DISCOVERY LOGIC ---
async function discoverFeed(url: string): Promise<{ url: string | null, evidence: string }> {
    // 1. Fetch HTML
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
        if (res.status === 403 || res.status === 429) return { url: null, evidence: `blocked:${res.status}` };
        return { url: null, evidence: `fetch_fail:${res.status}` };
    }

    const html = res.text;

    // 2. Scan <link> tags
    // <link rel="alternate" type="application/rss+xml" title="..." href="...">
    const linkRegex = /<link[^>]+rel=["']alternate["'][^>]+type=["']application\/(rss\+xml|atom\+xml)["'][^>]+href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        let feedUrl = match[2];
        // Handle relative URLs
        try {
            feedUrl = new URL(feedUrl, url).href;
            return { url: feedUrl, evidence: 'link[alternate]' };
        } catch (e) {
            // ignore invalid url construction
        }
    }

    // 3. Fallback Heuristics
    const variations = [
        '/rss', '/feed', '/rss.xml', '/index.rss', '/feed.xml', '/news/rss', '/service/rss'
    ];

    // Check variations in parallel? No, valid link tags are better. Let's do common patterns if link tag failed.
    // For specific German media, common patterns:
    // /feed, /rss, /rss-feed

    // We can try probing a few common ones
    const baseUrl = new URL(url).origin;
    for (const v of variations) {
        const candidate = `${baseUrl}${v}`;
        // Verify (light HEAD or GET)
        // We defer full verification to the validation step, but we need to know if it EXISTS here.
        // Let's just return the first valid XML response?
        // Actually, scanning all candidates is expensive.
        // Let's rely on the validation step to confirm.
        // For widely used patterns, we can construct ONE candidate if the URL structure strongly suggests it.
        // But scraping is safer. Not guessing.
    }

    return { url: null, evidence: 'no_link_tag' };
}

// --- VALIDATION LOGIC ---
async function validateFeed(url: string): Promise<{ result: ValidationResult, type: FeedType }> {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
        if (res.status === 403 || res.status === 429) return { result: 'BLOCKED', type: 'UNKNOWN' };
        return { result: 'INVALID_FEED', type: 'UNKNOWN' };
    }

    const text = res.text.trim();
    if (text.startsWith('<rss') || text.includes('<rss version')) return { result: 'VALID_FEED', type: 'RSS' };
    if (text.startsWith('<feed') || text.includes('<feed xmlns')) return { result: 'VALID_FEED', type: 'ATOM' };
    if (text.startsWith('<?xml')) {
        if (text.includes('<rss')) return { result: 'VALID_FEED', type: 'RSS' };
        if (text.includes('<feed')) return { result: 'VALID_FEED', type: 'ATOM' };
    }

    return { result: 'INVALID_FEED', type: 'UNKNOWN' };
}

// --- MAIN ---
async function main() {
    console.log('--- STARTING RSS DISCOVERY ---');
    const items: SourceInventory[] = [];

    // 1. Inventory
    console.log(`Inventorying ${SOURCE_REGISTRY.length} sources...`);
    for (const s of SOURCE_REGISTRY) {
        const isRss = isRssCandidate(s.base_url);
        items.push({
            source_id: s.source_id,
            level: inferLevel(s.source_id),
            current_url: s.base_url,
            url_type: isRss ? 'RSS_CANDIDATE' : 'HTML',
            discovered_feed_url: isRss ? s.base_url : null, // If already RSS, it is its own discovery
            validation_result: 'SKIPPED',
            evidence: ''
        });
    }

    const htmlCandidates = items.filter(i => i.url_type === 'HTML');
    console.log(`Found ${htmlCandidates.length} HTML candidates to probe.`);

    // 2. Discovery Loop (Concurrent Batches)
    // We'll process HTML candidates
    let processed = 0;
    while (processed < htmlCandidates.length) {
        const batch = htmlCandidates.slice(processed, processed + MAX_CONCURRENT);
        await Promise.all(batch.map(async (item) => {
            console.log(`Probing [${item.source_id}] ${item.current_url}...`);
            const { url, evidence } = await discoverFeed(item.current_url);
            item.evidence = evidence;

            if (url) {
                console.log(`   -> Found candidate: ${url}`);
                // Validate
                const val = await validateFeed(url);
                item.discovered_feed_url = url;
                item.validation_result = val.result;
            } else {
                console.log(`   -> No feed found (${evidence})`);
                item.validation_result = 'NONE';
            }
        }));
        processed += MAX_CONCURRENT;
    }

    // 3. Re-verify "RSS_CANDIDATE" sources (sanity check)
    // Optional, but good to know if current RSS config is actually valid
    // Let's only do it for a small sample or all? The task didn't explicitly demand validating EXISTING RSS, 
    // but the goal says "DISCOVER correct RSS... for HTML sources".
    // We will stick to HTML sources to save time/bandwidth, as requested.

    // 4. Report Generation
    console.log('Generating Report...');
    generateReport(items);
}

function generateReport(items: SourceInventory[]) {
    const htmlItems = items.filter(i => i.url_type === 'HTML');
    const validDiscovered = htmlItems.filter(i => i.validation_result === 'VALID_FEED');
    const noFeed = htmlItems.filter(i => i.validation_result !== 'VALID_FEED');

    const md = `
# RSS FEED DISCOVERY REPORT (READ-ONLY) — ${new Date().toISOString()}

## 1. Executive Summary
- **Total Sources Analyzed**: ${items.length}
- **HTML Sources (Incorrect Config)**: ${items.filter(i => i.url_type === 'HTML').length}
- **Feeds Successfully Discovered**: ${validDiscovered.length}
- **No Feed Found / Blocked**: ${noFeed.length}

## 2. Inventory Stats
| Level | Total | HTML Configured | Discovery Success |
| :--- | :--- | :--- | :--- |
| COUNTRY | ${items.filter(i => i.level === 'COUNTRY').length} | ${items.filter(i => i.level === 'COUNTRY' && i.url_type === 'HTML').length} | ${validDiscovered.filter(i => i.level === 'COUNTRY').length} |
| BUNDESLAND | ${items.filter(i => i.level === 'BUNDESLAND').length} | ${items.filter(i => i.level === 'BUNDESLAND' && i.url_type === 'HTML').length} | ${validDiscovered.filter(i => i.level === 'BUNDESLAND').length} |

## 3. Discovered Feeds (Actionable Replacements)
| Source ID | Current HTML URL | Discovered RSS Feed | Evidence |
| :--- | :--- | :--- | :--- |
${validDiscovered.map(i => `| **${i.source_id}** | \`${i.current_url}\` | \`${i.discovered_feed_url}\` | ${i.evidence} |`).join('\n')}

## 4. No Feed Found (Manual Intervention Required)
| Source ID | Current URL | Failure Reason |
| :--- | :--- | :--- |
${noFeed.map(i => `| ${i.source_id} | \`${i.current_url}\` | ${i.evidence} |`).join('\n')}

`;

    const outPath = path.join('docs', 'audits', 'RSS_DISCOVERY_REPORT.md');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, md);
    console.log(`Report saved to ${outPath}`);
}

main();
