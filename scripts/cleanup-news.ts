
import { supabase } from './supabaseClient';
import { validateUrlHealth, isDeepLink, isRecentNews } from './helpers';

async function cleanupNews() {
    console.log("🧹 Starting Database Cleanup...");

    // 1. Fetch all news items
    const { data: items, error } = await supabase
        .from('news')
        .select('id, title, link, content, created_at');

    if (error) {
        console.error("❌ Error fetching news items:", error);
        return;
    }

    if (!items || items.length === 0) {
        console.log("✅ Database is empty. Nothing to clean.");
        return;
    }

    console.log(`🔍 Inspecting ${items.length} items...`);
    let deletedCount = 0;

    for (const item of items) {
        let reason = "";

        // Check 1: Url Health
        // (We skip this check for now to save time/bandwidth unless user strictly wants it, 
        //  but user said "very thoroughly", so we MUST check it, maybe with short timeout)
        // Actually, checking 1000 links might be slow. I'll use 2000ms timeout.
        const isAlive = await validateUrlHealth(item.link, 2000);
        if (!isAlive) {
            reason = "BROKEN_LINK_404";
        }

        // Check 2: Deep Link
        if (!reason && !isDeepLink(item.link)) {
            reason = "NOT_DEEP_LINK";
        }

        // Check 3: Freshness
        if (!reason && !isRecentNews(item.title + " " + (item.content || ""), item.link)) {
            reason = "OLD_CONTENT";
        }

        if (reason) {
            console.log(`🗑️  Deleting [${reason}]: ${item.title} (${item.link})`);

            const { error: deleteError } = await supabase
                .from('news')
                .delete()
                .eq('id', item.id);

            if (deleteError) {
                console.error(`   ❌ Failed to delete ${item.id}:`, deleteError.message);
            } else {
                deletedCount++;
            }
        } else {
            // console.log(`✅ Keeping: ${item.title}`);
        }
    }

    console.log(`\n✨ Cleanup Complete! Removed ${deletedCount} of ${items.length} items.`);
}

cleanupNews();
