/**
 * News Text Limits Check — Local Verification Tool
 * 
 * Reads 1 sample news item (from Supabase or fixture)
 * and prints word/char counts for all text fields,
 * showing which limits would apply at each layer.
 * 
 * Usage: npx tsx scripts/tools/news_text_limits_check.ts
 * 
 * NO MUTATIONS — read-only.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── Limits (from audit) ───────────────────────────────
const LIMITS = {
    // Generation layer (Zod schema)
    GEN_de_summary_max_chars: 600,
    GEN_uk_summary_min_chars: 1,
    GEN_uk_summary_max_chars: 1200,
    GEN_uk_content_min_chars: 1,
    GEN_uk_content_max_chars: 4000,
    GEN_uk_content_min_words: 250,
    GEN_uk_content_max_words: 290,
    GEN_uk_title_min_chars: 1,
    GEN_uk_title_max_chars: 180,
    GEN_action_hint_max_chars: 120,

    // UI layer
    UI_title_max_words: 7,
    UI_summary_max_words: 200,   // Only in TaskModal
    UI_hostname_max_chars: 15,

    // Push layer
    PUSH_title_max_chars: 60,
    PUSH_body_max_chars: 140,

    // Fallback
    FALLBACK_de_summary_max_chars: 240,
};

// ─── Helpers ───────────────────────────────────────────
function wordCount(s: string): number {
    if (!s) return 0;
    return s.trim().replace(/\s+/g, ' ').split(' ').length;
}

function charCount(s: string): number {
    return (s || '').length;
}

function status(value: number, min: number | null, max: number | null): string {
    if (min !== null && value < min) return '❌ UNDER MIN';
    if (max !== null && value > max) return '❌ OVER MAX';
    return '✅ OK';
}

// ─── Fixture (fallback if no DB) ──────────────────────
const FIXTURE = {
    id: 0,
    title: '[FIXTURE] Зміни в правилах реєстрації для українців у Лейпцигу',
    content: 'Міська адміністрація Лейпцига оголосила про зміни в процедурі реєстрації для громадян України, які прибувають до міста. Відтепер для реєстрації за місцем проживання необхідно мати при собі паспорт, довідку про тимчасовий захист та договір оренди житла. Нові правила набувають чинності з 1 березня 2026 року.',
    uk_summary: 'Лейпциг змінює правила реєстрації для українців. Потрібні три документи: паспорт, довідка про тимчасовий захист, договір оренди.',
    de_summary: 'Leipzig ändert Anmeldeverfahren für ukrainische Staatsbürger.',
    uk_content: null as string | null,
    action_hint: 'Термін: до 01.03.2026',
    link: 'https://www.leipzig.de/news/registration-update',
};

// ─── Main ──────────────────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║        NEWS TEXT LIMITS CHECK (read-only)                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    let item = FIXTURE;
    let source = 'FIXTURE';

    // Try to fetch from DB
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (url && key) {
        try {
            const sb = createClient(url, key, {
                auth: { persistSession: false, autoRefreshToken: false },
            });
            const { data } = await sb.from('news').select('*').limit(1).single();
            if (data) {
                item = data as typeof FIXTURE;
                source = 'SUPABASE';
            }
        } catch {
            // Fall through to fixture
        }
    }

    console.log(`Source: ${source} (ID: ${item.id})\n`);

    // ─── Field analysis ────────────────────────────────
    const fields = [
        { name: 'title', value: item.title },
        { name: 'uk_summary', value: item.uk_summary },
        { name: 'de_summary', value: item.de_summary },
        { name: 'uk_content', value: item.uk_content || item.content },
        { name: 'content', value: item.content },
        { name: 'action_hint', value: item.action_hint },
    ];

    console.log('┌──────────────┬────────┬────────┐');
    console.log('│ Field        │ Chars  │ Words  │');
    console.log('├──────────────┼────────┼────────┤');

    for (const f of fields) {
        const chars = charCount(f.value);
        const words = wordCount(f.value);
        console.log(`│ ${f.name.padEnd(12)} │ ${String(chars).padStart(6)} │ ${String(words).padStart(6)} │`);
    }

    console.log('└──────────────┴────────┴────────┘\n');

    // ─── Limit checks ──────────────────────────────────
    console.log('═══ GENERATION LAYER (Zod Schema) ═══');
    const checks = [
        { label: 'de_summary chars', value: charCount(item.de_summary), min: null, max: LIMITS.GEN_de_summary_max_chars },
        { label: 'uk_summary chars', value: charCount(item.uk_summary), min: LIMITS.GEN_uk_summary_min_chars, max: LIMITS.GEN_uk_summary_max_chars },
        { label: 'uk_content chars', value: charCount(item.uk_content || item.content), min: LIMITS.GEN_uk_content_min_chars, max: LIMITS.GEN_uk_content_max_chars },
        { label: 'uk_content words', value: wordCount(item.uk_content || item.content), min: LIMITS.GEN_uk_content_min_words, max: LIMITS.GEN_uk_content_max_words },
        { label: 'uk_title chars', value: charCount(item.title), min: LIMITS.GEN_uk_title_min_chars, max: LIMITS.GEN_uk_title_max_chars },
        { label: 'action_hint chars', value: charCount(item.action_hint), min: null, max: LIMITS.GEN_action_hint_max_chars },
    ];

    for (const c of checks) {
        const range = `[${c.min ?? '—'}, ${c.max ?? '—'}]`;
        console.log(`  ${status(c.value, c.min, c.max)} ${c.label}: ${c.value} (limit: ${range})`);
    }

    console.log('\n═══ UI LAYER ═══');
    const titleWords = wordCount(item.title);
    const summaryWords = wordCount(item.uk_summary);
    console.log(`  ${status(titleWords, null, LIMITS.UI_title_max_words)} title words: ${titleWords} (max: ${LIMITS.UI_title_max_words}) → ${titleWords > 7 ? 'WILL BE TRUNCATED' : 'fits'}`);
    console.log(`  ${status(summaryWords, null, LIMITS.UI_summary_max_words)} summary words: ${summaryWords} (max: ${LIMITS.UI_summary_max_words} in TaskModal only)`);
    console.log(`  ℹ️  NewsCardContentL6: summary rendered raw (no word truncation)`);
    console.log(`  ℹ️  NewsDetailView: content rendered raw (no truncation)`);

    console.log('\n═══ PUSH LAYER ═══');
    console.log(`  Push title would be: "${(item.title || '').slice(0, LIMITS.PUSH_title_max_chars)}"${charCount(item.title) > 60 ? ' (TRUNCATED)' : ''}`);
    console.log(`  Push body would be: "${(item.uk_summary || '').slice(0, LIMITS.PUSH_body_max_chars)}"${charCount(item.uk_summary) > 140 ? ' (TRUNCATED)' : ''}`);

    console.log('\n✅ Check complete. No data was modified.');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
