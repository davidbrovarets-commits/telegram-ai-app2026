import type { UserData } from '../../types';

interface HeaderProps {
    userData: UserData;
    todayDate: string;
}

export const Header = ({ userData, todayDate }: HeaderProps) => {
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
                    </div>
                </div>
            </div>
            <div className="date-display">{todayDate}</div>
        </header>
    );
};
