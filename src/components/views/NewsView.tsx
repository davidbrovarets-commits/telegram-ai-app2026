import type { News } from '../../types';

interface NewsViewProps {
    news: News[];
    onNewsClick: (news: News & { type: 'news' }) => void;
}

export const NewsView = ({ news, onNewsClick }: NewsViewProps) => {
    return (
        <div className="news-view">
            <h4 className="section-title">ВСІ НОВИНИ</h4>

            {news.map(item => (
                <div
                    key={item.id}
                    className="news-card"
                    onClick={() => onNewsClick({ ...item, type: 'news' })}
                >
                    <div className="news-header">
                        <span className="news-date">
                            {item.created_at
                                ? new Date(item.created_at).toLocaleDateString()
                                : item.date}
                        </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.source}</p>
                </div>
            ))}
        </div>
    );
};
