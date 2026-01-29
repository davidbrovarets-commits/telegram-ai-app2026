import type { News } from '../../types';

interface NewsViewProps {
    news: News[];
    onNewsClick: (news: News & { type: 'news' }) => void;
}

const PriorityBadge = ({ priority }: { priority?: string }) => {
    if (!priority || priority === 'LOW') return null;

    const styles: Record<string, { bg: string; color: string }> = {
        HIGH: { bg: '#FF3B30', color: 'white' },
        MEDIUM: { bg: '#FF9500', color: 'white' }
    };

    const style = styles[priority] || styles.MEDIUM;

    return (
        <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginLeft: '8px'
        }}>
            {priority}
        </span>
    );
};

const ScopeLabel = ({ scope }: { scope?: string }) => {
    if (!scope) return null;

    const labels: Record<string, string> = {
        DE: '🇩🇪 Німеччина',
        LAND: '🏛️ Федер. земля',
        CITY: '🏙️ Місто'
    };

    return (
        <span style={{
            color: '#8E8E93',
            fontSize: '11px',
            marginRight: '8px'
        }}>
            {labels[scope] || scope}
        </span>
    );
};

export const NewsView = ({ news, onNewsClick }: NewsViewProps) => {
    return (
        <div className="news-view">
            <h4 className="section-title">ВСІ НОВИНИ</h4>

            {news.map(item => (
                <div
                    key={item.id}
                    className="news-card"
                    onClick={() => onNewsClick({ ...item, type: 'news' })}
                    style={{
                        borderLeft: item.priority === 'HIGH' ? '3px solid #FF3B30' :
                            item.priority === 'MEDIUM' ? '3px solid #FF9500' : 'none'
                    }}
                >
                    <div className="news-header">
                        <ScopeLabel scope={item.scope} />
                        <span className="news-date">
                            {item.created_at
                                ? new Date(item.created_at).toLocaleDateString()
                                : item.date}
                        </span>
                        <PriorityBadge priority={item.priority} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.source}</p>
                    {item.actions && item.actions.length > 0 && (
                        <div style={{ marginTop: '6px' }}>
                            {item.actions.map((action, i) => (
                                <span key={i} style={{
                                    display: 'inline-block',
                                    backgroundColor: '#E5E5EA',
                                    color: '#3C3C43',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    marginRight: '4px'
                                }}>
                                    {action}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
