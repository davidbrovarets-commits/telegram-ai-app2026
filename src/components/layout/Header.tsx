import type { UserData } from '../../types';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    userData: UserData;
    todayDate: string;
}

export const Header = ({ userData, todayDate }: HeaderProps) => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <header className="app-header">
            <div className="header-left">
                <div className="avatar-circle">
                    {userData.username?.charAt(0).toUpperCase()}
                </div>
                <div className="user-text">
                    <h3>{userData.username}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                            {userData.land}
                        </span>
                        <div className="lang-switcher" style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                            <button onClick={() => changeLanguage('uk')} style={{ fontSize: '10px', padding: '2px 4px' }}>🇺🇦</button>
                            <button onClick={() => changeLanguage('de')} style={{ fontSize: '10px', padding: '2px 4px' }}>🇩🇪</button>
                            <button onClick={() => changeLanguage('en')} style={{ fontSize: '10px', padding: '2px 4px' }}>🇬🇧</button>
                            <button onClick={() => changeLanguage('ru')} style={{ fontSize: '10px', padding: '2px 4px' }}>🇷🇺</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="date-display">{todayDate}</div>
        </header>
    );
};
