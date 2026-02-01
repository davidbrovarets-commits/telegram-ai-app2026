
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

        // --- UNIFIED "NAABER VALAB" LOGIC (Same as FeedManager.ts) ---

        // City Registry (ported from src/config/cities.ts)
        const CITY_REGISTRY: Record<string, { name: string; land: string; neighbors: string[] }> = {
            'leipzig': { name: 'Leipzig', land: 'Sachsen', neighbors: ['Berlin', 'Dresden', 'Halle'] },
            'dresden': { name: 'Dresden', land: 'Sachsen', neighbors: ['Berlin', 'Leipzig', 'Chemnitz'] },
            'chemnitz': { name: 'Chemnitz', land: 'Sachsen', neighbors: ['Leipzig', 'Dresden', 'Zwickau'] },
            'halle': { name: 'Halle (Saale)', land: 'Sachsen-Anhalt', neighbors: ['Leipzig', 'Magdeburg', 'Dessau'] },
            'magdeburg': { name: 'Magdeburg', land: 'Sachsen-Anhalt', neighbors: ['Berlin', 'Halle', 'Leipzig'] },
            'erfurt': { name: 'Erfurt', land: 'Thüringen', neighbors: ['Weimar', 'Jena', 'Leipzig'] },
            'berlin': { name: 'Berlin', land: 'Berlin', neighbors: ['Brandenburg', 'Potsdam'] },
            'potsdam': { name: 'Potsdam', land: 'Brandenburg', neighbors: ['Berlin', 'Brandenburg'] },
            'cottbus': { name: 'Cottbus', land: 'Brandenburg', neighbors: ['Berlin', 'Dresden', 'Potsdam'] },
            'frankfurt_oder': { name: 'Frankfurt (Oder)', land: 'Brandenburg', neighbors: ['Berlin', 'Cottbus', 'Potsdam'] },
            'rostock': { name: 'Rostock', land: 'Mecklenburg-Vorpommern', neighbors: ['Schwerin', 'Kiel', 'Hamburg'] },
            'schwerin': { name: 'Schwerin', land: 'Mecklenburg-Vorpommern', neighbors: ['Hamburg', 'Rostock'] },
            'hamburg': { name: 'Hamburg', land: 'Hamburg', neighbors: ['Schleswig-Holstein', 'Niedersachsen', 'Lübeck'] },
            'kiel': { name: 'Kiel', land: 'Schleswig-Holstein', neighbors: ['Hamburg', 'Lübeck'] },
            'luebeck': { name: 'Lübeck', land: 'Schleswig-Holstein', neighbors: ['Hamburg', 'Kiel', 'Rostock'] },
            'bremen': { name: 'Bremen', land: 'Bremen', neighbors: ['Hamburg', 'Niedersachsen'] },
            'hannover': { name: 'Hannover', land: 'Niedersachsen', neighbors: ['Braunschweig', 'Hildesheim', 'Wolfsburg'] },
            'koeln': { name: 'Köln', land: 'Nordrhein-Westfalen', neighbors: ['Düsseldorf', 'Bonn', 'Leverkusen'] },
            'duesseldorf': { name: 'Düsseldorf', land: 'Nordrhein-Westfalen', neighbors: ['Köln', 'Duisburg', 'Essen'] },
            'dortmund': { name: 'Dortmund', land: 'Nordrhein-Westfalen', neighbors: ['Bochum', 'Essen', 'Hagen'] },
            'frankfurt': { name: 'Frankfurt am Main', land: 'Hessen', neighbors: ['Wiesbaden', 'Mainz', 'Darmstadt'] },
            'stuttgart': { name: 'Stuttgart', land: 'Baden-Württemberg', neighbors: ['Karlsruhe', 'Ulm', 'Heilbronn'] },
            'muenchen': { name: 'München', land: 'Bayern', neighbors: ['Augsburg', 'Nürnberg', 'Rosenheim'] },
            'nuernberg': { name: 'Nürnberg', land: 'Bayern', neighbors: ['Fürth', 'Erlangen', 'München'] },
        };

        const LAND_NEIGHBORS: Record<string, string[]> = {
            'Sachsen': ['Berlin', 'Brandenburg', 'Sachsen-Anhalt'],
            'Sachsen-Anhalt': ['Sachsen', 'Niedersachsen', 'Berlin'],
            'Thüringen': ['Sachsen', 'Hessen', 'Bayern'],
            'Brandenburg': ['Berlin', 'Sachsen', 'Mecklenburg-Vorpommern'],
            'Schleswig-Holstein': ['Hamburg', 'Niedersachsen'],
            'Mecklenburg-Vorpommern': ['Brandenburg', 'Hamburg', 'Berlin'],
            'Hessen': ['Rheinland-Pfalz', 'Bayern', 'Thüringen'],
            'Rheinland-Pfalz': ['Hessen', 'Saarland', 'Baden-Württemberg'],
            'Saarland': ['Rheinland-Pfalz'],
            'Bayern': ['Baden-Württemberg', 'Thüringen', 'Hessen'],
            'Baden-Württemberg': ['Bayern', 'Hessen', 'Rheinland-Pfalz'],
            'Nordrhein-Westfalen': ['Niedersachsen', 'Hessen', 'Rheinland-Pfalz'],
            'Niedersachsen': ['Hamburg', 'Bremen', 'Nordrhein-Westfalen', 'Schleswig-Holstein'],
            'Berlin': ['Brandenburg', 'Potsdam'],
            'Bremen': ['Niedersachsen'],
            'Hamburg': ['Schleswig-Holstein', 'Niedersachsen']
        };

        // Helper: Get neighbors for a city or land
        function getNeighbors(place: string): string[] {
            if (!place) return [];
            const inputLower = place.toLowerCase();

            // Check city registry
            if (CITY_REGISTRY[inputLower]) return CITY_REGISTRY[inputLower].neighbors;

            // Check land neighbors
            if (LAND_NEIGHBORS[place]) return LAND_NEIGHBORS[place];

            return [];
        }

        // Helper: Filter news by geo (same logic as FeedManager.filterByGeo)
        function filterByGeo(items: any[], userCity?: string, userLand?: string, allowFallback = false): any[] {
            const neighbors = [
                ...getNeighbors(userCity || ''),
                ...getNeighbors(userLand || '')
            ];

            return items.filter(item => {
                // 1. Universal Content (DE/COUNTRY)
                if (!item.scope || item.scope === 'DE' || item.scope === 'COUNTRY') return true;

                // 2. Strict Local Match
                if (item.scope === 'LAND' && item.land === userLand) return true;
                if (item.scope === 'CITY' && item.city === userCity) return true;

                // 3. Neighbor Fallback ("Naaber Valab")
                if (allowFallback) {
                    if (item.city && neighbors.includes(item.city)) return true;
                    if (item.land && neighbors.includes(item.land)) return true;
                }

                return false;
            });
        }

        // 1. Fetch ALL active candidates (broad query)
        const { data: allCandidates, error: feedError } = await supabaseClient
            .from('news')
            .select('id, title, created_at, embedding, type, priority, city, land, scope')
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit + 100 - 1); // Extra for filtering

        if (feedError) throw feedError;

        let feed: any[] = [];

        if (allCandidates && allCandidates.length > 0) {
            // 2. Try STRICT local filter first
            feed = filterByGeo(allCandidates, city, land, false);
            console.log(`[serve-feed] Strict filter: ${feed.length} items`);

            // 3. If not enough, expand to NEIGHBORS ("Naaber Valab")
            if (feed.length < limit) {
                console.log('[serve-feed] Expanding to neighbors (Naaber Valab)...');
                feed = filterByGeo(allCandidates, city, land, true);
                console.log(`[serve-feed] With neighbors: ${feed.length} items`);
            }

            // 4. If STILL not enough, use ALL candidates (last resort)
            if (feed.length === 0) {
                console.log('[serve-feed] Using all candidates as fallback');
                feed = allCandidates;
            }
        }

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
