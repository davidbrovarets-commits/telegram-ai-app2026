import { useState, useEffect } from 'react';
import { useNews } from '../../hooks/useNews';
import type { News } from '../../types';
import { supabase } from '../../supabaseClient';
import { NewsCard } from '../news/NewsCard';
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
                            onDelete={() => handleArchiveDeletion(id)}
                            deleteLabel="Видалити"
                            variant="archive"
                        />
                    );
                })}
            </div>
        </div>
    );
};
