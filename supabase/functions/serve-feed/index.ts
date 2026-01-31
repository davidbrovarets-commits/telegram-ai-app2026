
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { city, land, country, page = 0, limit = 20 } = await req.json();

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 1. Primary Query: City News
        let { data: cityNews, error: cityError } = await supabaseClient
            .from('news')
            .select('*')
            .eq('status', 'ACTIVE')
            .eq('city', city)
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (cityError) throw cityError;

        let feed = cityNews || [];

        // 2. Fallback: If not enough news, fetch Regional (Land)
        // Only if we are on the first page.
        if (feed.length < limit && page === 0 && land) {
            const needed = limit - feed.length;
            const { data: landNews } = await supabaseClient
                .from('news')
                .select('*')
                .eq('status', 'ACTIVE')
                .eq('land', land)
                .is('city', null) // Avoid duplicates if city news is also labeled with land
                .order('created_at', { ascending: false })
                .limit(needed);

            if (landNews) {
                feed = [...feed, ...landNews];
            }
        }

        // 3. Last Resort: Country News
        if (feed.length < limit && page === 0 && country) {
            const needed = limit - feed.length;
            const { data: countryNews } = await supabaseClient
                .from('news')
                .select('*')
                .eq('status', 'ACTIVE')
                .eq('country', country)
                .is('land', null)
                .is('city', null)
                .order('created_at', { ascending: false })
                .limit(needed);

            if (countryNews) {
                feed = [...feed, ...countryNews];
            }
        }

        // 4. Return
        return new Response(JSON.stringify({ feed }), {
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
