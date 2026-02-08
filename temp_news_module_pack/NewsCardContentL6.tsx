import React from 'react';
import type { News } from '../../types';
import { formatTitle7Words, formatSummary200Words } from '../../utils/newsFormat';

type Props = {
    item: News;
    onPress?: () => void;
};

export function NewsCardContentL6({ item, onPress }: Props) {
    // L6 Fix: Use shared formatters
    const preLine = formatTitle7Words(item.title || item.uk_summary || item.content || '');
    const summary = formatSummary200Words(item.uk_summary || item.content || '');

    return (
        <div
            className="news-card"
            onClick={onPress}
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                cursor: onPress ? 'pointer' : 'default'
            }}
        >
            <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                {/* A. PRE-IMAGE LINE */}
                <div style={{ padding: '12px 16px 8px 16px' }}>
                    <div style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        lineHeight: '1.3',
                        color: 'var(--text-main)',
                        fontFamily: 'var(--font-main)'
                    }}>
                        {preLine}
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
                            draggable={false}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                pointerEvents: 'none', // ✅ critical for swipe
                                userSelect: 'none'
                            }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(45deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%, #e5e7eb 100%)',
                            backgroundSize: '20px 20px',
                            opacity: 0.5
                        }} />
                    )}
                </div>

                {/* C. SOURCE LINE */}
                <div style={{ padding: '8px 16px 4px 16px', fontSize: '11px', color: '#8E8E93', fontWeight: 500 }}>
                    Allikas: {item.source} · {new Date(item.published_at || Date.now()).toLocaleDateString('uk-UA')}
                </div>

                {/* D. SUMMARY */}
                <div style={{ padding: '0 16px 16px 16px' }}>
                    <div style={{
                        fontSize: '15px',
                        fontWeight: 400,
                        lineHeight: '1.5',
                        color: 'var(--text-sub)',
                        whiteSpace: 'pre-line',
                        overflow: 'hidden'
                    }}>
                        {summary}
                    </div>
                </div>

                {/* E. ACTION */}
                {item.link && (
                    <div style={{ padding: '0 16px 16px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#007AFF',
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
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
