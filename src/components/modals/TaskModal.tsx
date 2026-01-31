import type { Task, News } from '../../types';

interface TaskModalProps {
    task: (Task & { type?: never }) | (News & { type: 'news' });
    unlockedTasks: string[];
    onClose: () => void;
    onUnlock: (task: Task) => void;
}

export const TaskModal = ({ task, unlockedTasks, onClose, onUnlock }: TaskModalProps) => {
    const isNews = 'type' in task && task.type === 'news';
    const isUnlocked = !isNews && (task as Task).category !== 'premium'
        ? true
        : unlockedTasks.includes((task as Task).id);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        {isNews && (task as any).uk_summary
                            ? (task as any).uk_summary.split('\n\n')[0]
                            : task.title}
                    </h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {isNews ? (
                    <div className="modal-body">
                        <img
                            src={(task as unknown as News).image_url || (task as unknown as News).image}
                            style={{ width: '100%', borderRadius: '12px', marginBottom: '15px' }}
                            alt=""
                        />
                        <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                            Джерело: {(task as unknown as News).source}
                        </p>
                        <hr className="divider" />

                        {/* Show UK Summary Body if available */}
                        {isNews && (task as any).uk_summary ? (
                            <p className="modal-text">
                                {(task as any).uk_summary.split('\n\n').slice(1).join('\n\n') || (task as any).uk_summary}
                            </p>
                        ) : (
                            // Fallback to German if no UK summary (should not happen after rescrape)
                            <p className="modal-text">{task.content}</p>
                        )}

                        {(task as unknown as News).link && (
                            <a
                                href={(task as unknown as News).link}
                                target="_blank"
                                className="external-link-btn"
                                style={{ marginTop: '15px', textDecoration: 'none' }}
                            >
                                Читати далі (Оригінал) 🔗
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="modal-body">
                        {(task as Task).category === 'premium' && !isUnlocked ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <p>Ціна: {(task as Task).price} кристалів</p>
                                <button
                                    className="primary-btn"
                                    onClick={() => onUnlock(task as Task)}
                                >
                                    Відкрити
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="modal-text">{task.content}</p>
                                {((task as Task).link || (task as any).link_text) && (
                                    <a
                                        href={(task as Task).link}
                                        target="_blank"
                                        className="external-link-btn"
                                    >
                                        {(task as Task).linkText || (task as any).link_text || 'Link'} 🔗
                                    </a>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
