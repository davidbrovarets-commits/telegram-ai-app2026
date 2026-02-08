import { useState, useEffect } from 'react';
import { NewsDetailView } from './NewsDetailView';
import { useNews } from '../../hooks/useNews';
import type { News } from '../../types';
import { supabase } from '../../supabaseClient'; // Direct fetch for item content
import { NewsCard } from '../news/NewsCard';
import { ArchiveView } from './ArchiveView';

interface NewsViewProps {
    news?: News[];
    onNewsClick: (news: News & { type: 'news' }) => void;
    land?: string;
    city?: string;
}

export const NewsView = ({ land, city }: Omit<NewsViewProps, 'onNewsClick'>) => {
    const [selectedNews, setSelectedNews] = useState<News | null>(null);
    const {
        visibleFeed,
        handleSwipe } = useNews({ land, city });
    const [newsItems, setNewsItems] = useState<Record<number, News>>({});
    const [showArchive, setShowArchive] = useState(false);

    // Fetch actual news objects for the visible IDs
    useEffect(() => {
        const fetchItems = async () => {
            const idsToFetch = visibleFeed.filter(id => id > 0 && !newsItems[id]);
            if (idsToFetch.length === 0) return;

            const { data } = await supabase
                .from('news')
                .select('*')
                .in('id', idsToFetch);

            if (data) {
                setNewsItems(prev => {
                    const next = { ...prev };
                    data.forEach((item: News) => next[item.id] = item);
                    return next;
                });
            }
        };
        fetchItems();
    }, [visibleFeed]); // Re-run when feed changes

    // FORCE REFRESH ON MOUNT if empty
    useEffect(() => {
        if (visibleFeed.length === 0 || visibleFeed.every(id => id <= 0)) {
            console.log('[NewsView] Feed empty on mount. Forcing check...');
            import('../../services/news/FeedManager').then(({ FeedManager }) => {
                FeedManager.initialize(land, city);
            });
        }
    }, []);

    // Helper to get item or loading placeholder
    const getItem = (id: number, _idx: number) => {
        if (id <= 0) return null; // Loading or Empty
        return newsItems[id];
    };

    // Type Badges (L6)


    const handleCardClick = (item: News) => {
        // Signal Tracking
        import('../../services/news/SignalProcessor').then(({ SignalProcessor }) => {
            SignalProcessor.trackOpen(item);
        });
        setSelectedNews(item); // Set selected news to display detail view
        // onNewsClick({ ...item, type: 'news' } as any); // This prop is for parent component, not needed if detail is shown here
    }

    if (showArchive) {
        return <ArchiveView onBack={() => setShowArchive(false)} />;
    }

    if (selectedNews) {
        return (
            <NewsDetailView
                item={selectedNews}
                onBack={() => setSelectedNews(null)}
            />
        );
    }

    return (
        <div className="news-view" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Header */}
            <div className="task-card" style={{
                justifyContent: 'center',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,122,255,0.3)'
            }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>📰 СТРІЧКА НОВИН</h4>
            </div>

            {/* 6-Slot Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {visibleFeed.map((id, index) => {
                    const item = getItem(id, index);
                    if (!item) return (
                        <div key={`param-${index}`} className="news-card" style={{ height: '80px', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#8E8E93' }}>Завантаження...</span>
                        </div>
                    );

                    // const badge = TYPE_BADGES[item.type || 'INFO'] || TYPE_BADGES['INFO'];

                    return (
                        <NewsCard
                            key={item.id}
                            item={item}
                            onPress={() => {
                                handleCardClick(item);
                                setSelectedNews(item);
                            }}
                            onDelete={() => handleSwipe(item.id, 'RIGHT')} // Right = Delete
                            onArchive={() => handleSwipe(item.id, 'LEFT')} // Left = Archive
                            deleteLabel="Видалити"
                            variant="feed"
                        />
                    );
                })}
            </div>

            {/* Archive Section */}
            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={() => setShowArchive(true)}
                    style={{
                        width: '100%',
                        background: 'var(--card-bg)', // Same as news card
                        border: 'none',
                        borderRadius: '18px', // Same as news card
                        padding: '16px',
                        color: 'var(--text-main)', // Text color from vars
                        fontSize: '17px',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', // Same shadow
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer'
                    }}>
                    📂 Відкрити архів
                </button>
            </div>

            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '10px', color: '#D1D1D6' }}>
                Свайп: Вліво = В архів, Вправо = Видалити
            </div>
            {/* FIX #5: Remove Build Timestamp */}
        </div>
    );
};
