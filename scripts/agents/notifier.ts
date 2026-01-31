
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin
// Relies on GOOGLE_APPLICATION_CREDENTIALS env var being set to the path of the service account JSON
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        console.log('🔥 Firebase Admin Initialized');
    } catch (e) {
        console.error('❌ Only Firebase Admin failed to init:', e);
    }
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendAlert(newsItem: {
    id: number,
    title: string,
    uk_summary?: string,
    priority?: string,
    city?: string,
    land?: string,
    score?: number
}) {
    // Only High Priority or Very High AI Score triggers Alert
    const isHighPriority = newsItem.priority === 'HIGH';
    const isCrisis = (newsItem.score || 0) > 85;

    if (!isHighPriority && !isCrisis) return;

    console.log(`🔔 Preparing Alert for: "${newsItem.title.substring(0, 30)}..."`);

    try {
        // 1. Find Targets
        // Fetch tokens for this City OR Land
        // We do this in one query using OR logic if possible, or separate.
        // Supabase-js OR syntax: .or(`city.eq.${newsItem.city},land.eq.${newsItem.land}`)

        let query = supabase.from('user_push_tokens').select('token');

        const conditions: string[] = [];
        if (newsItem.city) conditions.push(`city.eq.${newsItem.city}`);
        if (newsItem.land) conditions.push(`land.eq.${newsItem.land}`);

        // Also include 'ALL' subscriptions if we have them (future proof)
        // For now just geo.

        if (conditions.length === 0) {
            console.log('   ⏭️ No geo scope for alert. Skipping.');
            return;
        }

        const { data: tokens, error } = await query.or(conditions.join(','));

        if (error || !tokens || tokens.length === 0) {
            console.log(`   ⏭️ No subscribers found for ${newsItem.city || newsItem.land}`);
            return;
        }

        const tokenList = tokens.map(t => t.token);
        // Deduplicate
        const uniqueTokens = [...new Set(tokenList)];

        console.log(`   📣 Sending Push to ${uniqueTokens.length} devices...`);

        // 2. Send Multicast
        // Batching is handled by multicast (up to 500). If more, we need loop.
        const BATCH_SIZE = 500;
        for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
            const batch = uniqueTokens.slice(i, i + BATCH_SIZE);

            const message: admin.messaging.MulticastMessage = {
                tokens: batch,
                notification: {
                    title: isCrisis ? '🚨 HÄIRETSEV UUDIS' : 'Tähtis Uudis',
                    body: newsItem.uk_summary ? newsItem.uk_summary.substring(0, 100) + '...' : newsItem.title,
                },
                data: {
                    newsId: String(newsItem.id),
                    type: 'ALERT'
                },
                android: {
                    priority: 'high',
                    notification: {
                        color: '#FF0000',
                        icon: 'stock_ticker_update'
                    }
                }
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log(`      ✅ Sent batch ${i / BATCH_SIZE + 1}: ${response.successCount} success, ${response.failureCount} fail`);

            // Cleanup invalid tokens
            if (response.failureCount > 0) {
                const invalidTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const err = resp.error?.code;
                        if (err === 'messaging/invalid-registration-token' ||
                            err === 'messaging/registration-token-not-registered') {
                            invalidTokens.push(batch[idx]);
                        }
                    }
                });

                if (invalidTokens.length > 0) {
                    await supabase.from('user_push_tokens').delete().in('token', invalidTokens);
                    console.log(`      🧹 Deleted ${invalidTokens.length} invalid tokens`);
                }
            }
        }

    } catch (e) {
        console.error('   ❌ Push Failed:', e);
    }
}
