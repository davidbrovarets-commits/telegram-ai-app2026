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
                    <h3>{task.title}</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {isNews ? (
                    <div className="modal-body">
                        <img
                            src={(task as News).image_url || (task as News).image}
                            style={{ width: '100%', borderRadius: '12px', marginBottom: '15px' }}
                            alt=""
                        />
                        <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                            Джерело: {(task as News).source}
                        </p>
                        <hr className="divider" />
                        <p className="modal-text">{task.content}</p>
                        {(task as News).link && (
                            <a
                                href={(task as News).link}
                                target="_blank"
                                className="external-link-btn"
                                style={{ marginTop: '15px', textDecoration: 'none' }}
                            >
                                Читати далі 🔗
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
