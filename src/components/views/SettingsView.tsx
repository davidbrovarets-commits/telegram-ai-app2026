import { useState } from 'react';
import type { UserData, Theme } from '../../types';
import { GERMAN_STATES, RESIDENCE_PERMITS } from '../../utils/constants';
import {
    User, MapPin, Briefcase, Mail, Edit2, Check, X,
    Moon, Sun, Cloud, Lock, LogOut, ChevronRight, CreditCard, ChevronDown, ChevronUp
} from 'lucide-react';

interface SettingsViewProps {
    userData: UserData;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    onUpdateProfile: (data: Partial<UserData>) => Promise<{ error?: string }>;
    onUpdatePassword: (password: string) => Promise<{ error?: string }>;
    onAddCredits: (amount: number) => void;
    onLogout: () => void;
}

export const SettingsView = ({
    userData,
    theme,
    onThemeChange,
    onUpdateProfile,
    onUpdatePassword,
    onAddCredits,
    onLogout
}: SettingsViewProps) => {
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({
        username: userData.username,
        land: userData.land,
        residence_permit: userData.residence_permit
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

    const handleSaveProfile = async () => {
        const result = await onUpdateProfile(editForm);
        if (!result.error) {
            setIsEditingProfile(false);
            alert('Salvestatud!');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== newPasswordConfirm) {
            alert('Paroolid ei klapi!');
            return;
        }
        const result = await onUpdatePassword(newPassword);
        if (result.error) {
            alert(result.error);
        } else {
            alert('Parool muudetud!');
            setShowPasswordForm(false);
            setNewPassword('');
            setNewPasswordConfirm('');
        }
    };

    const SettingsRow = ({ icon: Icon, color, label, value, onClick, isAction }: any) => (
        <div className="info-row" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    background: color, width: '28px', height: '28px',
                    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white'
                }}>
                    <Icon size={16} />
                </div>
                <span className="info-label">{label}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="info-value">{value}</span>
                {isAction && <ChevronRight size={18} style={{ color: '#C7C7CC' }} />}
            </div>
        </div>
    );

    return (
        <div className="settings-view">
            <h1 className="welcome-text" style={{ marginBottom: '20px' }}>Налаштування</h1>

            <h4 className="section-title">Мій профіль</h4>
            <div className="settings-group">
                {!isEditingProfile ? (
                    <>
                        <SettingsRow icon={User} color="#0071E3" label="Ім'я" value={userData.username} />
                        <SettingsRow icon={MapPin} color="#34C759" label="Земля" value={userData.land} />
                        <SettingsRow icon={Briefcase} color="#FF9500" label="Статус" value={userData.residence_permit} />
                        <SettingsRow icon={Mail} color="#5856D6" label="Email" value={userData.email} />

                        <div className="info-row" onClick={() => setIsEditingProfile(true)} style={{ cursor: 'pointer', color: 'var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Edit2 size={18} />
                                <span style={{ fontWeight: 500 }}>Редагувати профіль</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '20px' }}>
                        <div className="input-group">
                            <label className="info-label" style={{ marginBottom: '8px', display: 'block' }}>Ім'я</label>
                            <input
                                type="text"
                                value={editForm.username}
                                onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label className="info-label" style={{ marginBottom: '8px', display: 'block' }}>Земля</label>
                            <select
                                value={editForm.land}
                                onChange={e => setEditForm({ ...editForm, land: e.target.value })}
                                className="select-input"
                            >
                                {GERMAN_STATES.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="info-label" style={{ marginBottom: '8px', display: 'block' }}>Статус</label>
                            <select
                                value={editForm.residence_permit}
                                onChange={e => setEditForm({ ...editForm, residence_permit: e.target.value })}
                                className="select-input"
                            >
                                <optgroup label="Захист">
                                    {RESIDENCE_PERMITS.protection.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Робота">
                                    {RESIDENCE_PERMITS.work.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className="primary-btn" onClick={handleSaveProfile} style={{ background: 'var(--success)', marginTop: 0 }}>
                                <Check size={18} style={{ marginRight: '5px' }} /> Зберегти
                            </button>
                            <button className="primary-btn" onClick={() => setIsEditingProfile(false)} style={{ background: 'var(--text-tertiary)', marginTop: 0 }}>
                                <X size={18} style={{ marginRight: '5px' }} /> Скасувати
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <h4 className="section-title">Вигляд</h4>
            <div className="settings-group" style={{ padding: '16px' }}>
                <div className="theme-switcher">
                    <button className={theme === 'light' ? 'active' : ''} onClick={() => onThemeChange('light')}>
                        <Sun size={16} style={{ marginBottom: '-2px' }} /> Світла
                    </button>
                    <button className={theme === 'neutral' ? 'active' : ''} onClick={() => onThemeChange('neutral')}>
                        <Cloud size={16} /> М'яка
                    </button>
                    <button className={theme === 'dark' ? 'active' : ''} onClick={() => onThemeChange('dark')}>
                        <Moon size={16} /> Темна
                    </button>
                </div>
            </div>

            <h4 className="section-title">Баланс</h4>
            <div className="settings-group">
                <SettingsRow
                    icon={CreditCard}
                    color="#FF2D55"
                    label="Рахунок"
                    value={`${userData.credits} 💎`}
                    isAction={true}
                    onClick={() => onAddCredits(10)}
                />
            </div>

            <h4 className="section-title">Безпека</h4>
            <div className="settings-group">
                <div className="info-row" onClick={() => setShowPasswordForm(!showPasswordForm)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: '#8E8E93', width: '28px', height: '28px',
                            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                        }}>
                            <Lock size={16} />
                        </div>
                        <span className="info-label">Змінити пароль</span>
                    </div>
                    {showPasswordForm ? <ChevronUp size={20} color="#C7C7CC" /> : <ChevronDown size={20} color="#C7C7CC" />}
                </div>

                {showPasswordForm && (
                    <div style={{ padding: '20px', borderTop: '1px solid var(--divider)' }}>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Новий пароль"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Ще раз"
                                value={newPasswordConfirm}
                                onChange={e => setNewPasswordConfirm(e.target.value)}
                            />
                        </div>
                        <button className="primary-btn" onClick={handleChangePassword} style={{ marginTop: '10px' }}>Зберегти</button>
                    </div>
                )}
            </div>

            <button className="primary-btn" onClick={onLogout} style={{ background: 'var(--bg-color)', color: '#FF3B30', border: '1px solid #FF3B30', marginTop: '20px' }}>
                <LogOut size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                Вийти з акаунту
            </button>
        </div>
    );
};
