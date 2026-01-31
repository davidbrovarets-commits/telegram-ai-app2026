
import { summarizeAndTranslate } from './summarizer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Simple heuristics to avoid costly AI calls for everything
function needsAttention(title: string, content: string): boolean {
    if (!title || !content) return true;

    // 1. Title is ALL CAPS (allow short acronyms > 4 chars)
    if (title.length > 5 && title === title.toUpperCase()) return true;

    // 2. Title has too many exclamation marks
    if ((title.match(/!/g) || []).length > 2) return true;

    // 3. Content is suspiciously short
    if (content.length < 50 && content.length > 0) return true;

    // 4. Content has excessive newlines
    if ((content.match(/\n\n\n/g) || []).length > 2) return true;

    return false;
}

export async function checkAndFixQuality(item: { id: number, title: string, content: string }) {
    if (!needsAttention(item.title, item.content)) {
        return null; // All good
    }

    console.log(`   🧐 Quality Issue detected in "${item.title.substring(0, 30)}..."`);

    // Use the existing summarizer/translator to "re-write" it properly
    // We treat it as a "new summary request" but with instructions to fix tone
    // Actually, summarizeAndTranslate generates a NEW summary.
    // If the content is bad (too short), maybe we can't fix it without scraping.
    // BUT if it's just formatting (ALL CAPS), AI can fix it.

    try {
        const result = await summarizeAndTranslate({
            title: item.title,
            content: item.content
        });

        if (result.uk_summary) {
            return {
                original_id: item.id,
                new_summary: result.uk_summary
            };
        }
    } catch (e) {
        console.warn('   ⚠️ Failed to fix quality via AI');
    }
    return null;
}
