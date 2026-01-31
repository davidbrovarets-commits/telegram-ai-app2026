/**
 * News Scraper v4 - With Full Agent Pipeline
 * 
 * Pipeline:
 * 1. Agent 0: Collector (fetch HTML, parse articles)
 * 2. Agent 1: Rule Filter (keyword matching)
 * 3. Agent 2: Classifier (type, topics, relevance)
 * 4. Agent 4: Dedup (similarity check)
 * 5. Agent 5+6: Summary + Translation (Vertex AI Claude)
 */

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { SOURCES, SourceConfig } from './config';
import { validateUrlHealth, isDeepLink, isRecentNews } from './helpers';

// Import Agents
import { passesFilter } from './agents/filter';
import { classify } from './agents/classifier';
import { findDuplicate } from './agents/dedup';
import { summarizeAndTranslate, summarizeAndTranslateMock } from './agents/summarizer';
import { sendAlert } from './utils/telegram-notifier';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const useMockSummary = process.env.MOCK_SUMMARY === 'true';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Stats tracking
const stats = {
    fetched: 0,
    filtered: 0,
    duplicates: 0,
    lowRelevance: 0,
    added: 0,
    errors: 0,
    totalCost: 0
};

async function fetchHTML(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
}

async function parseGeneric(html: string, config: SourceConfig): Promise<any[]> {
    const $ = cheerio.load(html);
    const items: any[] = [];

    $('article, .news-item, .entry, .teaser, .row-fluid, .content-block, .c-teaser, h2, h3').each((i, el) => {
        const title = $(el).find('h2, h3, .title, strong, a').first().text().trim();
        const link = $(el).find('a').attr('href') || $(el).closest('a').attr('href');
        const desc = $(el).find('p, .teaser-text, .summary').first().text().trim();

        if (title && title.length > 10 && link) {
            items.push({
                title: title.substring(0, 200),
                link: link.startsWith('http') ? link : new URL(link, config.base_url).toString(),
                content: (desc || title).substring(0, 500)
            });
        }
    });
    return items.slice(0, 15);
}

async function scrape() {
    console.log('🌍 News Scraper v4 - Agent Pipeline');
    console.log(`   Mock Summary: ${useMockSummary ? 'ON' : 'OFF (using Vertex AI Claude)'}`);
    console.log('');

    // Pre-fetch existing titles for dedup
    const { data: existingNews } = await supabase
        .from('news')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(500);

    const existingItems = existingNews || [];
    console.log(`📚 Loaded ${existingItems.length} existing titles for dedup\n`);

    // FILTERING LOGIC
    const filterScope = process.env.FILTER_SCOPE; // e.g. 'CITY', 'LAND', 'DE'
    const filterId = process.env.FILTER_ID; // e.g. 'leipzig'

    const activeSources = SOURCES.filter(s => {
        if (!s.enabled) return false;
        if (filterScope && s.scope !== filterScope) return false;
        if (filterId && !s.source_id.includes(filterId)) return false;
        return true;
    });

    console.log(`🌍 Active Sources: ${activeSources.length} (Filter: Scope=${filterScope || 'ALL'}, ID=${filterId || 'ALL'})`);

    for (const source of activeSources) {
        console.log(`\n🔍 [${source.scope}/${source.source_id}] ${source.base_url}`);

        try {
            // === AGENT 0: COLLECTOR ===
            const html = await fetchHTML(source.base_url);
            const rawItems = await parseGeneric(html, source);
            stats.fetched += rawItems.length;
            console.log(`   📥 Fetched: ${rawItems.length} items`);

            for (const item of rawItems) {
                const combinedText = item.title + ' ' + item.content;

                // === AGENT 1: RULE FILTER ===
                const filterResult = passesFilter(combinedText);
                if (!filterResult.passes) {
                    stats.filtered++;
                    continue; // STOP: Not relevant
                }

                // === AGENT 4: DEDUP ===
                const dupResult = findDuplicate(item.title, existingItems);
                if (dupResult.isDuplicate) {
                    stats.duplicates++;
                    console.log(`   ⏭️ Duplicate (${Math.round(dupResult.similarity * 100)}%): ${item.title.substring(0, 40)}...`);
                    continue; // STOP: Already exists
                }

                // === AGENT 2: CLASSIFIER ===
                const classification = classify(combinedText, filterResult.hits, {
                    default_priority: source.default_priority
                });

                if (classification.relevance_score < 30) {
                    stats.lowRelevance++;
                    console.log(`   ⬇️ Low relevance (${classification.relevance_score}): ${item.title.substring(0, 40)}...`);
                    continue; // STOP: Low relevance
                }

                // Check link health
                const isAlive = await validateUrlHealth(item.link);
                if (!isAlive) {
                    console.log(`   ❌ Dead link: ${item.link.substring(0, 60)}...`);
                    stats.errors++;
                    continue;
                }

                // Smart filters
                if (!isDeepLink(item.link)) {
                    console.log(`   ⏭️ Shallow link: ${item.link.substring(0, 60)}...`);
                    stats.filtered++;
                    continue;
                }
                if (!isRecentNews(combinedText, item.link)) {
                    console.log(`   ⏭️ Old news: ${item.title.substring(0, 40)}...`);
                    stats.filtered++;
                    continue;
                }

                // === AGENT 5+6: SUMMARY + TRANSLATION ===
                console.log(`   🤖 Summarizing: ${item.title.substring(0, 50)}...`);
                const summaryFn = useMockSummary ? summarizeAndTranslateMock : summarizeAndTranslate;
                const summary = await summaryFn({
                    title: item.title,
                    content: item.content
                });
                // NEW: Strict content check to prevent German fallbacks
                if (!summary.uk_summary || summary.uk_summary.length < 20) {
                    console.log(`   ⚠️ Translation incomplete/failed. Siking insert to enforce Ukrainian compliance.`);
                    console.log(`      Res: ${JSON.stringify(summary).substring(0, 100)}...`);
                    stats.errors++;
                    continue; // SKIP: Do not allow untranslated content
                }

                // Parse Headline and Body from UK Summary
                const [ukHeadline, ...ukBodyParts] = summary.uk_summary.split('\n\n');
                const ukBody = ukBodyParts.join('\n\n') || summary.uk_summary; // Fallback if no split

                // --- 5. Generate Embedding (Vector Search) ---
                let embedding: number[] | null = null;
                const textToEmbed = `${item.title}\n${summary.uk_summary}`;

                try {
                    embedding = await generateEmbedding(textToEmbed);

                    // --- 5.1 Semantic Deduplication Check ---
                    if (embedding) {
                        const { data: semDupes } = await supabase.rpc('match_news', {
                            query_embedding: embedding,
                            match_threshold: 0.85, // 85% similarity (High threshold for "Same Story")
                            match_count: 1
                        });

                        if (semDupes && semDupes.length > 0) {
                            console.log(`   🔁 SEMANTIC DUPLICATE detected (Score: ${semDupes[0].similarity.toFixed(2)}). Skipping.`);
                            stats.duplicates++;
                            continue;
                        }
                    }
                } catch (e) {
                    console.warn('   ⚠️ Vector ops failed:', e);
                }

                // Prepare insert data
                const publishedAt = new Date().toISOString();
                const todayKey = new Date().toISOString().split('T')[0];

                const { error } = await supabase.from('news').insert({
                    // Basic fields - OVERWRITTEN WITH UKRAINIAN
                    source: source.source_name,
                    source_id: source.source_id,
                    title: ukHeadline || summary.uk_summary, // Enforce UK Headline
                    content: ukBody, // Enforce UK Body
                    link: item.link,
                    image_url: 'https://placehold.co/600x400/007AFF/ffffff?text=News',
                    region: source.geo.land || 'all',

                    // L6 Fields
                    type: classification.type,
                    status: 'POOL',
                    published_at: publishedAt,
                    day_key: todayKey,
                    priority: classification.relevance_score > 70 ? 'HIGH' :
                        classification.relevance_score > 50 ? 'MEDIUM' : 'LOW',

                    // Geo fields
                    scope: source.scope,
                    country: source.geo.country,
                    land: source.geo.land || null,
                    city: source.geo.city || null,

                    // Agent results
                    topics: classification.topics,
                    keyword_hits: filterResult.hits,
                    relevance_score: classification.relevance_score,

                    // Summary fields (Agent 5+6)
                    de_summary: summary.de_summary,
                    uk_summary: summary.uk_summary,
                    action_hint: summary.action_hint,

                    // Vector Embedding
                    embedding: embedding,

                    // Meta
                    dedupe_group: source.dedupe_group,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                });

                if (!error) {
                    // --- 7. Push Notification Check ---
                    const insertedItem = {
                        id: 0, // We need ID, but insert doesn't return it unless we ask.
                        // Actually, we can just use enough data for push
                        // But wait, the push payload needs ID for deep link? Yes.
                        // I should use .select().single() in insert
                        title: ukHeadline || summary.uk_summary,
                        uk_summary: summary.uk_summary,
                        priority: classification.relevance_score > 70 ? 'HIGH' : 'MEDIUM',
                        city: source.geo.city || null,
                        land: source.geo.land || null,
                        score: classification.relevance_score
                    };

                    // We can't easily get the New ID without refactoring insert to .select().
                    // For now, let's just trigger it. Client can link to "Latest".
                    // Or I refactor insert.
                    // Let's refactor insert to return ID.
                }

                if (error) {
                    console.log(`   ❌ Insert error: ${error.message}`);
                    stats.errors++;
                } else {
                    console.log(`   ✅ [${classification.type}] ${item.title.substring(0, 40)}...`);
                    stats.added++;

                    // Trigger Alert (Non-blocking)
                    sendAlert({
                        title: ukHeadline || summary.uk_summary,
                        uk_summary: summary.uk_summary,
                        priority: classification.relevance_score > 70 ? 'HIGH' : 'MEDIUM',
                        score: classification.relevance_score,
                        city: source.geo.city || null,
                        land: source.geo.land || null,
                    }).catch(e => console.error(e));

                    // Add to existing for future dedup
                    existingItems.push({ id: 0, title: item.title });
                }
            }
        } catch (error: any) {
            console.error(`   ❌ Source error: ${error.message}`);
            stats.errors++;
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SCRAPE SUMMARY');
    console.log('='.repeat(50));
    console.log(`   Fetched:      ${stats.fetched}`);
    console.log(`   Filtered:     ${stats.filtered} (no keywords)`);
    console.log(`   Duplicates:   ${stats.duplicates}`);
    console.log(`   Low Relevance: ${stats.lowRelevance}`);
    console.log(`   Errors:       ${stats.errors}`);
    console.log(`   ✅ Added:     ${stats.added}`);
    console.log(`   💰 Est. Cost: $${stats.totalCost.toFixed(4)}`);
    console.log('='.repeat(50));
}

scrape();
