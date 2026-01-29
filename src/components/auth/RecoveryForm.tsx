import { useState } from 'react';

interface RecoveryFormProps {
    onRecovery: (email: string) => Promise<{ error?: string }>;
    onSwitchToLogin: () => void;
}

export const RecoveryForm = ({ onRecovery, onSwitchToLogin }: RecoveryFormProps) => {
    const [email, setEmail] = useState('');

    const handleSubmit = async () => {
        const result = await onRecovery(email);
        if (result.error) {
            alert(result.error);
        } else {
            alert('Link saadetud!');
            onSwitchToLogin();
        }
    };

    return (
        <div className="auth-container">
            <h2 className="title">Відновлення</h2>

            <div className="input-group">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>

            <button className="primary-btn" onClick={handleSubmit}>
                Надіслати
            </button>

            <button className="link-btn" onClick={onSwitchToLogin}>
                Назад
            </button>
        </div>
    );
};
