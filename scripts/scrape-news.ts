
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import { SOURCES, SourceConfig } from './config';
import { calculateScore, ScoredItem } from './scorer';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchHTML(url: string) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
}

// --- PARSERS ---

async function parseGeneric(html: string, config: SourceConfig): Promise<any[]> {
    const $ = cheerio.load(html);
    const items: any[] = [];
    const selector = config.parser_config?.selector || 'article, .news-item, .entry, .teaser, .row-fluid, .content-block';

    $(selector).each((i, el) => {
        const title = $(el).find('h2, h3, .title, strong').first().text().trim();
        const link = $(el).find('a').attr('href');
        const desc = $(el).find('p, .teaser-text, .summary').first().text().trim();

        if (title && link) {
            items.push({
                title,
                link: link.startsWith('http') ? link : new URL(link, config.url).toString(),
                content: desc || title,
                date: new Date().toISOString()
            });
        }
    });
    return items;
}

async function parseBAMF(html: string, config: SourceConfig): Promise<any[]> {
    const $ = cheerio.load(html);
    const items: any[] = [];
    $('.c-teaser, .teaser, .c-teasers-list__item, article').each((i, el) => {
        const title = $(el).find('h3, h2, .title').first().text().trim();
        const link = $(el).find('a').attr('href');
        const desc = $(el).find('p').first().text().trim();
        if (title && link) {
            items.push({
                title,
                link: link.startsWith('http') ? link : new URL(link, 'https://www.bamf.de').toString(),
                content: desc || title,
                date: new Date().toISOString()
            });
        }
    });
    return items;
}

// --- CURL HELPER ---
function insertViaCurl(item: any, analysis: ScoredItem, source: any) {
    if (!accessToken) return false;
    const projectRef = process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1];
    if (!projectRef) return false;

    const escape = (str: any) => str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL';
    const arrayToSql = (arr: string[]) => arr?.length ? `'{${arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}'` : "'{}'";

    const sql = `INSERT INTO news (source, title, content, link, image_url, region, scope, country, land, city, topics, priority, actions, score, created_at) VALUES (${escape(source.source_name)}, ${escape(item.title)}, ${escape(item.content)}, ${escape(item.link)}, ${escape('https://placehold.co/600x400/007AFF/ffffff?text=News')}, ${escape(source.geo.land || 'all')}, ${escape(source.scope)}, ${escape(source.geo.country)}, ${escape(source.geo.land)}, ${escape(source.geo.city)}, ${arrayToSql(analysis.topics)}, ${escape(analysis.priority)}, ${arrayToSql(analysis.actions)}, ${analysis.score}, NOW());`;

    const payloadFile = path.resolve(process.cwd(), `temp_insert_${Date.now()}.json`);
    fs.writeFileSync(payloadFile, JSON.stringify({ query: sql }));

    try {
        const cmd = `curl.exe --ssl-no-revoke -X POST "https://api.supabase.com/v1/projects/${projectRef}/query" -H "Authorization: Bearer ${accessToken}" -H "Content-Type: application/json" -d "@${payloadFile}"`;
        execSync(cmd, { stdio: 'ignore' }); // silent
        fs.unlinkSync(payloadFile);
        return true;
    } catch (e) {
        // console.error(e);
        if (fs.existsSync(payloadFile)) fs.unlinkSync(payloadFile);
        return false;
    }
}

// --- MAIN ENGINE ---

async function scrape() {
    console.log('🌍 Starting Geo-Scoped News Scrape (V2) - Curl Mode...');
    let totalAdded = 0;

    for (const source of SOURCES) {
        if (!source.enabled) continue;
        console.log(`\n🔍 Scraping: [${source.scope}/${source.id}] ${source.url}`);

        try {
            const html = await fetchHTML(source.url);
            let rawItems: any[] = [];

            switch (source.parser) {
                case 'bamf': rawItems = await parseBAMF(html, source); break;
                default: rawItems = await parseGeneric(html, source);
            }

            console.log(`   Items parsed: ${rawItems.length}`);

            for (const item of rawItems) {
                const analysis: ScoredItem = calculateScore(item.title + ' ' + item.content, source.baseScore, source.scope);

                const { data: existing } = await supabase.from('news').select('id').eq('link', item.link).maybeSingle();

                if (!existing) {
                    const success = insertViaCurl(item, analysis, source);
                    if (success) {
                        console.log(`   + [${analysis.priority}] ${item.title.substring(0, 40)}...`);
                        totalAdded++;
                    }
                }
            }

        } catch (error: any) {
            console.error(`   ❌ Error scraping ${source.id}:`, error.message);
        }
    }

    console.log(`\n✅ Scrape Complete. Total new items: ${totalAdded}`);
}

scrape();
