
import Parser from 'rss-parser';
import { supabase } from './supabaseClient';
import cityPackages from './city-packages.index.json' assert { type: 'json' };
import { SOURCE_REGISTRY } from './registries/source-registry';
import { isRecentNews, isDeepLink, validateUrlHealth } from './helpers';

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
 * Ingests articles from SOURCE_REGISTRY.
 */
async function runCollector(): Promise<ProcessedItem[]> {
    console.log("🤖 [Agent 0: Collector] Starting ingestion...");
    const parser = new Parser();
    const items: ProcessedItem[] = [];

    for (const source of SOURCE_REGISTRY) {
        try {
            console.log(`   📡 Fetching ${source.name}...`);
            const feed = await parser.parseURL(source.base_url);

            for (const item of feed.items) {
                // Normalize to strict Data Contract
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
                    routing: { layer: 'COUNTRY' }, // Default
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
 * Applies strict filers (Freshness, DeepLink, Keywords).
 */
async function runFilter(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log("🤖 [Agent 1: Filter] Applying strict rules...");
    const filtered: ProcessedItem[] = [];

    for (const item of items) {
        const fullText = (item.raw.title + " " + item.raw.text).toLowerCase();

        // 1. Blocklist check
        if (BLOCKLIST.some(block => fullText.includes(block.toLowerCase()))) continue;

        // 2. Keyword check (Must match AT LEAST ONE mandatory keyword)
        if (!ALL_KEYWORDS.some(kw => fullText.includes(kw.toLowerCase()))) continue;

        // 3. Smart Filters (Helpers)
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
 * Assigns topics and scores relevance.
 */
function runClassifier(items: ProcessedItem[]): ProcessedItem[] {
    console.log("🤖 [Agent 2: Classifier] Assigning topics...");

    return items.map(item => {
        const fullText = (item.raw.title + " " + item.raw.text).toLowerCase();
        const topics: string[] = [];
        let score = 0;

        if (UKRAINE_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))) { topics.push('Aufenthalt'); score += 30; }
        if (SOCIAL_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))) { topics.push('Soziales'); score += 25; }
        if (WORK_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))) { topics.push('Arbeit'); score += 20; }
        if (LEGAL_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))) { topics.push('Gesetzgebung'); score += 40; } // High priority

        item.classification.topics = topics;
        item.classification.relevance_score = Math.min(score, 100);
        item.stage = 'CLASSIFY';

        return item;
    });
}

/**
 * AGENT 3: ROUTER
 * Determines Routing Layer (CITY vs STATE vs COUNTRY).
 */
function runRouter(items: ProcessedItem[]): ProcessedItem[] {
    console.log("🤖 [Agent 3: Router] Routing to layers...");
    const activeCities = cityPackages.packages.filter(p => p.status === 'active');

    return items.map(item => {
        const fullText = (item.raw.title + " " + item.raw.text).toLowerCase();

        // A. CITY CHECK
        // We look for explicit city mentions. Strict.
        const cityMatch = activeCities.find(c => fullText.includes(c.city.toLowerCase()));

        // B. STATE CHECK
        const landMatch = activeCities.find(c => fullText.includes(c.land.toLowerCase()));

        if (cityMatch) {
            item.routing = { layer: 'CITY', target_city: cityMatch.city, target_state: cityMatch.land };
        } else if (landMatch) {
            item.routing = { layer: 'STATE', target_state: landMatch.land };
        } else {
            // C. COUNTRY CHECK (Default for National Sources)
            item.routing = { layer: 'COUNTRY' };
        }

        item.stage = 'ROUTE';
        return item;
    });
}

/**
 * AGENT 4: DEDUP (Hash-based simulation)
 * Prevents duplicates.
 */
async function runDedup(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log("🤖 [Agent 4: Dedup] Removing duplicates...");
    // Simulating checking DB for existing URLs
    // In production this would query Supabase for `source_id` or similarity

    // For now, simple unique by URL in this batch
    const unique = new Map();
    items.forEach(item => {
        if (!unique.has(item.raw.url)) {
            unique.set(item.raw.url, item);
        }
    });

    const result = Array.from(unique.values());
    result.forEach(i => i.stage = 'DEDUP');

    console.log(`   ✅ Unique items: ${result.length}`);
    return result;
}

/**
 * AGENT 5: SUMMARY AGENT
 * Generates neutral summary and action hint.
 */
async function runSummary(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log("🤖 [Agent 5: Summary] Generating summaries...");
    // TODO: Connect LLM here. For now, we use smart extraction.

    return items.map(item => {
        // Simple extraction strategy (First 2 sentences)
        const sentences = item.raw.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const summary = sentences.slice(0, 2).join('. ') + '.';

        let action = "";
        const lower = item.raw.text.toLowerCase();
        if (lower.includes("frist") || lower.includes("bis zum") || lower.includes("deadline")) {
            action = "⚠️ Achtung: Frist beachten / Зверніть увагу na termin.";
        }

        item.summary = {
            de_summary: summary,
            // Placeholder for translation
            uk_summary: "",
            action_hint: action
        };
        item.stage = 'SUMMARIZE';
        return item;
    });
}

/**
 * AGENT 6: TRANSLATION AGENT
 * Translates German summary to Ukrainian.
 */
async function runTranslation(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log("🤖 [Agent 6: Translation] Translating to Ukrainian...");
    // TODO: Connect OpenAI / DeepL here.

    // Mock dictionary for demo purposes
    const dictionary: Record<string, string> = {
        "Ukraine": "Україна",
        "Deutschland": "Німеччина",
        "Regierung": "Уряд",
        "Gesetz": "Закон",
        "Jobcenter": "Jobcenter",
        "Geld": "Гроші",
        "Arbeit": "Робота"
    };

    return items.map(item => {
        let text = item.summary?.de_summary || "";

        // Naive translation (Pseudo-localization)
        // In production, this call: await openai.chat.completions.create(...)
        Object.keys(dictionary).forEach(de => {
            const uk = dictionary[de];
            text = text.replace(new RegExp(de, 'g'), uk);
        });

        // Mark as translated (Demo)
        item.summary!.uk_summary = `[UA] ${text} (Translated by L6)`;
        item.stage = 'TRANSLATE';
        return item;
    });
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
                // MAP TRANSLATED CONTENT
                title: `${item.summary?.uk_summary.substring(0, 50)}...`, // Use UA headline in real app
                content: `${item.summary?.uk_summary}\n\nHint: ${item.summary?.action_hint}\n\nOriginal: ${item.raw.title}`,
                link: item.raw.url,
                image_url: 'https://placehold.co/600x400/FFCC00/0057B8?text=UA+News',

                // GEO ROUTING
                city: item.routing.target_city || null,
                land: item.routing.target_state || null,
                country: 'DE',
                scope: item.routing.layer,

                topics: item.classification.topics,
                priority: item.classification.relevance_score > 50 ? 'HIGH' : 'MEDIUM',
                dedupe_group: `L6_${item.raw.url}`
            });

            if (!error) count++;
        } catch (e) {
            console.error("Insert failed:", e);
        }
    }
    console.log(`✅ Successfully inserted ${count} translated items.`);
}

/**
 * MAIN PIPELINE
 */
async function cycle() {
    console.log("\n🚀 STARTING L6 ORCHESTRATION PIPELINE\n");

    let pipeline = await runCollector();      // 0
    pipeline = await runFilter(pipeline);     // 1
    pipeline = runClassifier(pipeline);       // 2
    pipeline = runRouter(pipeline);           // 3
    pipeline = await runDedup(pipeline);      // 4
    pipeline = await runSummary(pipeline);    // 5
    pipeline = await runTranslation(pipeline);// 6

    // Output results of Full Cycle
    console.log("\n🏁 PIPELINE RESULT (Full Cycle):");
    pipeline.forEach(item => {
        console.log(`\n📄 [${item.routing.layer}] ${item.raw.title}`);
        console.log(`   🇺🇦 UA: ${item.summary?.uk_summary}`);
        console.log(`   🎯 Route: ${item.routing.layer} -> ${item.routing.target_city || item.routing.target_state || 'ALL'}`);
    });

    await runInsertion(pipeline);
}

cycle();
