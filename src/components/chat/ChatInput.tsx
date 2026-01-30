
import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (!text.trim() || disabled) return;
        onSend(text);
        setText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{
            padding: '10px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Küsi midagi..."
                disabled={disabled}
                style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '20px',
                    border: '1px solid var(--input-border)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    height: '44px',
                    fontFamily: 'inherit',
                    outline: 'none'
                }}
            />
            <button
                onClick={handleSend}
                disabled={!text.trim() || disabled}
                style={{
                    background: '#007AFF',
                    color: 'white',
                    border: 'none',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1
                }}
            >
                <Send size={20} />
            </button>
        </div>
    );
};
