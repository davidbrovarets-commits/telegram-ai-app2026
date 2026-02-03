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
                                {/* CONTENT BLOCK - L6 Contract */}
                                <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>

                                    {/* A. PRE-IMAGE LINE (Title/Kicker) */}
                                    <div style={{ padding: '12px 16px 8px 16px' }}>
                                        <div style={{
                                            fontSize: '17px',
                                            fontWeight: 700,
                                            lineHeight: '1.3',
                                            color: 'var(--text-main)',
                                            fontFamily: 'var(--font-main)'
                                        }}>
                                            {item.title}
                                        </div>
                                    </div>

                                    {/* B. IMAGE (16:9) */}
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '16/9',
                                        background: '#f0f0f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {item.image_status === 'generated' && item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt=""
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    // Fallback to placeholder on load error
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            // Placeholder Pattern (Geometric)
                                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%, #e5e7eb 100%)', backgroundSize: '20px 20px', opacity: 0.5 }} />
                                        )}

                                        {/* Badge Overlay (Bottom Right of Image) */}
                                        <div style={{
                                            position: 'absolute',
                                            right: '12px',
                                            bottom: '12px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: 'white',
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            backdropFilter: 'blur(4px)',
                                        }}>
                                            {item.city || item.land || 'Німеччина'}
                                        </div>
                                    </div>

                                    {/* C. SOURCE LINE */}
                                    <div style={{ padding: '12px 16px 4px 16px', fontSize: '11px', color: '#8E8E93', fontWeight: 500 }}>
                                        Allikas: {item.source} · {new Date(item.published_at || Date.now()).toLocaleDateString('uk-UA')}
                                    </div>

                                    {/* D. SUMMARY (Deduped) */}
                                    <div style={{ padding: '0 16px 16px 16px' }}>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: 400,
                                            lineHeight: '1.5',
                                            color: 'var(--text-sub)',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 4,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {/* Dedup Logic: If title is present in summary, remove it? 
                                                Simple heuristic: If summary starts with title, strip it. 
                                                Or rely on 'uk_summary' being clean. 
                                                MVP: Just render summary. Most summaries don't repeat title literally if generated well.
                                                But to be safe: */}
                                            {(item.uk_summary || item.content || '').replace(item.title, '').trim()}
                                        </div>
                                    </div>

                                    {/* E. ACTION (Read More) */}
                                    {item.link && (
                                        <div style={{ padding: '0 16px 16px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()} // Prevent card tap
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: '#007AFF', // System Blue
                                                    textDecoration: 'none',
                                                    padding: '8px 12px',
                                                    background: 'rgba(0, 122, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                Читати далі (оригінал)
                                                {/* Simple Arrow Icon SVG */}
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                            </a>
                                        </div>
                                    )}

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
