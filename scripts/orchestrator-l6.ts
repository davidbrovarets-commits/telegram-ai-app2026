/* ============================================================================
L6 NEWS ORCHESTRATOR (Refactored) — FULL FILE (copy-paste)
Implements 12 improvements:
1) Remove dangerouslyAllowBrowser; server-safe
2) Provider abstraction (vertex | openai | mock) via env AI_PROVIDER
3) USE_AI no longer tied to OpenAI key
4) Published-at extracted from article HTML (not only RSS)
5) validateUrlHealth is now used
6) Filter split: STRICT (important/info) + FUN track (events) (no longer blocks Kultur/Unterhaltung blindly)
7) Router uses word-boundary matching + basic aliases support
8) Summary+Translate+Title combined into ONE LLM call returning JSON
9) Concurrency limiter + retry/backoff for LLM calls
10) Bulk insert to Supabase + stable IDs + better conflict safety (client-side)
11) Actions array produced by AI (JSON) (not naive keyword only)
12) Cleanup: remove unused types, consistent DB fields (source_id is registry id, link is url)
============================================================================ */

import Parser from 'rss-parser';
import { supabase } from './supabaseClient';
import cityPackages from './city-packages.index.json' assert { type: 'json' };
import { SOURCE_REGISTRY } from './registries/source-registry';
import { isRecentNews, isDeepLink, validateUrlHealth } from './helpers';
import { runAutoHealer } from './auto-healer';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

/* -----------------------------
   ENV / PROVIDER CONFIG
------------------------------ */

type AIProviderName = 'vertex' | 'mock';

const AI_PROVIDER = (process.env.AI_PROVIDER || 'vertex').toLowerCase() as AIProviderName;

const VERTEX_API_KEY = process.env.VERTEX_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';
const VERTEX_ENDPOINT = process.env.VERTEX_ENDPOINT || ''; // optional if you implement Vertex REST
const VERTEX_MODEL = process.env.VERTEX_MODEL || 'gemini-2.5-pro';

const USE_AI = AI_PROVIDER === 'vertex' || !!VERTEX_API_KEY;

/* -----------------------------
   VERTEX CLIENT (placeholder)
------------------------------ */

// No client init needed for now if using REST or if handled inside callVertex_JSON

/* -----------------------------
   TYPES
------------------------------ */

type ProcessingStage =
    | 'COLLECT'
    | 'FILTER'
    | 'CLASSIFY'
    | 'ROUTE'
    | 'DEDUP'
    | 'PUBLISHED_AT'
    | 'AI_ENRICH'
    | 'DONE';

type NewsType = 'IMPORTANT' | 'INFO' | 'FUN';
type GeoLayer = 'CITY' | 'STATE' | 'COUNTRY';

interface ProcessedItem {
    id: string; // stable id (hash)
    raw: {
        title: string;
        text: string;
        url: string;
        source_id: string; // registry id (DW, TAGESSCHAU, etc.)
        published_at: string; // will be overwritten by extractor if found
        language: 'de';
    };
    classification: {
        topics: string[];
        relevance_score: number;
        type: NewsType;
        actions: string[]; // UI badges/actions: ['deadline','policy_change','appointment','documents',...]
        de_summary?: string;
        uk_summary?: string;
        dedupe_group?: string;
    };
    routing: {
        layer: GeoLayer;
        target_state?: string;
        target_city?: string;
    };

    meta?: {
        published_at_source?: 'rss' | 'html' | 'unknown';
        reasonTag?: string;
    };
    stage: ProcessingStage;
}

/* -----------------------------
   CONSTANTS / KEYWORDS
------------------------------ */

const UKRAINE_KEYWORDS = [
    'Ukraine',
    'Ukrainer',
    'Flüchtlinge',
    'Migration',
    'Aufenthalt',
    '§24',
    'Paragraf 24',
    'Schutzstatus',
];

// Social / benefits
const SOCIAL_KEYWORDS = [
    'Jobcenter',
    'Bürgergeld',
    'Sozialhilfe',
    'Kindergeld',
    'Wohngeld',
];

// Work / integration
const WORK_KEYWORDS = [
    'Arbeit',
    'Steuern',
    'Miete',
    'Integration',
    'Arbeitsmarkt',
    'Berufserlaubnis',
];

// Legal / government
const LEGAL_KEYWORDS = [
    'Bundestag',
    'Bundesregierung',
    'Gesetz',
    'Verordnung',
    'Beschluss',
    'Frist',
];

// ===============================
// FUN / EVENT KEYWORDS (EXPANDED)
// ===============================
const EVENT_KEYWORDS = [
    // core events
    'Konzert',
    'Event',
    'Festival',
    'Veranstaltung',
    'Programm',

    // venues / culture
    'Theater',
    'Oper',
    'Philharmonie',
    'Museum',
    'Ausstellung',
    'Galerie',
    'Kino',
    'Premiere',

    // tickets / entry
    'Ticket',
    'Tickets',
    'Eintritt',
    'Einlass',
    'Vorverkauf',
    'Abendkasse',

    // community / public
    'Einladung',
    'Eröffnung',
    'Vernissage',
    'Feier',
    'Jubiläum',
    'Tag der offenen Tür',

    // formats
    'Lesung',
    'Vortrag',
    'Workshop',
    'Seminar',
    'Infoabend',
    'Meetup',
    'Stammtisch',
    'Networking',
    'Konferenz',
    'Messe',

    // family / kids
    'Kinder',
    'Familie',
    'Ferienprogramm',

    // city / outdoor
    'Markt',
    'Flohmarkt',
    'Straßenfest',
    'Stadtfest',
    'Open Air',
    'Open-Air',
    'Sommerfest',

    // scheduling
    'Termin',
    'Kalender',
    'Beginn',
    'Uhr',
];

// ===============================
// COMBINED STRICT KEYWORDS
// ===============================
const ALL_STRICT_KEYWORDS = [
    ...UKRAINE_KEYWORDS,
    ...SOCIAL_KEYWORDS,
    ...WORK_KEYWORDS,
    ...LEGAL_KEYWORDS,
];

// ===============================
// BLOCKLIST (FINAL)
// NOTE: 'Wetter' and 'Sport' REMOVED
// ===============================
const BLOCKLIST = [
    // gossip / tabloids
    'Gossip',
    'Promi',
    'Klatsch',
    'Boulevard',
    'Royal',
    'Stars',
    'Celebrity',
    'Influencer',

    // low-signal / clickbait
    'Horoskop',
    'Astrologie',
    'Tarot',
    'Lotto',
    'Gewinnspiel',
    'Quiz',
    'Rätsel',

    // adult / explicit
    'Erotik',
    'Sex',
    'Porn',
];

/* -----------------------------
   HELPERS (internal)
------------------------------ */

function hashId(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex').slice(0, 24);
}

function normalizeSpace(s: string) {
    return (s || '').replace(/\s+/g, ' ').trim();
}

function safeLower(s: string) {
    return (s || '').toLowerCase();
}

function wordBoundaryIncludes(textLower: string, term: string) {
    const t = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${t.toLowerCase()}\\b`, 'i');
    return re.test(textLower);
}

function nowIso() {
    return new Date().toISOString();
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

/* -----------------------------
   SIMPLE CONCURRENCY LIMITER
------------------------------ */

function createLimiter(concurrency: number) {
    let active = 0;
    const queue: Array<() => void> = [];

    const next = () => {
        if (active >= concurrency) return;
        const job = queue.shift();
        if (!job) return;
        active++;
        job();
    };

    return async function limit<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            queue.push(async () => {
                try {
                    const res = await fn();
                    resolve(res);
                } catch (e) {
                    reject(e);
                } finally {
                    active--;
                    next();
                }
            });
            next();
        });
    };
}

const limitAI = createLimiter(1); // Force sequential to avoid 429 on free tier

/* -----------------------------
   HTTP FETCH WITH TIMEOUT
------------------------------ */

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 8000) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...opts, signal: ctrl.signal });
        return res;
    } finally {
        clearTimeout(id);
    }
}

/* -----------------------------
   PUBLISHED AT EXTRACTOR (HTML)
   - meta: article:published_time, og:published_time
   - JSON-LD: datePublished
   - <time datetime="...">
   - visible patterns (fallback)
------------------------------ */

function extractMetaContent(html: string, name: string) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
    const m = html.match(re);
    return m?.[1] || '';
}

function extractTimeDatetime(html: string) {
    const re = /<time[^>]+datetime=["']([^"']+)["'][^>]*>/i;
    const m = html.match(re);
    return m?.[1] || '';
}

function extractJsonLdDatePublished(html: string) {
    const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
    for (const b of blocks) {
        const jsonText = b.replace(/^[\s\S]*?>/i, '').replace(/<\/script>$/i, '');
        try {
            const parsed = JSON.parse(jsonText);
            const candidates = Array.isArray(parsed) ? parsed : [parsed];
            for (const obj of candidates) {
                const date = obj?.datePublished || obj?.dateCreated || obj?.dateModified;
                if (typeof date === 'string' && date.length >= 8) return date;
            }
        } catch {
            // ignore
        }
    }
    return '';
}

function normalizeDateToIso(raw: string) {
    const s = normalizeSpace(raw);
    if (!s) return '';

    const d1 = new Date(s);
    if (!isNaN(d1.getTime())) return d1.toISOString();

    // Common DE formats: 31.01.2026, 31.01.26
    const m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (m) {
        const dd = String(m[1]).padStart(2, '0');
        const mm = String(m[2]).padStart(2, '0');
        let yy = m[3];
        if (yy.length === 2) yy = '20' + yy;
        const iso = new Date(`${yy}-${mm}-${dd}T00:00:00Z`);
        if (!isNaN(iso.getTime())) return iso.toISOString();
    }

    // Fallback: nothing
    return '';
}

async function extractPublishedAtFromHtml(url: string): Promise<{ iso: string; source: 'html' | 'unknown' }> {
    try {
        const res = await fetchWithTimeout(url, { method: 'GET' }, 9000);
        if (!res.ok) return { iso: '', source: 'unknown' };
        const html = await res.text();

        const meta1 = extractMetaContent(html, 'article:published_time');
        const meta2 = extractMetaContent(html, 'og:published_time');
        const meta3 = extractMetaContent(html, 'publish-date');
        const jsonLd = extractJsonLdDatePublished(html);
        const timeDt = extractTimeDatetime(html);

        const candidates = [meta1, meta2, meta3, jsonLd, timeDt].filter(Boolean);
        for (const c of candidates) {
            const iso = normalizeDateToIso(c);
            if (iso) return { iso, source: 'html' };
        }

        // very light visible fallback (e.g., "Stand: 31.01.2026")
        const vis = html.match(/(Stand|Veröffentlicht|Published|Datum|Aktualisiert)\s*[:\-]?\s*([0-9]{1,2}\.[0-9]{1,2}\.[0-9]{2,4})/i);
        if (vis?.[2]) {
            const iso = normalizeDateToIso(vis[2]);
            if (iso) return { iso, source: 'html' };
        }

        return { iso: '', source: 'unknown' };
    } catch {
        return { iso: '', source: 'unknown' };
    }
}

/* -----------------------------
   AI SERVICE (interface)
------------------------------ */

type AIEnrichResult = {
    de_summary: string;
    uk_summary: string;
    uk_title: string;
    action_hint: string;
    actions: string[];
    reasonTag?: string;
};

import { initializeApp } from "firebase/app";
import { getAI, VertexAIBackend, getGenerativeModel } from "firebase/ai";

// ... imports

/* -----------------------------
   AI SERVICE (interface)
------------------------------ */

// Check if app is already initialized to avoid "Duplicate App" error
// In a script, it usually runs once, but let's be safe.
// Note: We need the config from env.

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (if not already)
// We designate a unique name for this app instance in the script to avoid conflicts with other imports if any.
const firebaseApp = initializeApp(firebaseConfig, 'orchestratorApp');


/**
 * Real Vertex/Gemini Implementation (Firebase SDK)
 */
/**
 * Real Vertex/Gemini Implementation (Server-Side SDK)
 * Uses the same robust auth as Secretary Bot
 */
async function callVertex_JSON(text: string, title: string): Promise<AIEnrichResult> {
    // Lazy import to avoid startup overhead if mocked
    const { VertexAI } = await import('@google-cloud/vertexai');

    const project = process.env.GOOGLE_PROJECT_ID || 'claude-vertex-prod';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    const vertexAI = new VertexAI({ project, location });
    const model = vertexAI.getGenerativeModel({
        model: process.env.VERTEX_MODEL || 'gemini-2.5-pro',
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are a professional news translator and analyst for Ukrainians in Germany.
Task:
1. Analyze the German Text and Title.
2. Generate a JSON response with the following fields:
   - de_summary: A 1-sentence summary in German.
   - uk_summary: A professional summary in UKRAINIAN language only. NO German words.
   - uk_title: A short, catchy title in UKRAINIAN language only.
   - action_hint: A short warning in UKRAINIAN if there is a deadline or action required (e.g. "Термін до 15.03").
   - actions: Array of tags ["deadline", "money", "documents", "event", "important"] (max 3).
   - reasonTag: One of ["OFFICIAL_UPDATE", "IMPORTANT_LOCAL", "FOR_UKRAINIANS", "EVENT_NEAR_YOU"].

INPUT TITLE: ${title}
INPUT TEXT: ${text}
`;

    try {
        const result = await model.generateContent(prompt);
        // Handle various response structures
        const candidate = result.response.candidates?.[0];
        const responseText = candidate?.content?.parts?.[0]?.text || "";

        if (!responseText) throw new Error('Empty response from Vertex');

        const parsed = JSON.parse(responseText);

        return {
            de_summary: parsed.de_summary || '',
            uk_summary: parsed.uk_summary || '',
            uk_title: parsed.uk_title || '',
            action_hint: parsed.action_hint || '',
            actions: Array.isArray(parsed.actions) ? parsed.actions : [],
            reasonTag: parsed.reasonTag
        };
    } catch (error) {
        console.error('❌ Vertex (Server) Generation Failed:', error);
        return fallbackMock(text, title);
    }
}

function fallbackMock(text: string, title: string): AIEnrichResult {
    const fallbackDe = normalizeSpace(text).slice(0, 240) + '...';
    return {
        de_summary: fallbackDe,
        uk_summary: `[UA Mock] ${fallbackDe}`,
        uk_title: `[UA Mock] ${title}`,
        action_hint: '',
        actions: [],
        reasonTag: 'SYSTEM_PRIORITY',
    };
}



async function aiEnrichOne(item: ProcessedItem): Promise<AIEnrichResult> {
    const text = item.raw.text;
    const title = item.raw.title;

    // retry/backoff for AI calls
    const maxAttempts = 3;
    let attempt = 0;
    let lastErr: any = null;

    while (attempt < maxAttempts) {
        attempt++;
        try {
            if (!USE_AI || AI_PROVIDER === 'mock') {
                const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 20);
                const de = sentences.slice(0, 2).join('. ') + (sentences.length ? '.' : '');
                return {
                    de_summary: de,
                    uk_summary: `[UA Mock] ${de}`,
                    uk_title: `[UA Mock] ${title}`,
                    action_hint: text.toLowerCase().includes('frist') ? '⚠️ Увага: є строк/дія' : '',
                    actions: text.toLowerCase().includes('frist') ? ['deadline'] : [],
                    reasonTag: item.classification.type === 'FUN' ? 'EVENT_NEAR_YOU' : 'IMPORTANT_LOCAL',
                };
            }

            if (AI_PROVIDER === 'vertex') {
                return await callVertex_JSON(text, title);
            }

            // default safe
            return await callVertex_JSON(text, title);
        } catch (e: any) {
            lastErr = e;
            const backoff = 500 * attempt + Math.floor(Math.random() * 250);
            await sleep(backoff);
        }
    }

    // final fallback
    const fallbackDe = normalizeSpace(text).slice(0, 240) + (text.length > 240 ? '...' : '');
    console.error('AI enrich failed after retries:', lastErr);
    return {
        de_summary: fallbackDe,
        uk_summary: `[UA Fail] ${fallbackDe}`,
        uk_title: title,
        action_hint: '',
        actions: [],
    };
}

/* -----------------------------
   AGENT 0: COLLECTOR
------------------------------ */

async function runCollector(): Promise<ProcessedItem[]> {
    console.log(`🤖 [AGENT 0] Collector: Starting ingestion...`);
    const parser = new Parser();
    const items: ProcessedItem[] = [];

    for (const source of SOURCE_REGISTRY) {
        try {
            console.log(`   📡 Fetching ${source.name}...`);
            const feed = await parser.parseURL(source.base_url);

            for (const it of feed.items) {
                const title = normalizeSpace(it.title || '');
                const text = normalizeSpace((it.contentSnippet || it.content || '')).substring(0, 1500);
                const url = normalizeSpace(it.link || '');

                if (!title || !url) continue;

                const publishedRss = it.pubDate ? normalizeDateToIso(it.pubDate) : '';
                const publishedAt = publishedRss || nowIso();

                const id = hashId(`${url}::${title}`);

                items.push({
                    id,
                    raw: {
                        title,
                        text,
                        url,
                        source_id: source.source_id, // registry id
                        published_at: publishedAt,
                        language: 'de',
                    },
                    classification: {
                        topics: [],
                        relevance_score: 0,
                        type: 'INFO',
                        actions: [],
                    },
                    routing: { layer: 'COUNTRY' },
                    meta: { published_at_source: publishedRss ? 'rss' : 'unknown' },
                    stage: 'COLLECT',
                });
            }
        } catch (error) {
            console.error(`   ❌ Failed to fetch ${source.name}:`, error);
        }
    }

    console.log(`   ✅ Collected ${items.length} raw items.`);
    return items;
}

/* -----------------------------
   AGENT 1: RULE FILTER (STRICT + FUN)
------------------------------ */

async function runFilter(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [AGENT 1] Rule Filter: Applying rules...`);
    const filtered: ProcessedItem[] = [];

    for (const item of items) {
        const fullText = safeLower(`${item.raw.title} ${item.raw.text}`);

        // Hard blocklist
        if (BLOCKLIST.some((b) => fullText.includes(b.toLowerCase()))) continue;

        // URL validation
        if (!isDeepLink(item.raw.url)) continue;

        // Health check (use imported validateUrlHealth if it exists/works)
        try {
            const ok = await validateUrlHealth(item.raw.url);
            if (!ok) continue;
        } catch {
            // fallback to lightweight HEAD
            try {
                const head = await fetchWithTimeout(item.raw.url, { method: 'HEAD' }, 6000);
                if (!head.ok) continue;
            } catch {
                continue;
            }
        }

        // Recency check
        if (!isRecentNews(fullText, item.raw.url)) continue;

        // Two tracks:
        const isStrict = ALL_STRICT_KEYWORDS.some((kw) => fullText.includes(kw.toLowerCase()));
        const isFun = EVENT_KEYWORDS.some((kw) => fullText.includes(kw.toLowerCase()));

        // Accept if either strict or fun, but prefer strict
        if (!isStrict && !isFun) continue;

        item.stage = 'FILTER';
        filtered.push(item);
    }

    console.log(`   ✅ Passed filters: ${filtered.length} items.`);
    return filtered;
}

/* -----------------------------
   AGENT 2: CLASSIFIER (topics + type + score)
------------------------------ */

async function runClassifier(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [AGENT 2] Classifier: Assigning topics/type...`);

    return items.map((item) => {
        const fullText = safeLower(`${item.raw.title} ${item.raw.text}`);
        const topics: string[] = [];
        let score = 0;

        const hasUkraine = UKRAINE_KEYWORDS.some((k) => fullText.includes(k.toLowerCase()));
        const hasSocial = SOCIAL_KEYWORDS.some((k) => fullText.includes(k.toLowerCase()));
        const hasWork = WORK_KEYWORDS.some((k) => fullText.includes(k.toLowerCase()));
        const hasLegal = LEGAL_KEYWORDS.some((k) => fullText.includes(k.toLowerCase()));
        const hasEvent = EVENT_KEYWORDS.some((k) => fullText.includes(k.toLowerCase()));

        if (hasUkraine) {
            topics.push('Aufenthalt');
            score += 30;
        }
        if (hasSocial) {
            topics.push('Soziales');
            score += 25;
        }
        if (hasWork) {
            topics.push('Arbeit');
            score += 20;
        }
        if (hasLegal) {
            topics.push('Gesetzgebung');
            score += 40;
        }
        if (hasEvent) {
            topics.push('Events');
            score += 15;
        }

        score = clamp(score, 0, 100);

        // Type logic:
        // IMPORTANT: legal + deadlines + official-ish cues
        // INFO: social/work/ukraine general
        // FUN: events
        let type: NewsType = 'INFO';
        if (hasEvent && score < 60) type = 'FUN';
        if (hasLegal || (fullText.includes('frist') || fullText.includes('deadline'))) type = 'IMPORTANT';
        if (type !== 'IMPORTANT' && (hasUkraine || hasSocial || hasWork)) type = 'INFO';
        if (hasEvent && !hasUkraine && !hasSocial && !hasWork && !hasLegal) type = 'FUN';

        item.classification.topics = Array.from(new Set(topics));
        item.classification.relevance_score = score;
        item.classification.type = type;
        item.stage = 'CLASSIFY';

        return item;
    });
}

/* -----------------------------
   AGENT 3: ROUTER (word boundary + aliases)
------------------------------ */

function runRouter(items: ProcessedItem[]): ProcessedItem[] {
    console.log(`🤖 [AGENT 3] Geo Router: Routing to layers...`);
    const activeCities = cityPackages.packages.filter((p: any) => p.status === 'active');

    // Basic aliases (extend as needed)
    const cityAliases: Record<string, string[]> = {
        leipzig: ['leipzig', 'stadt leipzig'],
    };

    return items.map((item) => {
        const textLower = safeLower(`${item.raw.title} ${item.raw.text}`);

        const cityMatch = activeCities.find((c: any) => {
            const city = String(c.city || '').toLowerCase();
            const aliases = cityAliases[city] || [city];
            return aliases.some((a) => wordBoundaryIncludes(textLower, a));
        });

        const landMatch = activeCities.find((c: any) => {
            const land = String(c.land || '').toLowerCase();
            return land ? wordBoundaryIncludes(textLower, land) : false;
        });

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

/* -----------------------------
   AGENT 4: DEDUP (batch + DB)
------------------------------ */

async function runDedup(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [AGENT 4] Dedup: Checking database...`);

    // Local batch dedup by URL
    const unique = new Map<string, ProcessedItem>();
    for (const item of items) {
        if (!unique.has(item.raw.url)) unique.set(item.raw.url, item);
    }
    const candidates = Array.from(unique.values());
    if (candidates.length === 0) return [];

    // DB dedup by link
    const { data: existing, error } = await supabase
        .from('news')
        .select('link, uk_summary, content')
        .in('link', candidates.map((c) => c.raw.url));

    if (error) {
        console.error('   ❌ DB dedup select error:', error);
        // still proceed cautiously
    }

    // Only exclude if it exists AND is not a mock
    const validLinks = new Set<string>();
    if (existing) {
        for (const e of existing) {
            // Check if it's a mock or "broken" (missing uk_summary)
            const isMockSummary = e.uk_summary && e.uk_summary.startsWith('[UA Mock]');
            const isMockContent = e.content && e.content.startsWith('[UA Mock]');
            const isMissingSummary = !e.uk_summary;

            // If it is NOT a mock and NOT missing summary, then it's valid/done.
            // If it IS a mock or missing summary, we skip adding to validLinks => so it stays in candidates => fresh
            if (!isMockSummary && !isMockContent && !isMissingSummary) {
                validLinks.add(e.link);
            }
        }
    }

    const fresh: ProcessedItem[] = [];

    for (const item of candidates) {
        if (validLinks.has(item.raw.url)) continue;
        item.stage = 'DEDUP';
        fresh.push(item);
    }

    console.log(`   ✅ Fresh (or Mock-Update) items: ${fresh.length}`);
    return fresh;
}

/* -----------------------------
   AGENT 4.5: PUBLISHED_AT EXTRACTOR
------------------------------ */

async function runPublishedAtExtractor(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [AGENT 4.5] PublishedAt: Extracting from article HTML...`);

    // Concurrency-limited fetch
    const tasks = items.map((item) =>
        limitAI(async () => {
            const { iso, source } = await extractPublishedAtFromHtml(item.raw.url);
            if (iso) {
                item.raw.published_at = iso;
                item.meta = item.meta || {};
                item.meta.published_at_source = source;
            } else {
                item.meta = item.meta || {};
                item.meta.published_at_source = item.meta.published_at_source || 'unknown';
            }
            item.stage = 'PUBLISHED_AT';
            return item;
        }),
    );

    const done = await Promise.all(tasks);
    return done;
}

/* -----------------------------
   AGENT 5+6: AI ENRICH (one call JSON)
------------------------------ */

async function runAIEnrich(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    console.log(`🤖 [AGENT 5/6] AI Enrich: Summary + UA translate + title + actions... (provider=${AI_PROVIDER}, useAI=${USE_AI})`);

    const tasks = items.map((item) =>
        limitAI(async () => {
            // Rate limit: wait 4s to stay under ~15 RPM quota
            await new Promise(r => setTimeout(r, 4000));
            const result = await aiEnrichOne(item);
            item.classification.de_summary = result.de_summary;
            item.classification.uk_summary = result.uk_summary;
            item.classification.actions = Array.isArray(result.actions) ? result.actions.slice(0, 3) : [];
            item.meta = item.meta || {};
            if (result.reasonTag) item.meta.reasonTag = result.reasonTag;
            // Overwrite title with AI title
            item.raw.title = result.uk_title || item.raw.title;
            item.stage = 'AI_ENRICH';
            return item;
        })
    );
    const done = await Promise.all(tasks);
    return done;
}

/* -----------------------------
   FINALIZER: INSERT
------------------------------ */

async function runInsertion(items: ProcessedItem[]) {
    console.log(`💾 [Finalizer] Bulk inserting into Database...`);

    const rows = items
        .filter((item) => item.classification.uk_summary) // only valid
        .map((item) => {
            // UI Title is usually the translated one
            const uiTitle = item.raw.title; // already overwritten by AI
            // Content logic: we prefer AI summary, fall back to raw
            const content = item.classification.uk_summary;

            // Generate deterministic priority
            // Generate ID or let DB handle it? We usually insert without ID.
            // But we need a dedupe logic.
            const dedupe_group = item.classification.dedupe_group || null;

            // Simple Priority Logic
            let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
            if (item.classification.type === 'IMPORTANT') priority = 'HIGH';
            if (item.classification.type === 'INFO') priority = 'LOW';

            // Extracted date or fallback
            const publishedIso = item.raw.published_at || new Date().toISOString();


            return {
                // Keep existing fields but make semantics consistent:
                source: `L6_${item.raw.source_id}`,       // label (ok)
                source_id: item.raw.source_id,            // registry id (DW/TAGESSCHAU/...)
                title: uiTitle,
                content,
                uk_summary: item.classification.uk_summary || null,
                link: item.raw.url,                       // url used for dedup and click
                image_url: 'https://placehold.co/600x400/0057B8/FFCC00?text=UA+News',

                // Actions array from AI JSON:
                actions: item.classification.actions || [],

                city: item.routing.target_city || null,
                land: item.routing.target_state || null,
                country: 'DE',
                scope: item.routing.layer,
                topics: item.classification.topics || [],
                priority,
                dedupe_group,

                // Optional: if your table has published_at column:
                published_at: publishedIso,
                published_at_source: item.meta?.published_at_source || null,
                type: item.classification.type,
                reason_tag: item.meta?.reasonTag || null,
            };
        });

    if (rows.length === 0) {
        console.log('✅ Nothing to insert.');
        return;
    }

    // Client-side dedup just in case
    const byLink = new Map<string, any>();
    for (const r of rows) if (!byLink.has(r.link)) byLink.set(r.link, r);

    const uniqueRows = Array.from(byLink.values());
    const links = uniqueRows.map(r => r.link);

    // WORKAROUND: upsert failed (no unique constraint). We manually delete then insert.
    if (links.length > 0) {
        const { error: delError } = await supabase.from('news').delete().in('link', links);
        if (delError) {
            console.error('⚠️ Delete old rows error (proceeding to insert anyway):', delError);
        }
    }

    const { error } = await supabase.from('news').insert(uniqueRows);

    if (error) {
        console.error('❌ Insert error:', error);
    } else {
        console.log(`✅ Inserted/Updated ${uniqueRows.length} items.`);
    }
}

/* -----------------------------
   ORCHESTRATOR
------------------------------ */

async function cycle() {
    console.log('\n🚀 L6 ORCHESTRATOR START\n');

    let pipeline = await runCollector();
    pipeline = await runFilter(pipeline);
    pipeline = await runClassifier(pipeline);
    pipeline = runRouter(pipeline);
    pipeline = await runDedup(pipeline);

    // NEW: Published date from article HTML
    pipeline = await runPublishedAtExtractor(pipeline);

    // NEW: One AI call (summary+translate+title+actions)
    pipeline = await runAIEnrich(pipeline);

    await runInsertion(pipeline);

    console.log('\n✅ L6 ORCHESTRATOR DONE\n');
}

// MAIN LOOP with Integrated Auto-Healer Scheduler
async function main() {
    console.log('🚀 SYSTEM STARTUP: Orchestrator + Auto-Healer');

    // 1. Run News Cycle Immediately
    await cycle().catch(e => console.error('FATAL Cycle Error:', e));

    // 2. Run Healer Immediately
    await runAutoHealer().catch(e => console.error('FATAL Healer Error:', e));

    // 3. Schedule Healer (Every 60 minutes)
    setInterval(() => {
        runAutoHealer().catch(e => console.error('Scheduled Healer Error:', e));
    }, 60 * 60 * 1000);

    // 4. (Optional) Schedule News Cycle? 
    // Currently users run this manually or in a loop. 
    // For now we just keep the process alive for the healer.
    console.log('🕒 Scheduler Active: Auto-Healer running every 60m.');

    // Keep alive hack (if intervals don't hold it open in some envs)
    setInterval(() => { }, 1000 * 60 * 60);
}

main();
