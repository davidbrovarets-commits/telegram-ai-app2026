
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import path from 'path';
import { SOURCES } from './config';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const parser = new Parser();

async function scrape() {
    console.log('📰 Starting news scrape (3.0 Fixed)...');
    let totalAdded = 0;

    for (const source of SOURCES) {
        console.log(`\n🔍 Scraping: ${source.region} - ${source.parser} (${source.url})`);

        try {
            let items: any[] = [];

            if (source.type === 'rss') {
                try {
                    const feed = await parser.parseURL(source.url);
                    console.log(`   RSS: Found ${feed.items.length} items.`);
                    items = feed.items.map(item => ({
                        title: item.title,
                        link: item.link,
                        date: item.pubDate,
                        content: item.contentSnippet || item.content || '',
                        source: 'Deutsche Welle (UKR)',
                        region: source.region,
                        category: source.category
                    }));
                } catch (e) {
                    console.error(`   RSS Error: ${e.message}`);
                }
            } else {
                // HTML Scraping
                const response = await fetch(source.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const html = await response.text();
                const $ = cheerio.load(html);
                console.log(`   HTML Loaded. Length: ${html.length}`);

                if (source.parser === 'jc_brandenburg') {
                    $('a').each((i, el) => {
                        const title = $(el).text().trim();
                        const link = $(el).attr('href');
                        if (title && link && title.length > 25 && !title.includes('Impressum') && (link.includes('nachrichten') || /\d+/.test(link))) {
                            items.push({
                                title,
                                link: link.startsWith('http') ? link : `https://www.jc-brandenburg.de${link}`,
                                source: 'Jobcenter Brandenburg',
                                region: source.region,
                                category: source.category,
                                content: 'Новини Jobcenter'
                            });
                        }
                    });
                } else if (source.parser === 'bamf') {
                    const teasers = $('.c-teaser, .teaser, .c-teasers-list__item, article');
                    console.log(`   BAMF Teasers (generic): ${teasers.length}`);

                    if (teasers.length > 0) {
                        teasers.each((i, el) => {
                            const title = $(el).find('h3, h2, .title').first().text().trim();
                            const link = $(el).find('a').attr('href');
                            const date = $(el).find('time, .date, .c-meta__date').text().trim();

                            if (title && link) {
                                items.push({
                                    title,
                                    link: link.startsWith('http') ? link : `https://www.bamf.de${link}`,
                                    date,
                                    source: 'BAMF',
                                    region: source.region,
                                    category: source.category,
                                    content: $(el).find('p').text().trim() || title
                                });
                            }
                        });
                    } else {
                        // Fallback
                        $('.main-content a, main a').each((i, el) => {
                            const title = $(el).text().trim();
                            const link = $(el).attr('href');
                            if (title.length > 30 && link) {
                                items.push({
                                    title,
                                    link: link.startsWith('http') ? link : `https://www.bamf.de${link}`,
                                    source: 'BAMF',
                                    region: source.region,
                                    category: source.category,
                                    content: title
                                });
                            }
                        });
                    }
                } else if (source.parser === 'dw_html') {
                    const articles = $('article, .teaser, .news-item');
                    console.log(`   DW Articles: ${articles.length}`);

                    if (articles.length > 0) {
                        articles.each((i, el) => {
                            const title = $(el).find('h3, h2, span').first().text().trim();
                            const link = $(el).find('a').attr('href');
                            const teaser = $(el).find('p').text().trim();

                            if (title && link) {
                                items.push({
                                    title,
                                    link: link.startsWith('http') ? link : `https://www.dw.com${link}`,
                                    content: teaser || title,
                                    source: 'Deutsche Welle',
                                    region: source.region,
                                    category: source.category
                                });
                            }
                        });
                    } else {
                        // Fallback DW
                        $('a').each((i, el) => {
                            const title = $(el).find('h3, h2').text().trim() || $(el).text().trim();
                            const link = $(el).attr('href');
                            if (title && link && title.length > 20 && (link.includes('/uk/') || link.includes('/a-'))) {
                                items.push({
                                    title,
                                    link: link.startsWith('http') ? link : `https://www.dw.com${link}`,
                                    content: 'DW News',
                                    source: 'Deutsche Welle',
                                    region: source.region,
                                    category: source.category
                                });
                            }
                        });
                    }
                }
            }

            console.log(`   Items extracted: ${items.length}`);

            // Insert into Supabase
            for (const item of items) {
                // IMPROVED CHECK: Check by link Only
                const { data: existing } = await supabase
                    .from('news')
                    .select('id')
                    .eq('link', item.link)
                    .maybeSingle();

                if (!existing) {
                    const { error } = await supabase
                        .from('news')
                        .insert({
                            title: item.title,
                            content: item.content || item.title,
                            source: item.source,
                            region: item.region,
                            link: item.link,
                            created_at: new Date().toISOString()
                        });

                    if (!error) {
                        console.log(`   + Added: ${item.title.substring(0, 40)}...`);
                        totalAdded++;
                    } else {
                        console.error(`   ! Insert Error on ${item.title}:`, error.message);
                    }
                } else {
                    // Log ONLY if user needs to know, otherwise keep silent
                    // console.log('   . Skipped (Exists)');
                }
            }

        } catch (error) {
            console.error(`   ❌ Failed to scrape ${source.url}:`, error.message);
        }
    }

    console.log(`\n✅ Done. Total new items: ${totalAdded}`);
}

scrape();
