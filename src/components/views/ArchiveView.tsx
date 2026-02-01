import { useState, useEffect } from 'react';
import { useNews } from '../../hooks/useNews';
import type { News } from '../../types';
import { supabase } from '../../supabaseClient';
import { SwipeableNewsCard } from './SwipeableNewsCard';
import { ArrowLeft } from 'lucide-react';

interface ArchiveViewProps {
    onBack: () => void;
}

export const ArchiveView = ({ onBack }: ArchiveViewProps) => {
    const { history, handleArchiveDeletion } = useNews();
    const [archivedItems, setArchivedItems] = useState<Record<number, News>>({});
    const [loading, setLoading] = useState(true);

    // Fetch archived items
    useEffect(() => {
        const fetchArchived = async () => {
            const ids = history.archived;
            if (ids.length === 0) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('news')
                .select('*')
                .in('id', ids);

            if (data) {
                const map: Record<number, News> = {};
                data.forEach((item: News) => map[item.id] = item);
                setArchivedItems(map);
            }
            setLoading(false);
        };
        fetchArchived();
    }, [history.archived]);

    const handleCardClick = (item: News) => {
        // Just log or maybe expand? For now same as news view but without tracking open rate maybe?
        console.log('Clicked archived item', item.id);
    };

    // Sort items by reverse order of addition (newest archived first) roughly, 
    // but history.archived is array of IDs. We should map in reverse.
    const displayIds = [...history.archived].reverse();

    return (
        <div className="archive-view" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Header */}
            <div className="task-card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                background: '#8E8E93', // Gray for Archive Header
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '16px'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: '10px', // Increased hit area
                        margin: '-10px', // Compensate for padding
                        touchAction: 'manipulation' // Standardize touch
                    }}
                >
                    <ArrowLeft size={24} style={{ pointerEvents: 'none' }} /> {/* Pass clicks through */}
                </button>
                <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>АРХІВ НОВИН</h4>
                <div style={{ width: '24px' }}></div> {/* Spacer for centering */}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayIds.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8E8E93' }}>
                        Архів порожній
                    </div>
                )}

                {displayIds.map(id => {
                    const item = archivedItems[id];
                    if (!item) return null; // Still loading or deleted

                    return (
                        <SwipeableNewsCard
                            key={id}
                            onDelete={() => handleArchiveDeletion(id)}
                            deleteLabel="Видалити"
                            mode="archive" // Enables double delete
                        >
                            <div
                                className="news-card"
                                onClick={() => handleCardClick(item)}
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    padding: '0',
                                    overflow: 'hidden',
                                    borderLeft: 'none',
                                    background: 'var(--card-bg)',
                                    borderRadius: '18px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{ padding: '16px 16px 48px 16px' }}>
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
                                <div style={{
                                    position: 'absolute',
                                    right: '12px',
                                    bottom: '12px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#1C1C1E',
                                    background: 'rgba(0, 0, 0, 0.08)',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
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
        </div>
    );
};
