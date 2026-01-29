import { useState } from 'react';
import type { News } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HomeViewProps {
    username: string;
    news: News[];
    onNewsClick: (news: News & { type: 'news' }) => void;
}

export const HomeView = ({ username, news, onNewsClick }: HomeViewProps) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentSlide((prev) => (prev + 1) % news.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentSlide((prev) => (prev - 1 + news.length) % news.length);
    };

    return (
        <div className="home-container">
            <h1 className="welcome-text">Ласкаво просимо, {username}!</h1>
            <p className="welcome-sub">Ось важливі новини для вас:</p>

            {news.length > 0 ? (
                <div className="news-carousel-container">
                    <div
                        className="news-carousel-card"
                        onClick={() => onNewsClick({ ...news[currentSlide], type: 'news' })}
                    >
                        <img
                            src={news[currentSlide].image_url || news[currentSlide].image}
                            alt="News"
                            className="carousel-img"
                        />
                        <div className="carousel-overlay">
                            <span className="carousel-source">{news[currentSlide].source}</span>
                            <h3 className="carousel-title">{news[currentSlide].title}</h3>
                        </div>
                    </div>

                    <button className="carousel-btn prev" onClick={prevSlide}>
                        <ChevronLeft size={24} />
                    </button>
                    <button className="carousel-btn next" onClick={nextSlide}>
                        <ChevronRight size={24} />
                    </button>

                    <div className="carousel-indicators">
                        {news.map((_, idx) => (
                            <span key={idx} className={`dot ${idx === currentSlide ? 'active' : ''}`}></span>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{
                    height: '240px', background: 'var(--card-bg)', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <div className="loader"></div>
                </div>
            )}
        </div>
    );
};
