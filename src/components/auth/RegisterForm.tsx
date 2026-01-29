import { useState } from 'react';
import { GERMAN_STATES, RESIDENCE_PERMITS } from '../../utils/constants';

interface RegisterFormProps {
    onRegister: (email: string, password: string, username: string, land: string, residencePermit: string, city: string) => Promise<{ error?: string }>;
    onSwitchToLogin: () => void;
    loading: boolean;
}

export const RegisterForm = ({ onRegister, onSwitchToLogin, loading }: RegisterFormProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [land, setLand] = useState('');
    const [city, setCity] = useState('');
    const [residencePermit, setResidencePermit] = useState('');

    const handleSubmit = async () => {
        const result = await onRegister(email, password, username, land, residencePermit, city);
        if (result.error) {
            alert('Viga: ' + result.error);
        } else {
            alert('Konto loodud!');
        }
    };

    return (
        <div className="auth-container">
            <h2 className="title">Реєстрація</h2>

            <div className="input-group">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>

            <div className="input-group">
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>

            <div className="input-group">
                <input
                    type="text"
                    placeholder="Ваше Ім'я"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
            </div>

            <div className="input-group">
                <select
                    value={land}
                    onChange={e => setLand(e.target.value)}
                    className="select-input"
                >
                    <option value="">Оберіть землю...</option>
                    {GERMAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
            </div>

            <div className="input-group">
                <input
                    type="text"
                    placeholder="Ваше місто/село"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                />
            </div>

            <div className="input-group">
                <select
                    value={residencePermit}
                    onChange={e => setResidencePermit(e.target.value)}
                    className="select-input"
                >
                    <option value="">Статус...</option>
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
                    <optgroup label="Інше">
                        {RESIDENCE_PERMITS.other.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </optgroup>
                </select>
            </div>

            <button
                className="primary-btn"
                onClick={handleSubmit}
                disabled={loading}
            >
                Зареєструватися
            </button>

            <button className="link-btn" onClick={onSwitchToLogin}>
                Вхід
            </button>
        </div>
    );
};
