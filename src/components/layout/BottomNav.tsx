
import type { TabType } from '../../types';
import { Home, CheckSquare, FolderOpen, Newspaper, Menu, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
    const { t } = useTranslation();

    const getIcon = (id: TabType, isActive: boolean) => {
        const props = {
            size: 24,
            strokeWidth: isActive ? 2.5 : 2, // Paksem joon aktiivsel ikoonil
            className: "nav-icon"
        };

        switch (id) {
            case 'home': return <Home {...props} />;
            case 'tasks': return <CheckSquare {...props} />;
            case 'portfolio': return <FolderOpen {...props} />;
            case 'news': return <Newspaper {...props} />;
            case 'menu': return <Menu {...props} />;
            case 'assistant': return <Bot {...props} />;
            default: return <Home {...props} />;
        }
    };

    const tabs: { id: TabType; label: string }[] = [
        { id: 'home', label: t('nav.home') },
        { id: 'tasks', label: t('nav.tasks') },
        { id: 'assistant', label: t('nav.assistant') },
        { id: 'portfolio', label: t('nav.portfolio') },
        { id: 'news', label: t('nav.news') },
        { id: 'menu', label: t('nav.menu') },
    ];

    return (
        <nav className="bottom-nav">
            {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        className={isActive ? 'active' : ''}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {getIcon(tab.id, isActive)}
                        <span className="nav-label">{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};
