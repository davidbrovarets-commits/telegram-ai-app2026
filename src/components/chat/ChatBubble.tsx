import type { ChatMessage } from '../../types';

interface ChatBubbleProps {
    message: ChatMessage;
}

export const ChatBubble = ({ message }: ChatBubbleProps) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) return null; // Don't show system prompts

    return (
        <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: '12px',
            padding: '0 10px'
        }}>
            <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '18px',
                borderBottomRightRadius: isUser ? '4px' : '18px',
                borderBottomLeftRadius: isUser ? '18px' : '4px',
                backgroundColor: isUser ? '#007AFF' : '#E9E9EB',
                color: isUser ? 'white' : 'black',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: '15px',
                lineHeight: '1.4'
            }}>
                {/* 
                   TODO: Add Markdown support here later 
                   For now, simple whitespace preservation 
                */}
                <div style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                </div>

                <div style={{
                    fontSize: '10px',
                    marginTop: '4px',
                    opacity: 0.7,
                    textAlign: 'right'
                }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};
