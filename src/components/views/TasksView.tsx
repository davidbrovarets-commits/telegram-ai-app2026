import { useState } from 'react';
import type { Task } from '../../types';
import {
    MapPin, Wallet, FileText, Gem,
    ChevronDown, ChevronUp, ChevronRight,
    Check, Lock
} from 'lucide-react';

interface TasksViewProps {
    tasks: Task[];
    completedTasks: string[];
    unlockedTasks: string[];
    onTaskClick: (task: Task) => void;
    onToggleTask: (taskId: string) => void;
}

export const TasksView = ({
    tasks,
    completedTasks,
    unlockedTasks,
    onTaskClick,
    onToggleTask
}: TasksViewProps) => {
    const [expandedStep, setExpandedStep] = useState<number | null>(1);

    const getPointsText = (count: number) => {
        if (count === 1) return 'пункт';
        if (count > 1 && count < 5) return 'пункти';
        return 'пунктів';
    };

    const renderStepGroup = (stepNum: number, title: string, color: string, Icon: React.ElementType) => {
        const stepTasks = tasks.filter(t => t.step === stepNum);
        const finalTasks = stepNum === 0
            ? tasks.filter(t => t.category === 'premium')
            : stepTasks;
        const isOpen = expandedStep === stepNum;

        // Värvi muutujad
        const iconStyle = { color: color };
        const borderStyle = { borderLeft: `4px solid ${color}` };

        return (
            <div style={{ marginBottom: '16px' }} key={stepNum}>
                <div
                    className="task-card"
                    onClick={() => setExpandedStep(isOpen ? null : stepNum)}
                    style={{ ...borderStyle, marginBottom: isOpen ? '8px' : '0' }}
                >
                    <div style={{ padding: '8px', background: `${color}15`, borderRadius: '10px' }}>
                        <Icon size={24} style={iconStyle} strokeWidth={2.5} />
                    </div>

                    <div className="task-details">
                        <h4>{title}</h4>
                        <p>
                            {finalTasks.length} {getPointsText(finalTasks.length)}
                        </p>
                    </div>
                    <span className="arrow-icon">
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                </div>

                {isOpen && (
                    <div style={{ paddingLeft: '12px', animation: 'fadeIn 0.3s ease' }}>
                        {finalTasks.map(task => {
                            const isUnlocked = task.category === 'premium'
                                ? unlockedTasks.includes(task.id)
                                : true;
                            const isCompleted = completedTasks.includes(task.id);

                            return (
                                <div
                                    key={task.id}
                                    className={`task-card ${task.category === 'premium' && !isUnlocked ? 'premium' : ''}`}
                                    onClick={() => onTaskClick(task)}
                                    style={{ marginBottom: '10px', padding: '16px' }}
                                >
                                    <div
                                        className={`checkbox ${isCompleted ? 'checked' : (task.category === 'premium' && !isUnlocked ? 'locked' : '')}`}
                                        onClick={(e) => {
                                            if (task.category === 'premium' && !isUnlocked) return;
                                            e.stopPropagation();
                                            onToggleTask(task.id);
                                        }}
                                    >
                                        {isCompleted && <Check size={16} strokeWidth={3} />}
                                        {task.category === 'premium' && !isUnlocked && <Lock size={14} />}
                                    </div>

                                    <div className="task-details">
                                        <h4>{task.title}</h4>
                                        <p>{task.description}</p>
                                    </div>

                                    {task.category === 'premium' && !isUnlocked && (
                                        <span className="price-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Gem size={12} /> {task.price}
                                        </span>
                                    )}
                                    <span className="arrow-icon">
                                        <ChevronRight size={20} />
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="task-list-container">
            <div className="task-card" style={{ justifyContent: 'center', marginBottom: '20px', background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)', color: 'white' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>🏛️ Дорожня карта: Життя в Німеччині 🇩🇪</h4>
            </div>
            {renderStepGroup(1, 'ЕТАП 1: ОСНОВА', '#FF3B30', MapPin)}   {/* Apple Red */}
            {renderStepGroup(2, 'ЕТАП 2: ФІНАНСИ', '#FF9500', Wallet)}     {/* Apple Orange */}
            {renderStepGroup(3, 'ЕТАП 3: СТАТУС', '#34C759', FileText)}    {/* Apple Green */}
            {renderStepGroup(0, 'ЕКСТРА (PREMIUM)', '#0071E3', Gem)}       {/* Apple Blue */}
        </div>
    );
};
