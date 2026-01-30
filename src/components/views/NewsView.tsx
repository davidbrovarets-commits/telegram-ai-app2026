import type { News } from '../../types';

interface NewsViewProps {
    news: News[];
    onNewsClick: (news: News & { type: 'news' }) => void;
}

// Ukrainian translations for action tags
const ACTION_LABELS: Record<string, { icon: string; label: string; color: string; bg: string }> = {
    'deadline': { icon: '⏰', label: 'Термін', color: '#C62828', bg: '#FFEBEE' },
    'document_required': { icon: '📄', label: 'Документи', color: '#1565C0', bg: '#E3F2FD' },
    'appointment': { icon: '📅', label: 'Запис', color: '#6A1B9A', bg: '#F3E5F5' },
    'payment_change': { icon: '💰', label: 'Виплати', color: '#2E7D32', bg: '#E8F5E9' },
    'status_risk': { icon: '⚠️', label: 'Ризик', color: '#E65100', bg: '#FFF3E0' },
    'procedure_change': { icon: '🔄', label: 'Зміна процедури', color: '#00695C', bg: '#E0F2F1' },
    'info': { icon: 'ℹ️', label: 'Інформація', color: '#1976D2', bg: '#E3F2FD' }
};

const SCOPE_LABELS: Record<string, string> = {
    DE: '🇩🇪 Німеччина',
    LAND: '🏛️ Федер. земля',
    CITY: '🏙️ Місто'
};

const PRIORITY_LABELS: Record<string, { label: string; bg: string }> = {
    HIGH: { label: 'ТЕРМІНОВО', bg: '#FF3B30' },
    MEDIUM: { label: 'ВАЖЛИВО', bg: '#FF9500' }
};

export const NewsView = ({ news, onNewsClick }: NewsViewProps) => {
    return (
        <div className="news-view">
            <div className="task-card" style={{ justifyContent: 'center', marginBottom: '20px', background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)', color: 'white' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>📰 ВСІ НОВИНИ</h4>
            </div>

            {news.map(item => {
                const priority = PRIORITY_LABELS[item.priority || ''];
                const expiryDate = item.expires_at ? new Date(item.expires_at) : null;

                return (
                    <div
                        key={item.id}
                        className="news-card"
                        onClick={() => onNewsClick({ ...item, type: 'news' })}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr 100px 140px 100px',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderLeft: item.priority === 'HIGH' ? '4px solid #FF3B30' :
                                item.priority === 'MEDIUM' ? '4px solid #FF9500' : '4px solid #E5E5EA'
                        }}
                    >
                        {/* Column 1: Scope + Date + Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#8E8E93' }}>
                                {SCOPE_LABELS[item.scope || ''] || ''}
                            </span>
                            <span style={{ fontSize: '12px', color: '#3C3C43' }}>
                                {item.created_at ? new Date(item.created_at).toLocaleDateString('uk-UA') : ''}
                            </span>
                            {priority && (
                                <span style={{
                                    backgroundColor: priority.bg,
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    width: 'fit-content'
                                }}>
                                    {priority.label}
                                </span>
                            )}
                        </div>

                        {/* Column 2: Title (bold, wraps) */}
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1C1C1E', lineHeight: 1.3 }}>
                            {item.title}
                        </div>

                        {/* Column 3: Source */}
                        <div style={{ fontSize: '11px', color: '#8E8E93', textAlign: 'center' }}>
                            {item.source}
                        </div>

                        {/* Column 4: Action Tags */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {item.actions?.slice(0, 2).map((action, i) => {
                                const tag = ACTION_LABELS[action] || { icon: '', label: action, color: '#666', bg: '#F5F5F5' };
                                return (
                                    <span key={i} style={{
                                        backgroundColor: tag.bg,
                                        color: tag.color,
                                        padding: '3px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {tag.icon} {tag.label}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Column 5: Expiry */}
                        <div style={{ fontSize: '11px', color: '#8E8E93', textAlign: 'right' }}>
                            {expiryDate && (
                                <>
                                    <div>⏳ Актуально до:</div>
                                    <div style={{ fontWeight: 600, color: '#3C3C43' }}>
                                        {expiryDate.toLocaleDateString('uk-UA')}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
