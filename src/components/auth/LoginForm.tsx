import { useState } from 'react';

interface LoginFormProps {
    onLogin: (email: string, password: string) => Promise<{ error?: string }>;
    onSwitchToRegister: () => void;
    onSwitchToRecovery: () => void;
    loading: boolean;
}

export const LoginForm = ({ onLogin, onSwitchToRegister, onSwitchToRecovery, loading }: LoginFormProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        const result = await onLogin(email, password);
        if (result.error) {
            alert('Viga: ' + result.error);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="title">Вхід 🇩🇪</h2>

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

            <button
                className="primary-btn"
                onClick={handleSubmit}
                disabled={loading}
            >
                Увійти
            </button>

            <div className="auth-links">
                <button className="link-btn" onClick={onSwitchToRegister}>
                    Створити акаунт
                </button>
                <button className="link-btn" onClick={onSwitchToRecovery}>
                    Забули пароль?
                </button>
            </div>
        </div>
    );
};
