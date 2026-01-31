import { newsStore } from '../../stores/newsStore';
import { supabase } from '../../supabaseClient';
import type { News } from '../../types';

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

        // If first run or state empty (length 0)
        if (state.visibleFeed.length === 0) {
            await this.forceRefillFeed();
        }
        if (state.lastActionDate !== todayKey) {
            await this.performDayRollover(todayKey);
        }

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

    // Mapping: Local City/Land -> [Fallback Cities/Lands]
    // Keys should match what is stored in userGeo.city (usually Capitalized from UI selection)
    // We'll support both Title Case and lowercase to be safe.
    private static readonly GEO_FALLBACKS: Record<string, string[]> = {
        // Cities -> Neighbors
        'Leipzig': ['Berlin', 'Dresden', 'Halle'],
        'Dresden': ['Berlin', 'Leipzig', 'Chemnitz'],
        'Chemnitz': ['Leipzig', 'Dresden', 'Zwickau'],
        'Halle (Saale)': ['Leipzig', 'Magdeburg', 'Dessau'],
        'Rostock': ['Schwerin', 'Kiel', 'Hamburg'],
        'Cottbus': ['Berlin', 'Dresden', 'Potsdam'],
        'Frankfurt (Oder)': ['Berlin', 'Cottbus', 'Potsdam'],
        'Aachen': ['Köln', 'Düsseldorf', 'Bonn'],
        'Gelsenkirchen': ['Essen', 'Bochum', 'Dortmund'],
        'Oberhausen': ['Duisburg', 'Essen', 'Bottrop'],
        'Wolfsburg': ['Braunschweig', 'Hannover', 'Magdeburg'],
        'Braunschweig': ['Wolfsburg', 'Hannover', 'Hildesheim'],
        'Potsdam': ['Berlin', 'Brandenburg'],
        'Bremen': ['Hamburg', 'Niedersachsen'],
        'Hamburg': ['Schleswig-Holstein', 'Niedersachsen', 'Lübeck'],
        'Wiesbaden': ['Mainz', 'Frankfurt', 'Hessen'],
        'Mainz': ['Wiesbaden', 'Frankfurt', 'Rheinland-Pfalz'],
        'Schwerin': ['Hamburg', 'Rostock', 'Mecklenburg-Vorpommern'],
        'Saarbrücken': ['Trier', 'Rheinland-Pfalz', 'Saarland'],
        'Magdeburg': ['Berlin', 'Halle', 'Leipzig'],
        'Kiel': ['Hamburg', 'Lübeck', 'Schleswig-Holstein'],
        'Erfurt': ['Weimar', 'Jena', 'Leipzig'],
        'Kaiserslautern': ['Mainz', 'Saarbrücken', 'Mannheim'],
        'Mönchengladbach': ['Düsseldorf', 'Köln', 'Krefeld'],
        'Bremerhaven': ['Bremen', 'Hamburg', 'Cuxhaven'],
        'Ulm': ['Stuttgart', 'Augsburg', 'München'],
        'Heidelberg': ['Mannheim', 'Karlsruhe', 'Stuttgart'],
        'Trier': ['Saarbrücken', 'Koblenz', 'Luxemburg'],
        'Recklinghausen': ['Dortmund', 'Essen', 'Bochum'],
        'Krefeld': ['Düsseldorf', 'Duisburg', 'Mönchengladbach'],
        'Lübeck': ['Hamburg', 'Kiel', 'Rostock'],
        'Regensburg': ['München', 'Nürnberg', 'Ingolstadt'],

        // Lowercase aliases (for safety if IDs are used)
        'leipzig': ['Berlin', 'Dresden', 'Halle'],
        'dresden': ['Berlin', 'Leipzig', 'Chemnitz'],
        'chemnitz': ['Leipzig', 'Dresden', 'Zwickau'],
        'halle': ['Leipzig', 'Magdeburg', 'Dessau'],
        'rostock': ['Schwerin', 'Kiel', 'Hamburg'],
        'cottbus': ['Berlin', 'Dresden', 'Potsdam'],
        'frankfurt_oder': ['Berlin', 'Cottbus', 'Potsdam'],
        'aachen': ['Köln', 'Düsseldorf', 'Bonn'],
        'gelsenkirchen': ['Essen', 'Bochum', 'Dortmund'],
        'oberhausen': ['Duisburg', 'Essen', 'Bottrop'],
        'wolfsburg': ['Braunschweig', 'Hannover', 'Magdeburg'],
        'braunschweig': ['Wolfsburg', 'Hannover', 'Hildesheim'],
        'potsdam': ['Berlin', 'Brandenburg'],
        'bremen': ['Hamburg', 'Niedersachsen'],
        'hamburg': ['Schleswig-Holstein', 'Niedersachsen'],
        'wiesbaden': ['Mainz', 'Frankfurt', 'Hessen'],
        'mainz': ['Wiesbaden', 'Frankfurt', 'Rheinland-Pfalz'],
        'schwerin': ['Hamburg', 'Rostock', 'Mecklenburg-Vorpommern'],
        'saarbrücken': ['Trier', 'Rheinland-Pfalz', 'Saarland'],
        'magdeburg': ['Berlin', 'Halle', 'Leipzig'],
        'kiel': ['Hamburg', 'Lübeck', 'Schleswig-Holstein'],
        'erfurt': ['Weimar', 'Jena', 'Leipzig'],
        'kaiserslautern': ['Mainz', 'Saarbrücken', 'Mannheim'],
        'moenchengladbach': ['Düsseldorf', 'Köln', 'Krefeld'],
        'bremerhaven': ['Bremen', 'Hamburg', 'Cuxhaven'],
        'ulm': ['Stuttgart', 'Augsburg', 'München'],
        'heidelberg': ['Mannheim', 'Karlsruhe', 'Stuttgart'],
        'trier': ['Saarbrücken', 'Koblenz', 'Luxemburg'],
        'recklinghausen': ['Dortmund', 'Essen', 'Bochum'],
        'krefeld': ['Düsseldorf', 'Duisburg', 'Mönchengladbach'],
        'luebeck': ['Hamburg', 'Kiel', 'Rostock'],
        'regensburg': ['München', 'Nürnberg', 'Ingolstadt'],

        // Lands -> Neighboring Lands / Major Cities
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
        'Berlin': ['Brandenburg', 'Potsdam']
    };


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
                // Check City Fallbacks
                if (userGeo.city && this.GEO_FALLBACKS[userGeo.city]) {
                    if (item.city && this.GEO_FALLBACKS[userGeo.city].includes(item.city)) return true;
                }

                // Check Land Fallbacks
                if (userGeo.land && this.GEO_FALLBACKS[userGeo.land]) {
                    // Allow if item is from a neighbor LAND
                    if (item.scope === 'LAND' && item.land && this.GEO_FALLBACKS[userGeo.land].includes(item.land)) return true;
                    // Allow if item is a CITY in a neighbor LAND (simplification: strict mapping usually better, but this allows "Berlin news for Sachsen users")
                    if (item.scope === 'CITY' && item.city && this.GEO_FALLBACKS[userGeo.land].includes(item.city)) return true;
                }

                // Special Case: Berlin is often a fallback for everyone in East Germany
                if (item.city === 'Berlin' && ['Sachsen', 'Brandenburg', 'Thüringen', 'Sachsen-Anhalt'].includes(userGeo.land || '')) {
                    return true;
                }
            }

            return false;
        });
    }

    static async forceRefillFeed() {
        console.log('[FeedManager] Force refilling feed with geo:', userGeo);

        const { data: newsItems } = await supabase
            .from('news')
            .select('*')
            .in('status', ['POOL', 'ACTIVE'])
            .in('status', ['POOL', 'ACTIVE'])
            .not('type', 'is', null)
            .order('priority', { ascending: false })
            .limit(100); // Fetch more to filter

        if (!newsItems) return;

        // Apply geo filter (First Strict, then Fallback if needed)
        let geoFiltered = this.filterByGeo(newsItems as News[], false);

        // If strict filter yields too few results (< 6 slots), expand scope
        if (geoFiltered.length < 6) {
            console.log('[FeedManager] Strict geo filter found few items. Expanding to neighbors...');
            geoFiltered = this.filterByGeo(newsItems as News[], true);
        }

        // Apply Sort: Local > Fallback
        geoFiltered = this.sortCandidatesByGeo(geoFiltered);

        console.log(`[FeedManager] After geo filter & sort: ${geoFiltered.length} of ${newsItems.length} items`);

        const filledSlots: number[] = [];
        const usedIds = new Set<number>();

        SLOTS.forEach(targetType => {
            const candidate = geoFiltered.find(n =>
                n.type === targetType &&
                !usedIds.has(n.id)
            );

            if (candidate) {
                filledSlots.push(candidate.id);
                usedIds.add(candidate.id);
            } else {
                // FALLBACK: Find any available news not used
                const fallback = geoFiltered.find(n => !usedIds.has(n.id));
                if (fallback) {
                    filledSlots.push(fallback.id);
                    usedIds.add(fallback.id);
                } else {
                    filledSlots.push(0); // 0 = Empty/Error
                }
            }
        });

        // Remaining go to Pool
        const poolIds = geoFiltered
            .filter(n => !usedIds.has(n.id))
            .map(n => n.id);

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
}
