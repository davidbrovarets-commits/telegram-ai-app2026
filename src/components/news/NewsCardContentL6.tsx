// import React from 'react';
import type { News } from '../../types';

type Props = {
    item: News;
    onPress?: () => void;
};

export function NewsCardContentL6({ item, onPress }: Props) {
    // CR-007: Title word count enforced at generation time — render as-is
    const preLine = item.title || item.uk_summary || item.content || '';
    const summary = item.uk_summary || item.content || '';

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
                {/* 1. TITLE (Pre-Image Line) */}
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

                {/* 2. IMAGE (16:9) */}
                <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: '#f0f0f0',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {item.image_url && item.image_status !== 'failed' ? (
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
                            background: 'linear-gradient(135deg, var(--bg-secondary, #f3f4f6) 0%, var(--card-bg, #e5e7eb) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.6
                        }}>
                            <span style={{ fontSize: '32px' }}>📰</span>
                        </div>
                    )}
                </div>

                {/* 3. DATE LINE (Right Aligned, Date Only) */}
                <div style={{
                    padding: '8px 16px 0 16px',
                    fontSize: '11px',
                    color: '#8E8E93',
                    fontWeight: 500,
                    textAlign: 'right'
                }}>
                    {new Date(item.published_at || Date.now()).toLocaleDateString('uk-UA')}
                </div>

                {/* 4. SUMMARY (Short Teaser) */}
                <div style={{ padding: '0 16px 16px 16px' }}>
                    <div style={{
                        fontSize: '15px',
                        fontWeight: 400,
                        lineHeight: '1.5',
                        color: 'var(--text-sub)',
                        whiteSpace: 'pre-line',
                        overflow: 'hidden',
                        marginBottom: '16px'
                    }}>
                        {summary}
                    </div>
                </div>
            </div>
        </div>
    );
}
