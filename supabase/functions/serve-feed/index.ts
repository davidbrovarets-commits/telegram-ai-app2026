
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vector Utils
function dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function magnitude(v: number[]): number {
    return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
    const magA = magnitude(a);
    const magB = magnitude(b);
    return (magA * magB) === 0 ? 0 : dotProduct(a, b) / (magA * magB);
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { city, land, country, page = 0, limit = 20, userId } = await req.json();

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 1. Fetch Candidates with Cascading Fallback
        // Try City → Land → DE until we get results
        let candidates: any[] = [];
        const scopes = [
            city ? { field: 'city', value: city } : null,
            land ? { field: 'land', value: land } : null,
            { field: 'scope', value: 'DE' } // Always fallback to national
        ].filter(Boolean);

        for (const scope of scopes) {
            if (candidates.length > 0) break; // Stop if we found items

            let feedQuery = supabaseClient
                .from('news')
                .select('id, title, created_at, embedding, type, priority, city, land, scope')
                .eq('status', 'ACTIVE')
                .order('created_at', { ascending: false })
                .range(page * limit, (page + 1) * limit + 50 - 1);

            if (scope) {
                feedQuery = feedQuery.eq(scope.field, scope.value);
            }

            const { data, error: feedError } = await feedQuery;
            if (feedError) throw feedError;

            if (data && data.length > 0) {
                console.log(`[serve-feed] Found ${data.length} items at scope: ${scope?.field}=${scope?.value}`);
                candidates = data;
            }
        }

        // If STILL empty, fetch ANY active news (last resort)
        if (candidates.length === 0) {
            console.log('[serve-feed] All scopes empty. Fetching ANY active news...');
            const { data: fallbackData } = await supabaseClient
                .from('news')
                .select('id, title, created_at, embedding, type, priority, city, land, scope')
                .eq('status', 'ACTIVE')
                .order('created_at', { ascending: false })
                .limit(limit);

            candidates = fallbackData || [];
        }

        let feed = candidates;

        // 2. Personalization (AI Ranking)
        if (userId && feed.length > 0) {
            // Fetch User History
            const { data: userState } = await supabaseClient
                .from('user_news_states')
                .select('state')
                .eq('user_id', userId)
                .single();

            const history = userState?.state?.history;
            const archivedIds = history?.archived || [];

            if (archivedIds.length > 0) {
                // Fetch embeddings for last 10 archived items
                const recentArchived = archivedIds.slice(-10);
                const { data: archivedItems } = await supabaseClient
                    .from('news')
                    .select('embedding')
                    .in('id', recentArchived);

                if (archivedItems && archivedItems.length > 0) {
                    // Compute User Vector (Average)
                    const vectors = archivedItems.map(i => i.embedding).filter(v => v);
                    if (vectors.length > 0) {
                        const dim = vectors[0].length;
                        const userVector = new Array(dim).fill(0);

                        for (const v of vectors) {
                            for (let i = 0; i < dim; i++) userVector[i] += v[i];
                        }
                        for (let i = 0; i < dim; i++) userVector[i] /= vectors.length;

                        // Re-rank Feed
                        feed.forEach(item => {
                            if (item.embedding) {
                                // Try/Catch for malformed embeddings
                                try {
                                    const sim = cosineSimilarity(mapVector(item.embedding), userVector);
                                    // Boost Score: 1.0 = Base. +0.5 * Similarity.
                                    // We want to preserve Time Sort mostly, but bump relevant items.
                                    // Or just sort by Similarity? 
                                    // User wants "If interested in sport, show sport".
                                    // Let's create a 'Hybrid Score'.
                                    // Time Decay: News loses 10% value every 24h.
                                    // Similarity: Multiplier 1.0 to 2.0.

                                    const ageHours = (Date.now() - new Date(item.created_at).getTime()) / (3600 * 1000);
                                    const freshness = Math.max(0.1, 1.0 - (ageHours / 120)); // Zero after 5 days

                                    item.finalScore = freshness * (1 + sim);
                                } catch (e) { item.finalScore = 0; }
                            } else {
                                item.finalScore = 0.5; // Penalty for no embedding
                            }
                        });

                        // Sort by Final Score
                        feed.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
                    }
                }
            }
        }

        // 3. Cleanup (Remove embeddings to save bandwidth)
        const sanitizedFeed = feed.slice(0, limit).map(item => {
            const { embedding, finalScore, ...rest } = item;
            return rest;
        });

        return new Response(JSON.stringify({ feed: sanitizedFeed }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

// Helper to handle pgvector string format "[1,2,3]" if necessary
function mapVector(v: any): number[] {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return JSON.parse(v);
    return [];
}
