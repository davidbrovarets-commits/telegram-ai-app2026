import { supabase } from '../../supabaseClient';
import type { News } from '../../types';

export type UserNewsState = 'ARCHIVED' | 'DELETED';

export class NewsUserStateService {

    /**
     * Fetch all news IDs that the user has marked as ARCHIVED or DELETED.
     * Used by FeedManager to exclude these items from the feed.
     */
    static async fetchExcludedIds(userId: string): Promise<number[]> {
        const { data, error } = await supabase
            .from('news_user_state')
            .select('news_id')
            .eq('user_id', userId)
            .in('status', ['ARCHIVED', 'DELETED']);

        if (error) {
            console.error('[NewsUserStateService] Failed to fetch excluded IDs:', error);
            return [];
        }

        return (data || []).map(row => row.news_id).filter(id => typeof id === 'number');
    }

    /**
     * Persist a state change (ARCHIVE or DELETE).
     * UPSERT ensures we handle cases where a row might already exist.
     */
    static async setNewsState(userId: string, newsId: number, status: UserNewsState): Promise<void> {
        const { error } = await supabase
            .from('news_user_state')
            .upsert({
                user_id: userId,
                news_id: newsId,
                status: status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,news_id' }); // Fixed: No space in onConflict for strict PostgREST

        if (error) {
            console.error(`[NewsUserStateService] Failed to set state ${status} for ${newsId}:`, error);
        }
    }

    /**
     * Restore an item by removing its state record.
     * This makes it eligible for the Feed again (if it meets other criteria like date/priority).
     */
    static async restoreNewsState(userId: string, newsId: number): Promise<void> {
        const { error } = await supabase
            .from('news_user_state')
            .delete()
            .match({ user_id: userId, news_id: newsId });

        if (error) {
            console.error(`[NewsUserStateService] Failed to restore (delete state) for ${newsId}:`, error);
        }
    }

    /**
     * Fetch only ARCHIVED items for the Archive View.
     * Note: This returns the full News objects by joining via the state table.
     */
    static async fetchArchivedNews(userId: string): Promise<News[]> {
        const { data, error } = await supabase
            .from('news')
            .select('*, news_user_state!inner(status, updated_at)')
            .eq('news_user_state.user_id', userId)
            .eq('news_user_state.status', 'ARCHIVED')
            .order('updated_at', { foreignTable: 'news_user_state', ascending: false });

        if (error) {
            console.error('[NewsUserStateService] Failed to fetch archived news:', error);
            return [];
        }

        return (data as unknown as News[]) || [];
    }
}
