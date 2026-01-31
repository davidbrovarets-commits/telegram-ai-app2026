import { newsStore } from '../../stores/newsStore';
import { supabase } from '../../supabaseClient';
import type { News } from '../../types';
import { CITY_REGISTRY, LAND_NEIGHBORS } from '../../config/cities';

// Slot Configuration
const SLOTS = [
    'IMPORTANT', // #1
    'FUN',       // #2
    'IMPORTANT', // #3
    'INFO',      // #4
    'FUN',       // #5
    'INFO'       // #6
] as const;

// Store user geo for filtering
let userGeo: { land?: string; city?: string } = {};

export class FeedManager {

    // Set user location for geo-filtering
    static async setUserGeo(land?: string, city?: string) {
        // Prevent unnecessary refreshes
        if (userGeo.land === land && userGeo.city === city) return;

        userGeo = { land, city };
        console.log('[FeedManager] User geo set:', userGeo);

        // Update Store Persistence
        newsStore.setState(prev => ({
            ...prev,
            location: { city, land }
        }));

        // Fix 3: Instant Refresh on Geo Change
        // Clear current feed to force re-evaluation
        const state = newsStore.getState();
        if (state.visibleFeed.length > 0) {
            console.log('[FeedManager] Geo changed, forcing feed refresh...');
            // Optional: clear feed first to show loading state? 
            // newsStore.setState(prev => ({ ...prev, visibleFeed: [] })); 
            // implementation choice: just refill
            await this.forceRefillFeed();
        }
    }

    // --- INITIALIZATION ---
    static async initialize(land?: string, city?: string) {
        // Store geo if provided
        if (land) {
            this.setUserGeo(land, city);
        }

        // 1. User Check (Fix Shared History)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const state = newsStore.getState();
            // If stored user doesn't match current user, reset state
            if (state.userId !== user.id) {
                console.log('[FeedManager] New user detected. Resetting news state.');
                newsStore.reset(user.id);
            }
        }

        const todayKey = new Date().toISOString().split('T')[0];
        const state = newsStore.getState();

        // If fast refill needed
        if (state.visibleFeed.length === 0) {
            await this.forceRefillFeed();
        }
        if (state.lastActionDate !== todayKey) {
            await this.performDayRollover(todayKey);
        }

        // 3. Init Push Notifications (Background)
        this.syncPushToken();

        // If we have empty slots (0 or -1), try to fill them
        if (state.visibleFeed.some(id => id <= 0)) {
            console.log('Found empty slots, attempting to fill...');
            await this.fillEmptySlots();
        }
    }

    // --- CORE ACTIONS ---

    static handleSwipe(newsId: number, direction: 'LEFT' | 'RIGHT') {
        const state = newsStore.getState();
        const newsIndex = state.visibleFeed.indexOf(newsId);

        if (newsIndex === -1) return; // Not found

        const action = direction === 'RIGHT' ? 'ARCHIVE' : 'DELETE';

        // 1. Update Lists
        const newHistory = { ...state.history };
        if (action === 'ARCHIVE') {
            newHistory.archived = [...newHistory.archived, newsId];
            newHistory.shown = [...newHistory.shown, newsId];
        } else {
            newHistory.deleted = [...newHistory.deleted, newsId];
            newHistory.shown = [...newHistory.shown, newsId];
        }

        // Update State (Optimistic)
        newsStore.setState(prev => ({
            ...prev,
            history: newHistory,
            lastActionDate: new Date().toISOString().split('T')[0],
            visibleFeed: prev.visibleFeed.map(id => id === newsId ? -1 : id)
        }));

        this.fillEmptySlots();
    }

    static handleArchiveDeletion(newsId: number) {
        const state = newsStore.getState();
        const newHistory = { ...state.history };

        // Remove from archived
        newHistory.archived = newHistory.archived.filter(id => id !== newsId);
        // Add to deleted
        newHistory.deleted = [...newHistory.deleted, newsId];

        newsStore.setState(prev => ({
            ...prev,
            history: newHistory
        }));
    }

    // --- LOGIC HELPERS ---

    // Get neighbors from centralized registry
    private static getNeighbors(place: string): string[] {
        if (!place) return [];
        const inputLower = place.toLowerCase();

        // 1. Try City Registry (Direct key or loose match)
        // Direct key (most reliable if config uses keys)
        if (CITY_REGISTRY[inputLower]) return CITY_REGISTRY[inputLower].neighbors;

        // "Frankfurt (Oder)" -> "frankfurt_oder" normalization attempt
        const normalized = inputLower.replace(/[()]/g, '').trim().replace(/\s+/g, '_');
        if (CITY_REGISTRY[normalized]) return CITY_REGISTRY[normalized].neighbors;

        // Search by name (safest for UI strings like "Halle (Saale)")
        const foundCity = Object.values(CITY_REGISTRY).find(c => c.name.toLowerCase() === inputLower);
        if (foundCity) return foundCity.neighbors;

        // 2. Try Land Neighbors
        if (LAND_NEIGHBORS[place] || LAND_NEIGHBORS[inputLower]) {
            return LAND_NEIGHBORS[place] || LAND_NEIGHBORS[inputLower];
        }

        return [];
    }

    // Sort candidates to prioritize Local > Land > Fallback > DE
    private static sortCandidatesByGeo(items: News[]): News[] {
        return items.sort((a, b) => {
            const getScore = (n: News) => {
                if (n.scope === 'CITY' && n.city === userGeo.city) return 100; // Tier 1: Local City
                if (n.scope === 'LAND' && n.land === userGeo.land) return 90;  // Tier 2: Local Land
                if (n.scope === 'DE' || n.scope === 'COUNTRY') return 50;      // Tier 3: National (Important)
                return 10; // Tier 4: Fallback / Neighbors
            };

            const scoreA = getScore(a);
            const scoreB = getScore(b);

            if (scoreA !== scoreB) return scoreB - scoreA; // Descending by Geo Score

            // Secondary Sort: Priority (HIGH > MEDIUM > LOW)
            const pMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            const pA = pMap[a.priority as keyof typeof pMap] || 0;
            const pB = pMap[b.priority as keyof typeof pMap] || 0;

            return pB - pA;
        });
    }

    // Filter items by user geo
    // allowFallback: if true, allows neighboring regions if local is empty
    private static filterByGeo(items: News[], allowFallback = false): News[] {
        return items.filter(item => {
            // 1. Universal Content (DE/COUNTRY)
            if (!item.scope || item.scope === 'DE' || item.scope === 'COUNTRY') return true;

            // 2. Strict Local Match
            if (item.scope === 'LAND' && item.land === userGeo.land) return true;
            if (item.scope === 'CITY' && item.city === userGeo.city) return true;

            // 3. Proximity Fallback (New Logic)
            if (allowFallback) {
                const neighbors = [
                    ...this.getNeighbors(userGeo.city || ''),
                    ...this.getNeighbors(userGeo.land || '')
                ];

                // Allow if item is from a neighbor CITY or LAND
                if (item.city && neighbors.includes(item.city)) return true;
                if (item.land && neighbors.includes(item.land)) return true;

                // Note: The registry now handles specific fallbacks like "Berlin for Brandenburg",
                // so we don't need hardcoded special cases here anymore.
            }

            return false;
        });
    }

    static async forceRefillFeed() {
        console.log('[FeedManager] Force refilling feed with geo via Edge Function:', userGeo);

        const state = newsStore.getState();
        const userId = state.userId;

        // Call Server-Side Feed Function
        // This replaces the complex local filtering/sorting logic
        const { data, error } = await supabase.functions.invoke('serve-feed', {
            body: {
                city: userGeo.city,
                land: userGeo.land,
                userId: userId,
                limit: 100
            }
        });

        if (error) {
            console.error('Edge Function failed:', error);
            // Fallback to local logic if needed, or just return
            return;
        }

        const newsItems = data?.feed || [];
        console.log(`[FeedManager] Received ${newsItems.length} items from server`);

        // Filter out history (Client-side is fine for this)
        // Filter out history (Client-side is fine for this)
        // Fetch fresh state after async call
        const currentState = newsStore.getState();
        const usedIds = new Set<number>([
            ...currentState.history.deleted,
            ...currentState.history.archived,
            ...currentState.visibleFeed.filter(id => id > 0)
        ]);

        const validCandidates = newsItems.filter((n: News) => !usedIds.has(n.id));

        const filledSlots: number[] = [];
        const newlyUsedIds = new Set<number>();

        SLOTS.forEach(targetType => {
            const candidate = validCandidates.find((n: News) =>
                n.type === targetType &&
                !newlyUsedIds.has(n.id)
            );

            if (candidate) {
                filledSlots.push(candidate.id);
                newlyUsedIds.add(candidate.id);
            } else {
                // FALLBACK: Find any available news not used
                const fallback = validCandidates.find((n: News) => !newlyUsedIds.has(n.id));
                if (fallback) {
                    filledSlots.push(fallback.id);
                    newlyUsedIds.add(fallback.id);
                } else {
                    filledSlots.push(0); // 0 = Empty/Error
                }
            }
        });

        // Remaining go to Pool
        const poolIds = validCandidates
            .filter((n: News) => !newlyUsedIds.has(n.id))
            .map((n: News) => n.id);

        newsStore.setState(prev => ({
            ...prev,
            visibleFeed: filledSlots,
            pool: poolIds
        }));
    }

    static async performDayRollover(newDateKey: string) {
        console.log(`Performing Day Rollover to ${newDateKey}`);

        const state = newsStore.getState();
        const isInactive = state.lastActionDate !== newDateKey;

        if (isInactive) {
            console.log('Inactivity detected. Rotating slots...');
        }

        newsStore.setState(prev => ({ ...prev, lastActionDate: newDateKey }));
    }

    static async fillEmptySlots() {
        const state = newsStore.getState();
        const missingIndices = state.visibleFeed
            .map((id, index) => id <= 0 ? index : -1)
            .filter(i => i !== -1);

        if (missingIndices.length === 0) return;

        console.log(`Filling ${missingIndices.length} slots...`);

        // neededTypes removed as we loosened the query
        const usedIds = new Set([...state.visibleFeed, ...state.history.shown]);

        // Fetch candidates - BROAD QUERY (don't restrict by type initially to allow fallback)
        let query = supabase
            .from('news')
            .select('*')
            .in('status', ['POOL', 'ACTIVE'])
            .not('type', 'is', null);

        // Filter out used IDs if any exist
        let idsToExclude = usedIds;
        if (usedIds.size > 0) {
            query = query.not('id', 'in', `(${Array.from(usedIds).join(',')})`);
        }

        let { data: candidates } = await query
            .order('priority', { ascending: false }) // Prioritize important ones first
            .limit(100);

        // --- RECYCLE FALLBACK ---
        // If we found NO fresh news, fetch *any* valid news (ignoring history)
        if (!candidates || candidates.length === 0) {
            console.log('[FeedManager] No fresh news found. Recycling old news...');
            const { data: recycled } = await supabase
                .from('news')
                .select('*')
                .in('status', ['POOL', 'ACTIVE'])
                .not('type', 'is', null)
                .order('priority', { ascending: false })
                .limit(50);

            if (recycled && recycled.length > 0) {
                candidates = recycled;
                // CRITICAL FIX: Do NOT clear all exclusions.
                // Keep excluding visible, deleted, and archived items.
                // Only allow 'shown' (history) items to be re-watched.
                idsToExclude = new Set([
                    ...state.visibleFeed.filter(id => id > 0),
                    ...state.history.deleted,
                    ...state.history.archived
                ]);
            }
        }

        if (!candidates) return;

        // Apply geo filter (Try strict first)
        let geoFiltered = this.filterByGeo(candidates as News[], false);

        // If we still have empty slots that couldn't be filled by strict local news,
        // we might want to allow neighbors. 
        // Logic: Check if we have enough candidates to fill the gap.
        if (geoFiltered.length < missingIndices.length) {
            console.log('[FeedManager] Not enough strict local candidates. Expanding to neighbors...');
            geoFiltered = this.filterByGeo(candidates as News[], true);
        }

        // Apply Sort: Local > Fallback
        geoFiltered = this.sortCandidatesByGeo(geoFiltered);

        // Apply Sort: Local > Fallback
        geoFiltered = this.sortCandidatesByGeo(geoFiltered);

        const newFeed = [...state.visibleFeed];
        const newlyUsedIds = new Set<number>();

        missingIndices.forEach(idx => {
            const requiredType = SLOTS[idx];

            // 1. Try Strict Match
            let match = geoFiltered.find(c =>
                c.type === requiredType &&
                !idsToExclude.has(c.id) &&
                !newlyUsedIds.has(c.id)
            );

            // 2. Fallback: Any valid news
            if (!match) {
                match = geoFiltered.find(c =>
                    !idsToExclude.has(c.id) && // Use dynamic exclusion
                    !newlyUsedIds.has(c.id)
                );
            }

            // 3. LAST RESORT (Infinite Recycle):
            // If we are still empty, grab ANYTHING from candidates, ignoring 'idsToExclude'.
            // This prevents "Empty Feed" crash by showing something (even if recently seen).
            if (!match && candidates.length > 0) {
                match = candidates.find(c => !newlyUsedIds.has(c.id));
                if (match) console.log('[FeedManager] Last resort: Recycling recently seen item to prevent empty slot.');
            }

            if (match) {
                newFeed[idx] = match.id;
                newlyUsedIds.add(match.id);
            } else {
                // If absolutely nothing found, use Placeholder ID -999 (Client should handle this)
                newFeed[idx] = -999;
            }
        });

        newsStore.setState(prev => ({
            ...prev,
            visibleFeed: newFeed
        }));
    }
    static async syncPushToken() {
        try {
            if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

            const { messaging } = await import('../../firebaseConfig');
            if (!messaging) return;

            const { getToken } = await import('firebase/messaging');
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            });

            if (token) {
                const state = newsStore.getState();
                console.log('[FeedManager] Syncing Push Token:', token.substring(0, 10));
                const { error } = await supabase
                    .from('user_push_tokens')
                    .upsert({
                        token,
                        user_id: state.userId,
                        city: userGeo.city || null,
                        land: userGeo.land || null,
                        last_updated: new Date().toISOString()
                    });

                if (error) console.error('[FeedManager] Token sync failed:', error);
            }
        } catch (e) {
            console.warn('[FeedManager] Push init failed:', e);
        }
    }
}
