import { useState, useEffect } from 'react';
import { newsStore } from '../stores/newsStore';
import { FeedManager } from '../services/news/FeedManager';
import type { UserNewsState } from '../types';

interface UseNewsOptions {
    land?: string;
    city?: string;
}

export function useNews(options: UseNewsOptions = {}) {
    const [state, setState] = useState<UserNewsState>(newsStore.getState());

    useEffect(() => {
        // Initialize feed logic with user geo
        FeedManager.initialize(options.land, options.city);

        // Subscribe to store updates
        const unsubscribe = newsStore.subscribe((newState) => {
            setState({ ...newState });
        });

        return () => { unsubscribe(); };
    }, [options.land, options.city]);

    const handleSwipe = async (newsId: number, direction: 'LEFT' | 'RIGHT') => {
        await FeedManager.handleSwipe(newsId, direction);
    };

    const handleArchiveDeletion = async (newsId: number) => {
        await FeedManager.handleArchiveDeletion(newsId);
    };

    return {
        ...state,
        handleSwipe,
        handleArchiveDeletion
    };
}

