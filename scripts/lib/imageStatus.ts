import { createClient } from '@supabase/supabase-js';

// Types
export type ImageStatus = 'placeholder' | 'generating' | 'generated' | 'failed';

export interface NewsItemImageState {
    id: number;
    image_status: ImageStatus;
    image_generation_attempts: number;
    image_url?: string;
    image_source_type?: 'reference' | 'imagen' | null;
}

export const MAX_GENERATION_ATTEMPTS = 3;

/**
 * Claims a batch of news items for image generation.
 * Selects oldest 'placeholder' or 'failed' items (if attempts < MAX).
 * Updates them to 'generating' to prevent race conditions.
 */
export async function claimNewsForGeneration(
    supabase: ReturnType<typeof createClient>,
    limit: number = 5,
    options: { maxAttempts: number } = { maxAttempts: MAX_GENERATION_ATTEMPTS }
): Promise<NewsItemImageState[]> {

    // 1. Select candidates
    const { data: candidates, error: selectError } = await supabase
        .from('news')
        .select('id, image_status, image_generation_attempts')
        .in('image_status', ['placeholder', 'failed'])
        .lt('image_generation_attempts', options.maxAttempts)
        .order('created_at', { ascending: false }) // Newest first (aligned with index)
        .limit(limit);

    if (selectError) {
        console.error('Error selecting candidates for image generation:', selectError);
        return [];
    }

    if (!candidates || candidates.length === 0) {
        return [];
    }

    // 2. Claim them (Set to 'generating' and increment attempts)
    const claimed: NewsItemImageState[] = [];

    // We process sequentially to ensure correct attempt increment and valid locking
    for (const item of candidates) {
        const { data, error } = await supabase
            .from('news')
            .update({
                image_status: 'generating',
                image_generation_attempts: item.image_generation_attempts + 1,
                image_last_attempt_at: new Date().toISOString()
            })
            .eq('id', item.id)
            .eq('image_status', item.image_status) // Optimistic lock: ensure it hasn't changed
            .select('id, image_status, image_generation_attempts, image_url, image_source_type')
            .single();

        if (data && !error) {
            claimed.push(data as NewsItemImageState);
        }
    }

    return claimed;
}

/**
 * Marks an item as successfully generated.
 */
export async function markImageGenerated(
    supabase: ReturnType<typeof createClient>,
    id: number,
    data: {
        image_url: string;
        image_prompt?: string;
        image_source_type?: 'reference' | 'imagen';
        image_source_url?: string;
        image_source_license?: string;
        image_source_attribution?: string;
    }
) {
    const { error } = await supabase
        .from('news')
        .update({
            image_status: 'generated',
            image_generated_at: new Date().toISOString(),
            image_error: null, // Clear error
            image_url: data.image_url,
            image_prompt: data.image_prompt,
            image_source_type: data.image_source_type,
            image_source_url: data.image_source_url,
            image_source_license: data.image_source_license,
            image_source_attribution: data.image_source_attribution
        })
        .eq('id', id);

    if (error) {
        console.error(`Failed to mark image generated for ID ${id}:`, error);
    }
}

/**
 * Marks an item as failed.
 */
export async function markImageFailed(
    supabase: ReturnType<typeof createClient>,
    id: number,
    errorReason: string,
    attempts: number
) {
    const { error } = await supabase
        .from('news')
        .update({
            image_status: 'failed',
            image_error: errorReason.substring(0, 500) // Truncate for safety
        })
        .eq('id', id);

    if (error) {
        console.error(`Failed to mark image failed for ID ${id}:`, error);
    }
}
