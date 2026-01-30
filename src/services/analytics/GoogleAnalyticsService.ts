
// Basic Google Analytics 4 integration for Telegram Mini App

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

export const initAnalytics = () => {
    if (!GA_MEASUREMENT_ID) {
        console.warn('GA_MEASUREMENT_ID is not set. Analytics disabled.');
        return;
    }

    // Load GA script dynamically
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
        window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname,
    });
};

export const logEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
        window.gtag('event', eventName, params);
    }
};

// Pre-defined events relevant for the app
export const AnalyticsEvents = {
    APP_OPEN: 'app_open',
    NEWS_CLICK: 'news_click',
    DOCUMENT_SCAN: 'document_scan',
    CHAT_MESSAGE_SENT: 'chat_message_sent',
    THEME_CHANGED: 'theme_changed'
};
