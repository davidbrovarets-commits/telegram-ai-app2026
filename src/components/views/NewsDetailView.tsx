import React from 'react';
import type { News } from '../../types';
import { formatTitle7Words } from '../../utils/newsFormat';
import './NewsDetailView.css'; // We will create this

interface NewsDetailViewProps {
    item: News;
    onBack: () => void;
}

export const NewsDetailView: React.FC<NewsDetailViewProps> = ({ item, onBack }) => {
    // 1. Header Logic: Matches Feed Card Title
    const displayTitle = formatTitle7Words(item.title);

    // 2. Hostname Extraction
    let hostname = '';
    try {
        if (item.link) {
            const url = new URL(item.link);
            hostname = url.hostname;
        }
    } catch {
        hostname = 'source';
    }

    // Truncate hostname if needed (15 chars)
    if (hostname.length > 15) {
        hostname = hostname.substring(0, 15) + '...';
    }

    // 3. Image Logic
    const imageUrl = item.image_status === 'generated' ? item.image_url : '/placeholder-image.svg';

    return (
        <div className="news-detail-view">
            {/* Header / Nav */}
            <div className="news-detail-header">
                <button onClick={onBack} className="back-button">
                    ← Tagasi
                </button>
                <div className="header-title">{displayTitle}</div>
            </div>

            <div className="detail-scroll-container">
                {/* Image Block */}
                <div className="detail-image-container">
                    <img
                        src={imageUrl}
                        alt={item.title}
                        className="detail-image"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                </div>

                {/* Text Block */}
                <div className="detail-content">
                    {/* Render long text with preserved formatting */}
                    <div className="detail-text">
                        {item.content || "Sisu puudub..."}
                    </div>

                    {/* Source Link */}
                    <div className="detail-source-line">
                        Allikas: <a href={item.link} target="_blank" rel="noopener noreferrer">{hostname}</a>
                    </div>
                </div>

                {/* Primary Action */}
                <div className="detail-actions">
                    <button
                        className="read-more-button"
                        onClick={() => window.open(item.link, '_blank')}
                    >
                        Loe edasi algallikast
                    </button>
                </div>
            </div>
        </div>
    );
};
