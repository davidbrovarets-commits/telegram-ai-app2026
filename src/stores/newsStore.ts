import type { UserNewsState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'telegram-app-news-state-v7';

// Default State
const DEFAULT_STATE: UserNewsState = {
    visibleFeed: [],
    pool: [],
    history: {
        shown: [],
        archived: [],
        deleted: []
    },
    signals: {
        IMPORTANT: { openRate: 0, timeSpent: 0 },
        INFO: { openRate: 0, timeSpent: 0 },
        FUN: { openRate: 0, timeSpent: 0 }
    },
    lastActionDate: new Date().toISOString().split('T')[0],
    userState: 'BASELINE' // S0
};

// Simple Pub/Sub for React Reactivity
type Listener = (state: UserNewsState) => void;
const listeners: Set<Listener> = new Set();

let currentState: UserNewsState = loadState();

function loadState(): UserNewsState {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Validate critical fields
            if (!Array.isArray(parsed.visibleFeed)) parsed.visibleFeed = [];
            if (!Array.isArray(parsed.pool)) parsed.pool = [];
            if (!parsed.history) parsed.history = { shown: [], archived: [], deleted: [] };

            return { ...DEFAULT_STATE, ...parsed };
        }
    } catch (e) {
        console.error('Failed to load news state', e);
        // REPORT ERROR
        try {
            supabase.from('system_errors').insert({
                error_code: 'STATE_CORRUPTION',
                error_message: String(e),
                context: { location: 'newsStore.loadState' }
            }).then(() => console.log('Error reported.'));
        } catch { }

        // If error, maybe clear it?
        try { localStorage.removeItem(STORAGE_KEY); } catch { }
    }
    return DEFAULT_STATE;
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (e) {
        console.error('Failed to save news state', e);
    }
}

function notify() {
    listeners.forEach(l => l(currentState));
}

// Cloud Sync Helper
async function syncStateToCloud(state: UserNewsState) {
    if (!state.userId) return;

    // Debounce or minimal check could be added here, but for now direct sync
    try {
        const { error } = await supabase
            .from('user_news_states')
            .upsert({
                user_id: state.userId,
                state: state,
                last_updated: new Date()
            });

        if (error) console.error('[NewsStore] Cloud sync failed:', error);
    } catch (e) {
        console.error('[NewsStore] Cloud sync exception:', e);
    }
}

async function loadStateFromCloud(userId: string): Promise<UserNewsState | null> {
    try {
        const { data } = await supabase
            .from('user_news_states')
            .select('state')
            .eq('user_id', userId)
            .single();

        if (data && data.state) {
            console.log('[NewsStore] Loaded state from cloud');
            return data.state as UserNewsState;
        }
    } catch (e) {
        console.warn('[NewsStore] No cloud state found or error', e);
    }
    return null;
}

export const newsStore = {
    getState: () => currentState,

    subscribe: (listener: Listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    setState: (updater: (prev: UserNewsState) => UserNewsState) => {
        const newState = updater(currentState);
        currentState = newState;
        saveState(); // Local
        syncStateToCloud(currentState); // Cloud
        notify();
    },

    // Reset or Switch User
    reset: async (newUserId?: string) => {
        if (!newUserId) {
            // Logout case
            currentState = { ...DEFAULT_STATE };
            saveState();
            notify();
            return;
        }

        // Login case - Try load from cloud
        const cloudState = await loadStateFromCloud(newUserId);
        if (cloudState) {
            currentState = { ...cloudState, userId: newUserId };
        } else {
            currentState = { ...DEFAULT_STATE, userId: newUserId };
        }

        saveState();
        notify();
    },

    // Initialize (Call this on app mount)
    initialize: async (userId: string) => {
        if (currentState.userId === userId) return; // Already loaded
        await newsStore.reset(userId);
    }
};
