
import Parser from 'rss-parser';
import { supabase } from './supabaseClient';
import cityPackages from './city-packages.index.json' assert { type: 'json' };
import { SOURCE_REGISTRY } from './registries/source-registry';
type AgentKey = keyof typeof AGENT_REGISTRY;
import { AGENT_REGISTRY } from './registries/agent-registry';
import { isRecentNews, isDeepLink, validateUrlHealth } from './helpers';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
    dangerouslyAllowBrowser: true,
});

const USE_AI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key';

// --- TYPES ---

type ProcessingStage = 'COLLECT' | 'FILTER' | 'CLASSIFY' | 'ROUTE' | 'DEDUP' | 'SUMMARIZE' | 'TRANSLATE' | 'DONE';

interface ProcessedItem {
    raw: {
        title: string;
        text: string;
        url: string;
        source_id: string;
        published_at: string;
        language: 'de';
    };
    classification: {
        topics: string[];
        relevance_score: number;
    };
    routing: {
        layer: 'CITY' | 'STATE' | 'COUNTRY';
        target_state?: string;
        target_city?: string;
    };
    summary?: {
        de_summary: string;
        uk_summary: string;
        uk_title: string; // NEW: Translated Title
        action_hint: string;
    };
    stage: ProcessingStage;
}

// --- CONSTANTS ---

const UKRAINE_KEYWORDS = ['Ukraine', 'Ukrainer', 'Flüchtlinge', 'Migration', 'Aufenthalt', '§24', 'Paragraf 24', 'Schutzstatus'];
const SOCIAL_KEYWORDS = ['Jobcenter', 'Bürgergeld', 'Sozialhilfe', 'Kindergeld', 'Wohngeld'];
const WORK_KEYWORDS = ['Arbeit', 'Steuern', 'Miete', 'Integration', 'Arbeitsmarkt', 'Berufserlaubnis'];
const LEGAL_KEYWORDS = ['Bundestag', 'Bundesregierung', 'Gesetz', 'Verordnung', 'Beschluss', 'Frist'];
const ALL_KEYWORDS = [...UKRAINE_KEYWORDS, ...SOCIAL_KEYWORDS, ...WORK_KEYWORDS, ...LEGAL_KEYWORDS];
const BLOCKLIST = ['Sport', 'Wetter', 'Kultur', 'Unterhaltung', 'Gossip', 'Promi', 'Horoskop', 'Lotto'];

// --- AGENTS ---

/**
 * AGENT 0: COLLECTOR
 */
async function runCollector(): Promise<ProcessedItem[]> {
    console.log(`🤖 [${AGENT_REGISTRY.AGENT_0_COLLECTOR.name}] Starting ingestion...`);
    const parser = new Parser();
    const items: ProcessedItem[] = [];

    for (const source of SOURCE_REGISTRY) {
        try {
            console.log(`   📡 Fetching ${source.name}...`);
            const feed = await parser.parseURL(source.base_url);

            for (const item of feed.items) {
                items.push({
                    raw: {
                        title: item.title || '',
                        text: (item.contentSnippet || item.content || '').substring(0, 1000),
                        url: item.link || '',
                        source_id: source.source_id,
                        published_at: item.pubDate || new Date().toISOString(),
                        language: 'de'
                    },
                    classification: { topics: [], relevance_score: 0 },
                    routing: { layer: 'COUNTRY' },
                    stage: 'COLLECT'
                });
            }
        } catch (error) {
            console.error(`   ❌ Failed to fetch ${source.name}:`, error);
        }
    }
    console.log(`   ✅ Collected ${items.length} raw items.`);
    return items;
}

/**
 * AGENT 1: RULE FILTER
 */
async function runFilter(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [${AGENT_REGISTRY.AGENT_1_RULE_FILTER.name}] Applying strict rules...`);
    const filtered: ProcessedItem[] = [];

    for (const item of items) {
        const fullText = (item.raw.title + " " + item.raw.text).toLowerCase();

        if (BLOCKLIST.some(block => fullText.includes(block.toLowerCase()))) continue;
        if (!ALL_KEYWORDS.some(kw => fullText.includes(kw.toLowerCase()))) continue;

        if (!isDeepLink(item.raw.url)) continue;
        if (!isRecentNews(fullText, item.raw.url)) continue;

        item.stage = 'FILTER';
        filtered.push(item);
    }
    console.log(`   ✅ Passed filters: ${filtered.length} items.`);
    return filtered;
}

/**
 * AGENT 2: CLASSIFIER
 */
async function runClassifier(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [${AGENT_REGISTRY.AGENT_2_CLASSIFIER.name}] Assigning topics...`);

    return items.map(item => {
        const fullText = (item.raw.title + " " + item.raw.text).toLowerCase();
        const topics: string[] = [];
        let score = 0;

        if (UKRAINE_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))) { topics.push('Aufenthalt'); score += 30; }
        if (SOCIAL_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))) { topics.push('Soziales'); score += 25; }
        if (WORK_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))) { topics.push('Arbeit'); score += 20; }
        if (LEGAL_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))) { topics.push('Gesetzgebung'); score += 40; }

        item.classification.topics = topics;
        item.classification.relevance_score = Math.min(score, 100);
        item.stage = 'CLASSIFY';

        return item;
    });
}

/**
 * AGENT 3: ROUTER
 */
function runRouter(items: ProcessedItem[]): ProcessedItem[] {
    console.log(`🤖 [${AGENT_REGISTRY.AGENT_3_GEO_LAYER_ROUTER.name}] Routing to layers...`);
    const activeCities = cityPackages.packages.filter(p => p.status === 'active');

    return items.map(item => {
        const fullText = (item.raw.title + " " + item.raw.text).toLowerCase();

        const cityMatch = activeCities.find(c => fullText.includes(c.city.toLowerCase()));
        const landMatch = activeCities.find(c => fullText.includes(c.land.toLowerCase()));

        if (cityMatch) {
            item.routing = { layer: 'CITY', target_city: cityMatch.city, target_state: cityMatch.land };
        } else if (landMatch) {
            item.routing = { layer: 'STATE', target_state: landMatch.land };
        } else {
            item.routing = { layer: 'COUNTRY' };
        }
        item.stage = 'ROUTE';
        return item;
    });
}

/**
 * AGENT 4: DEDUP (Persistent)
 */
async function runDedup(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [${AGENT_REGISTRY.AGENT_4_DEDUP.name}] Checking Database...`);

    // 1. Local Batch Dedup
    const unique = new Map();
    items.forEach(item => {
        if (!unique.has(item.raw.url)) unique.set(item.raw.url, item);
    });
    let candidates = Array.from(unique.values());

    if (candidates.length === 0) return [];

    // 2. DB Dedup
    const { data: existing } = await supabase
        .from('news')
        .select('link')
        .in('link', candidates.map(c => c.raw.url));

    const existingSet = new Set(existing?.map(e => e.link));
    const final: ProcessedItem[] = [];

    for (const item of candidates) {
        if (existingSet.has(item.raw.url)) continue;
        item.stage = 'DEDUP';
        final.push(item);
    }
    console.log(`   ✅ Fresh items: ${final.length}`);
    return final;
}

/**
 * AGENT 5: SUMMARY AGENT
 */
async function runSummary(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [${AGENT_REGISTRY.AGENT_5_SUMMARY.name}] Generating summaries...`);

    for (const item of items) {
        let summary = "";
        let action = "";

        if (USE_AI) {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "Summarize in German (2 sentences, neutral, practical). Extract action items (deadlines) if any." },
                        { role: "user", content: item.raw.text }
                    ]
                });
                const content = response.choices[0].message.content || "";
                summary = content;
                if (content.includes("Frist") || content.includes("beachten")) action = "⚠️ Frist/Action required";
            } catch (e) {
                console.error("LLM Error:", e);
                summary = item.raw.text.substring(0, 200) + "...";
            }
        } else {
            const sentences = item.raw.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
            summary = sentences.slice(0, 2).join('. ') + '.';
            if (item.raw.text.toLowerCase().includes("frist")) action = "⚠️ Achtung: Frist beachten";
        }

        item.summary = {
            de_summary: summary,
            uk_summary: "",
            uk_title: "",
            action_hint: action
        };
        item.stage = 'SUMMARIZE';
    }
    return items;
}

/**
 * AGENT 6: TRANSLATION AGENT (With Title Translation)
 */
async function runTranslation(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [${AGENT_REGISTRY.AGENT_6_TRANSLATION.name}] Translating...`);

    for (const item of items) {
        if (USE_AI) {
            try {
                // 1. Translate Summary
                const sumResp = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "Translate to Ukrainian. Official tone. Keep dates/laws exact." },
                        { role: "user", content: item.summary?.de_summary || "" }
                    ]
                });
                item.summary!.uk_summary = sumResp.choices[0].message.content || "";

                // 2. Translate Title (NEW!)
                const titleResp = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "Translate headline to Ukrainian. Shorter is better." },
                        { role: "user", content: item.raw.title }
                    ]
                });
                item.summary!.uk_title = titleResp.choices[0].message.content || "";

            } catch (e) {
                item.summary!.uk_summary = "[UA Fail] " + item.summary?.de_summary;
                item.summary!.uk_title = item.raw.title;
            }
        } else {
            // Mock
            item.summary!.uk_summary = "[UA Mock] " + item.summary?.de_summary;
            item.summary!.uk_title = "[UA Mock] " + item.raw.title;
        }
        item.stage = 'TRANSLATE';
    }
    return items;
}

/**
 * FINALIZER: INSERT DB
 */
async function runInsertion(items: ProcessedItem[]) {
    console.log("💾 [Finalizer] Inserting into Database...");
    let count = 0;
    for (const item of items) {
        if (item.stage !== 'TRANSLATE') continue;
        try {
            const { error } = await supabase.from('news').insert({
                source: `L6_${item.raw.source_id}`,
                source_id: item.raw.url,

                // USE TRANSLATED TITLE
                title: item.summary?.uk_title || item.raw.title,

                content: `${item.summary?.uk_summary}\n\nHint: ${item.summary?.action_hint}\n\nOriginal: ${item.raw.title}`,
                link: item.raw.url,
                image_url: 'https://placehold.co/600x400/0057B8/FFCC00?text=UA+News',

                // MAP HINT TO ACTIONS ARRAY FOR UI BADGES
                actions: item.summary?.action_hint ? ['deadline', 'info'] : [],

                city: item.routing.target_city || null,
                land: item.routing.target_state || null,
                country: 'DE',
                scope: item.routing.layer,
                topics: item.classification.topics,
                priority: item.classification.relevance_score > 50 ? 'HIGH' : 'MEDIUM',
                dedupe_group: `L6_${item.raw.url}`
            });
            if (!error) count++;
        } catch (e) { }
    }
    console.log(`✅ Inserted ${count} items.`);
}

async function cycle() {
    console.log("\n🚀 L6 ORCHESTRATOR START\n");
    let pipeline = await runCollector();
    pipeline = await runFilter(pipeline);
    pipeline = await runClassifier(pipeline);
    pipeline = runRouter(pipeline);
    pipeline = await runDedup(pipeline);
    pipeline = await runSummary(pipeline);
    pipeline = await runTranslation(pipeline);
    await runInsertion(pipeline);
}

cycle();
