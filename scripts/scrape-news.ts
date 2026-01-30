
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { SOURCES, SourceConfig } from './config';
import { calculateScore } from './scorer';
import { validateUrlHealth, isDeepLink, isRecentNews } from './helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    console.log('🌍 Starting Geo-Scoped News V3...');
    let totalAdded = 0;

    for (const source of SOURCES) {
        if (!source.enabled) continue;
        console.log(`\n🔍 [${source.scope}/${source.source_id}] ${source.base_url}`);

        try {
            const html = await fetchHTML(source.base_url);
            const rawItems = await parseGeneric(html, source);
            console.log(`   Parsed: ${rawItems.length}`);

            for (const item of rawItems) {
                // Check for duplicates
                const { data: existing } = await supabase
                    .from('news')
                    .select('id')
                    .eq('link', item.link)
                    .maybeSingle();

                if (existing) continue;

                // CRITICAL: Link Health Check
                // Ensures we never capture/send broken links (404, DNS errors, etc.)
                const isAlive = await validateUrlHealth(item.link);
                if (!isAlive) {
                    console.log(`   ❌ Dead/Broken link detected: ${item.link}`);
                    continue;
                }

                // NEW: Smart Filters (Deep Link & Freshness)
                if (!isDeepLink(item.link)) {
                    console.log(`   ⚠️  Skipping landing page/root domain: ${item.link}`);
                    continue;
                }

                if (!isRecentNews(item.title + " " + item.content, item.link)) {
                    console.log(`   ⏳ Skipping old/outdated news: ${item.title}`);
                    continue;
                }

                // Calculate score
                const baseScore = source.default_priority === 'HIGH' ? 30 : source.default_priority === 'MEDIUM' ? 15 : 5;
                const analysis = calculateScore(
                    item.title + ' ' + item.content,
                    baseScore, source.scope,
                    source.default_actions,
                    source.default_priority
                );

                // Direct insert via Supabase client
                const { error } = await supabase.from('news').insert({
                    source: source.source_name,
                    source_id: source.source_id,
                    title: item.title,
                    content: item.content,
                    link: item.link,
                    image_url: 'https://placehold.co/600x400/007AFF/ffffff?text=News',
                    region: source.geo.land || 'all',
                    scope: source.scope,
                    country: source.geo.country,
                    land: source.geo.land || null,
                    city: source.geo.city || null,
                    topics: analysis.topics,
                    priority: analysis.priority,
                    actions: analysis.actions,
                    score: analysis.score,
                    dedupe_group: source.dedupe_group,
                    expires_at: analysis.expires_at.toISOString()
                });

                if (error) {
                    console.log(`   ❌ Insert error: ${error.message}`);
                } else {
                    console.log(`   + [${analysis.priority}] ${item.title.substring(0, 40)}...`);
                    totalAdded++;
                }
            }
        } catch (error: any) {
            console.error(`   ❌ ${error.message}`);
        }
    }

    console.log(`\n✅ Done. New items: ${totalAdded}`);
}

scrape();
