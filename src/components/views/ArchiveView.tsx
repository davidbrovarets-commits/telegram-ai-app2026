import { useState, useEffect } from 'react';
import { useNews } from '../../hooks/useNews';
import type { News } from '../../types';
import { supabase } from '../../supabaseClient';
import { NewsCard } from '../news/NewsCard';
import { ArrowLeft } from 'lucide-react';

interface ArchiveViewProps {
    onBack: () => void;
    onSelectNews: (news: News) => void;
}

export const ArchiveView = ({ onBack, onSelectNews }: ArchiveViewProps) => {
    const { userId, handleArchiveDeletion, restoreNewsItem } = useNews();
    const [archivedItems, setArchivedItems] = useState<Record<number, News>>({});
    const [displayIds, setDisplayIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    // CR-008: Fetch archived items from DB (Source of Truth)
    useEffect(() => {
        const fetchArchived = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('news')
                .select('*, news_user_state!inner(status, updated_at)')
                .eq('news_user_state.user_id', userId)
                .eq('news_user_state.status', 'ARCHIVED')
                .order('updated_at', { foreignTable: 'news_user_state', ascending: false });

            if (data) {
                const map: Record<number, News> = {};
                const ids: number[] = [];
                data.forEach((item: any) => {
                    map[item.id] = item;
                    ids.push(item.id);
                });
                setArchivedItems(map);
                setDisplayIds(ids);
            }
            setLoading(false);
        };
        fetchArchived();
    }, [userId]);

    const handleCardClick = (item: News) => {
        console.log('Clicked archived item', item.id);
        onSelectNews(item);
    };

    const onDelete = (id: number) => {
        handleArchiveDeletion(id); // Updates Store + DB
        setDisplayIds(prev => prev.filter(i => i !== id)); // Optimistic UI
    };

    const onRestore = (id: number) => {
        restoreNewsItem(id); // Deletes row from DB + Updates Store
        setDisplayIds(prev => prev.filter(i => i !== id)); // Optimistic UI
    };

    // Correction: I should update the component body to destructure restoreNewsItem.
    // See separate call.

    return (
        <div className="archive-view" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Header */}
            <div className="task-card" style={{
                position: 'relative', // Needed for absolute positioning of back button
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center', // Center title
                marginBottom: '20px',
                background: '#8E8E93', // Gray for Archive Header
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '16px',
                minHeight: '60px' // Ensure enough height for touch target
            }}>
                {/* Large Touch Target Wrapper */}
                <div
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onBack();
                    }}
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '80px', // Wide touch area (Green zone)
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999, // Max priority
                        cursor: 'pointer',
                        paddingLeft: '8px' // Slight offset to align visual
                    }}
                >
                    {/* Visual Button (White Box) */}
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'white',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        color: '#1C1C1E'
                    }}>
                        <ArrowLeft size={24} />
                    </div>
                </div>

                <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0, zIndex: 1 }}>АРХІВ НОВИН</h4>
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
                        <NewsCard
                            key={id}
                            item={item}
                            onPress={() => handleCardClick(item)}
                            onDelete={() => onDelete(id)}
                            onRestore={() => onRestore(id)}
                            deleteLabel="Видалити"
                            variant="archive"
                        />
                    );
                })}
            </div>
        </div>
    );
};
