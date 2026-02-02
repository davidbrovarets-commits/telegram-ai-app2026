import { useState, useEffect } from 'react';
import { useNews } from '../../hooks/useNews';
import type { News } from '../../types';
import { supabase } from '../../supabaseClient'; // Direct fetch for item content
import { SwipeableNewsCard } from './SwipeableNewsCard';
import { ArchiveView } from './ArchiveView';

interface NewsViewProps {
    news?: News[];
    onNewsClick: (news: News & { type: 'news' }) => void;
    land?: string;
    city?: string;
}

export const NewsView = ({ onNewsClick, land, city }: NewsViewProps) => {
    const { visibleFeed, handleSwipe } = useNews({ land, city });
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
        onNewsClick({ ...item, type: 'news' } as any);
    }

    return showArchive ? (
        <ArchiveView onBack={() => setShowArchive(false)} />
    ) : (
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
                        <SwipeableNewsCard
                            key={item.id}
                            onDelete={() => handleSwipe(item.id, 'LEFT')} // Left action in hook is Delete
                            onArchive={() => handleSwipe(item.id, 'RIGHT')} // Right action in hook is Archive
                            deleteLabel="Видалити"
                            archiveLabel="В архів"
                            onPress={() => handleCardClick(item)}
                        >
                            <div
                                className="news-card"
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    padding: '0',
                                    overflow: 'hidden',
                                    borderLeft: 'none',
                                    transition: 'transform 0.2s ease',
                                    background: 'var(--card-bg)',
                                    borderRadius: '18px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}
                            >
                                {/* CONTENT BLOCK - Minimalist (Title + Summary only) */}
                                {/* Added bottom padding to prevent text from overlapping the badge */}
                                <div style={{ padding: '16px 16px 48px 16px' }}>
                                    {/* Title (Headline) */}
                                    <div style={{
                                        fontSize: '17px',
                                        fontWeight: 700,
                                        lineHeight: '1.3',
                                        color: 'var(--text-main)',
                                        marginBottom: '8px',
                                        fontFamily: 'var(--font-main)'
                                    }}>
                                        {item.title}
                                    </div>

                                    {/* Summary (Body) */}
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: 400,
                                        lineHeight: '1.5',
                                        color: 'var(--text-sub)',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {item.uk_summary || (item.content ? item.content.split('\n\n')[0] : '')}
                                    </div>
                                </div>

                                {/* LOCATION BADGE (Bottom Right) */}
                                <div style={{
                                    position: 'absolute',
                                    right: '12px',
                                    bottom: '12px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#1C1C1E', // Darker text
                                    background: 'rgba(0, 0, 0, 0.08)', // Visible background
                                    padding: '4px 10px',
                                    borderRadius: '12px', // Rounded corners
                                    // textTransform: 'uppercase', // Optional, maybe keep it normal for nicer look? User asked for "viisaka" (polite). Uppercase is fine.
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 5
                                }}>
                                    {item.city || item.land || 'Німеччина'}
                                </div>
                            </div>
                        </SwipeableNewsCard>
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
                Свайп: Вправо = Kustuta (Удалить), Влево = Arhiveeri (Архив)
            </div>
            <div style={{ marginTop: '5px', textAlign: 'center', fontSize: '8px', color: '#8E8E93', opacity: 0.5 }}>
                BUILD: 2026-02-01T03:22:00Z
            </div>
        </div>
    );
};
