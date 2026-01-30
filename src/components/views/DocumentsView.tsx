import { useRef, useState } from 'react';
import type { PersonalTask, UserFile } from '../../types';
import { Camera, FileText, Plus, Trash2, Check, StickyNote, ChevronRight } from 'lucide-react';

interface DocumentsViewProps {
    userFiles: UserFile[];
    personalTasks: PersonalTask[];
    onFileSelect: (file: File) => void;
    onFileClick: (file: UserFile) => void;
    onAddPersonalTask: (title: string) => void;
    onTogglePersonalTask: (task: PersonalTask) => void;
    onDeletePersonalTask: (id: number) => void;
}

export const DocumentsView = ({
    userFiles,
    personalTasks,
    onFileSelect,
    onFileClick,
    onAddPersonalTask,
    onTogglePersonalTask,
    onDeletePersonalTask
}: DocumentsViewProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newPersonalTask, setNewPersonalTask] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onFileSelect(file);
    };

    const handleAddTask = () => {
        if (!newPersonalTask.trim()) return;
        onAddPersonalTask(newPersonalTask);
        setNewPersonalTask('');
    };

    return (
        <div className="task-list-container">
            {/* Upload button area */}
            <div style={{ marginBottom: '24px' }}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                />
                <button
                    className="primary-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: 'linear-gradient(135deg, #0071E3, #00C7BE)', /* Apple Blue to Teal */
                        border: 'none',
                        boxShadow: '0 8px 20px -6px rgba(0, 113, 227, 0.4)'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Camera size={20} strokeWidth={2.5} />
                    <span>Додати документ</span>
                </button>
            </div>

            <div className="task-card" style={{ justifyContent: 'center', marginBottom: '20px', background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)', color: 'white' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>📂 ВАШІ ДОКУМЕНТИ</h4>
            </div>

            {
                userFiles.length === 0 && (
                    <div style={{
                        textAlign: 'center', color: 'var(--text-sub)',
                        padding: '40px 20px', background: 'var(--card-bg)',
                        borderRadius: 'var(--radius-card)', border: '2px dashed var(--border)'
                    }}>
                        <FileText size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                        <p>Немає документів. Зробіть фото!</p>
                    </div>
                )
            }

            {/* Files list */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
                {userFiles.map(file => (
                    <div
                        key={file.id}
                        className="task-card"
                        onClick={() => onFileClick(file)}
                    >
                        <div style={{
                            width: '40px', height: '40px', background: 'var(--primary-light)',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary)', flexShrink: 0
                        }}>
                            <FileText size={20} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.file_name}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                                {new Date(file.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <ChevronRight size={20} style={{ color: '#C7C7CC' }} />
                    </div>
                ))}
            </div>

            {/* Personal notes */}
            <h4 className="section-title">ШВИДКІ НОТАТКИ</h4>
            <div
                style={{
                    background: 'var(--card-bg)',
                    padding: '20px',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '20px'
                }}
            >
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Що не забути?"
                            value={newPersonalTask}
                            onChange={e => setNewPersonalTask(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                            style={{
                                width: '100%', padding: '12px 16px', paddingLeft: '40px',
                                borderRadius: '12px', border: '1px solid var(--border)',
                                background: 'var(--bg-color)', color: 'var(--text-main)',
                                outline: 'none', fontSize: '15px'
                            }}
                        />
                        <StickyNote size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-sub)' }} />
                    </div>
                    <button
                        onClick={handleAddTask}
                        style={{
                            background: 'var(--primary)', color: 'white',
                            border: 'none', borderRadius: '12px', width: '44px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {personalTasks.map(pt => (
                        <div
                            key={pt.id}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                paddingBottom: '12px', borderBottom: '1px solid var(--divider)'
                            }}
                        >
                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}
                                onClick={() => onTogglePersonalTask(pt)}
                            >
                                <div className={`checkbox ${pt.is_completed ? 'checked' : ''}`} style={{ width: '22px', height: '22px' }}>
                                    {pt.is_completed && <Check size={14} strokeWidth={3} />}
                                </div>
                                <span
                                    style={{
                                        textDecoration: pt.is_completed ? 'line-through' : 'none',
                                        color: pt.is_completed ? 'var(--text-tertiary)' : 'var(--text-main)',
                                        fontSize: '15px'
                                    }}
                                >
                                    {pt.title}
                                </span>
                            </div>
                            <button
                                onClick={() => onDeletePersonalTask(pt.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: '5px' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {personalTasks.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '13px', padding: '10px' }}>
                            Список порожній
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
