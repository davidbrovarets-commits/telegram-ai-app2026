import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './ProductionStateView.css';

// Build metadata injected at build time via VITE_BUILD_* env vars
const BUILD_SHA = import.meta.env.VITE_BUILD_SHA || 'dev';
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();
const BUILD_REF = import.meta.env.VITE_BUILD_REF || 'local';
const BUILD_BRANCH = import.meta.env.VITE_BUILD_BRANCH || 'local';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ANON_KEY_PRESENT = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
const SHOW_PROMPT_DEBUG = import.meta.env.VITE_SHOW_PROMPT_DEBUG === 'true';

interface NewsItem {
    id: number;
    title: string;
    link: string;
    source: string;
    published_at: string | null;
    created_at: string;
    image_url: string | null;
    image_prompt: string | null;
}

const PAGE_SIZE = 20;

export function ProductionStateView() {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [copied, setCopied] = useState(false);

    const supabaseDomain = (() => {
        try { return new URL(SUPABASE_URL).host; } catch { return 'unknown'; }
    })();

    const evidence = [
        `Environment: PRODUCTION (LIVE)`,
        `SHA: ${BUILD_SHA}`,
        `Build Time: ${BUILD_TIME}`,
        `Deploy Run: #${BUILD_REF}`,
        `Branch: ${BUILD_BRANCH}`,
        `Supabase Host: ${supabaseDomain}`,
        `Anon Key Present: ${ANON_KEY_PRESENT}`,
        `Checked: ${new Date().toISOString()}`,
    ].join('\n');

    const fetchNews = async (offset: number) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('news')
                .select('id, title, link, source, published_at, created_at, image_url, image_prompt')
                .order('published_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            if (fetchError) {
                setError(`Supabase read error: ${fetchError.message} (code: ${fetchError.code})`);
                return [];
            }
            return data || [];
        } catch (e: any) {
            setError(`Network error: ${e.message}`);
            return [];
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const data = await fetchNews(0);
            if (!cancelled) {
                setNewsItems(data);
                setHasMore(data.length === PAGE_SIZE);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const loadMore = async () => {
        setLoadingMore(true);
        const data = await fetchNews(newsItems.length);
        setNewsItems(prev => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
        setLoadingMore(false);
    };

    const copyEvidence = () => {
        navigator.clipboard.writeText(evidence).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="prod-state">
            <header className="prod-state__header">
                <div className="prod-state__badge">PRODUCTION (LIVE)</div>
                <h1 className="prod-state__title">Production State</h1>
                <p className="prod-state__subtitle">navestic.com — Build Verification</p>
            </header>

            <section className="prod-state__meta">
                <h2 className="prod-state__section-title">Build Info</h2>
                <div className="prod-state__grid">
                    <div className="prod-state__field">
                        <span className="prod-state__label">Commit SHA</span>
                        <code className="prod-state__value">{BUILD_SHA}</code>
                    </div>
                    <div className="prod-state__field">
                        <span className="prod-state__label">Build Time</span>
                        <code className="prod-state__value">{BUILD_TIME}</code>
                    </div>
                    <div className="prod-state__field">
                        <span className="prod-state__label">Deploy Run</span>
                        <code className="prod-state__value">#{BUILD_REF}</code>
                    </div>
                    <div className="prod-state__field">
                        <span className="prod-state__label">Branch</span>
                        <code className="prod-state__value">{BUILD_BRANCH}</code>
                    </div>
                </div>
            </section>

            <section className="prod-state__meta">
                <h2 className="prod-state__section-title">Supabase Target</h2>
                <div className="prod-state__grid">
                    <div className="prod-state__field">
                        <span className="prod-state__label">Host</span>
                        <code className="prod-state__value">{supabaseDomain}</code>
                    </div>
                    <div className="prod-state__field">
                        <span className="prod-state__label">Anon Key Present</span>
                        <code className={`prod-state__value ${ANON_KEY_PRESENT ? 'prod-state__ok' : 'prod-state__err'}`}>
                            {ANON_KEY_PRESENT ? '✅ true' : '❌ false'}
                        </code>
                    </div>
                </div>
            </section>

            <section className="prod-state__evidence">
                <button className="prod-state__copy-btn" onClick={copyEvidence}>
                    {copied ? '✅ Copied!' : '📋 Copy Evidence'}
                </button>
            </section>

            <section className="prod-state__checklist">
                <h2 className="prod-state__section-title">Operator Checklist</h2>
                <ol className="prod-state__checklist-list">
                    <li>Open GitHub Actions → latest "Deploy to Firebase Hosting" run</li>
                    <li>Note the commit SHA and run number</li>
                    <li>Compare with SHA and Run # shown above — <strong>must match exactly</strong></li>
                    <li>Branch must be <code>main</code></li>
                    <li>News feed below loads (or shows explicit RLS error)</li>
                </ol>
            </section>

            <section className="prod-state__news">
                <h2 className="prod-state__section-title">
                    Production News Feed
                    <span className="prod-state__count">
                        {!loading && !error && ` (${newsItems.length} items)`}
                    </span>
                </h2>

                {loading && <div className="prod-state__loading">Loading news…</div>}

                {error && (
                    <div className="prod-state__error-panel">
                        <strong>⚠️ Read Error</strong>
                        <pre>{error}</pre>
                        <p>This may indicate RLS policy blocking anonymous reads. Check Supabase RLS configuration.</p>
                    </div>
                )}

                {!loading && !error && newsItems.length === 0 && (
                    <div className="prod-state__empty">No news items found in database.</div>
                )}

                <div className="prod-state__news-grid">
                    {newsItems.map(item => (
                        <a
                            key={item.id}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="prod-state__card"
                        >
                            {item.image_url && (
                                <img
                                    src={item.image_url}
                                    alt=""
                                    className="prod-state__card-img"
                                    loading="lazy"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                            <div className="prod-state__card-body">
                                <h3 className="prod-state__card-title">{item.title}</h3>
                                <div className="prod-state__card-meta">
                                    <span className="prod-state__card-source">{item.source}</span>
                                    <span className="prod-state__card-date">
                                        {item.published_at
                                            ? new Date(item.published_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
                                            : new Date(item.created_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            </div>
                            {SHOW_PROMPT_DEBUG && item.image_prompt && (
                                <details className="prod-state__prompt-debug" onClick={e => e.preventDefault()}>
                                    <summary>🔍 View Image Prompt</summary>
                                    <pre className="prod-state__prompt-pre">{item.image_prompt}</pre>
                                </details>
                            )}
                        </a>
                    ))}
                </div>

                {hasMore && !loading && !error && newsItems.length > 0 && (
                    <button
                        className="prod-state__load-more"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'Loading…' : 'Load More'}
                    </button>
                )}
            </section>

            <footer className="prod-state__footer">
                Production State View • Read-Only • No mutations
            </footer>
        </div>
    );
}
