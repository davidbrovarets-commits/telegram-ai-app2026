import { newsStore } from '../../stores/newsStore';
import type { News } from '../../types';

export class SignalProcessor {

    // S1: read_opened
    static trackOpen(news: News) {
        if (!news.type) return;

        const state = newsStore.getState();
        const typeSignals = state.signals[news.type] || { openRate: 0, timeSpent: 0 };

        // Simple increment logic (rolling average simulation)
        // In real app, we'd store raw events array.
        // Here we just bump the counter for MVP L6.
        const newOpenRate = typeSignals.openRate + 1;

        newsStore.setState(prev => ({
            ...prev,
            signals: {
                ...prev.signals,
                [news.type!]: {
                    ...typeSignals,
                    openRate: newOpenRate
                }
            },
            // Update User State if needed (State Machine S1)
            userState: 'ACTIVE_READER'
        }));

        console.log(`[Signal] Tracked Open for ${news.type}. New Count: ${newOpenRate}`);
    }

    // S2: read_time (To be called on close/unmount of detail view)
    static trackReadTime(_news: News, ms: number) {
        // Implementation for future S2
        console.log(`[Signal] Read Time: ${ms}ms`);
    }
}
