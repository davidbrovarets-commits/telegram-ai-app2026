import type { News } from '../../types';
import { ChevronRight, FileText, MessageSquare, Map } from 'lucide-react';

interface HomeViewProps {
    news: News[];
    onNewsClick: (news: News & { type: 'news' }) => void;
    onNavigate: (view: 'documents' | 'chat' | 'roadmap') => void;
}

export const HomeView = ({ news, onNewsClick, onNavigate }: HomeViewProps) => {
    const featuredNews = news.length > 0 ? news[0] : null;

    return (
        <div className="home-container" style={{ padding: '0 4px' }}>


            {/* Bento Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

                {/* 1. Featured News (Full Width) */}
                {featuredNews && (
                    <div
                        style={{
                            gridColumn: 'span 2', height: '260px', borderRadius: '24px',
                            overflow: 'hidden', position: 'relative', cursor: 'pointer',
                            boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s'
                        }}
                        onClick={() => onNewsClick({ ...featuredNews, type: 'news' })}
                        className="bento-card"
                    >
                        <img
                            src={featuredNews.image_url || featuredNews.image}
                            alt="News"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '24px', paddingTop: '80px',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                            color: 'white'
                        }}>
                            <div style={{
                                fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                                background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)',
                                padding: '4px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '8px'
                            }}>
                                Головна новина
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                {featuredNews.title}
                            </h3>
                        </div>
                    </div>
                )}

                {/* 2. Quick Action: Documents (Half) */}
                <div
                    onClick={() => onNavigate('documents')}
                    style={{
                        background: 'linear-gradient(135deg, #007AFF 0%, #00C7BE 100%)',
                        borderRadius: '24px', padding: '20px', height: '160px', color: 'white',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-md)', cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <FileText size={20} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Документи</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>Скан та архів</div>
                    </div>
                </div>

                {/* 3. Quick Action: AI Chat (Half) */}
                <div
                    onClick={() => onNavigate('chat')}
                    style={{
                        background: 'linear-gradient(135deg, #AF52DE 0%, #5856D6 100%)',
                        borderRadius: '24px', padding: '20px', height: '160px', color: 'white',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-md)', cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <MessageSquare size={20} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Асистент</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>Запитати AI</div>
                    </div>
                </div>

                {/* 4. Roadmap Status (Full Width) */}
                <div
                    onClick={() => onNavigate('roadmap')}
                    style={{
                        gridColumn: 'span 2', background: 'var(--card-bg)',
                        borderRadius: '24px', padding: '20px',
                        boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px'
                    }}
                >
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Map size={24} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                            Ваш прогрес
                        </div>
                        <div style={{
                            width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden'
                        }}>
                            <div style={{ width: '35%', height: '100%', background: '#34C759', borderRadius: '3px' }}></div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '6px' }}>
                            Продовжити: Етап 1 (Основа)
                        </div>
                    </div>
                    <ChevronRight size={20} color="var(--text-sub)" />
                </div>

            </div>
        </div>
    );
};
