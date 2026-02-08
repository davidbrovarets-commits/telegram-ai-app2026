
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-status-token',
};

serve(async (req) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Security Check: Validate x-status-token Header
        const token = req.headers.get('x-status-token');
        const validToken = Deno.env.get('STATUS_API_TOKEN');

        if (!token || !validToken || token !== validToken) {
            console.warn('[Status] Unauthorized access attempt');
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Init Client (Service Role for internal stats, but function is read-only)
        // We use Service Role here because we need to read system tables that might be RLS protected for anon.
        // HOWEVER, the endpoint is protected by our custom token, so n8n never sees this key.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 4. Fetch Data

        // A. Latest Orchestrator Run (from internal logs table if exists, or just GitHub Actions recent runs via simplified query if stored)
        // Since we don't have a dedicated 'orchestrator_runs' table in the schema provided in context, 
        // we will infer health from 'news' table recency.

        // B. News Counts
        const now = new Date();
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        const { count: totalNews } = await supabaseAdmin.from('news').select('*', { count: 'exact', head: true });

        const { count: last24h } = await supabaseAdmin.from('news')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', twentyFourHoursAgo);

        const { count: last6h } = await supabaseAdmin.from('news')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', sixHoursAgo);

        // C. Image Status Counts (Aggregation)
        // Note: .rpc() is better for aggregation, but for MVP we use basic counts if volume is low (<10k items active).
        // Optimization: Run separate count queries.
        const getImageCount = async (status: string) => {
            const { count } = await supabaseAdmin.from('news')
                .select('*', { count: 'exact', head: true })
                .eq('image_status', status);
            return count || 0;
        };

        const imageStats = {
            placeholder: await getImageCount('placeholder'),
            generating: await getImageCount('generating'),
            generated: await getImageCount('generated'),
            failed: await getImageCount('failed')
        };

        // D. Stuck Items
        // 1. Generating > 30 mins
        const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
        const { count: stuckGenerating } = await supabaseAdmin.from('news')
            .select('*', { count: 'exact', head: true })
            .eq('image_status', 'generating')
            .lt('created_at', thirtyMinsAgo); // Old generating items

        // 2. Placeholder > 6 hours (if policy requires images)
        // Checking for old placeholders that haven't been picked up
        const { count: oldPlaceholders } = await supabaseAdmin.from('news')
            .select('*', { count: 'exact', head: true })
            .eq('image_status', 'placeholder')
            .lt('created_at', sixHoursAgo);


        // E. Health Calculation
        let healthLevel = 'ok';
        const reasons: string[] = [];

        if (last24h === 0) {
            healthLevel = 'bad';
            reasons.push('No news in last 24h');
        } else if (last6h === 0) {
            healthLevel = 'warn';
            reasons.push('No news in last 6h');
        }

        if ((stuckGenerating || 0) > 5) {
            healthLevel = healthLevel === 'ok' ? 'warn' : healthLevel;
            reasons.push(`Stuck image generations: ${stuckGenerating}`);
        }

        if ((imageStats.failed || 0) > (imageStats.generated || 1) * 0.5) {
            healthLevel = 'bad';
            reasons.push('High image failure rate (>50%)');
        }

        // Return Data
        const data = {
            news_counts: {
                total: totalNews || 0,
                last_24h: last24h || 0,
                last_6h: last6h || 0
            },
            image_counts_by_status: imageStats,
            stuck_items: {
                placeholder_over_6h: oldPlaceholders || 0,
                generating_over_30min: stuckGenerating || 0
            },
            health: {
                level: healthLevel,
                reasons: reasons.length > 0 ? reasons : ['All systems nominal']
            },
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
