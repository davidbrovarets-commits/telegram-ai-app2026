
import { useState, useRef, useEffect } from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { ChatMessage, UserData, Task } from '../../types';
import { aiService } from '../../services/ai/AIService';
import { ContextBuilder } from '../../services/ai/ContextBuilder';

interface ChatViewProps {
    userData: UserData;
    activeTasks: Task[];
}

export const ChatView = ({ userData, activeTasks }: ChatViewProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Tere, ${userData.username}! 👋\nMa olen Sinu isiklik assistent.\nKuidas saan täna aidata?`,
            timestamp: new Date()
        }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string) => {
        // 1. Add User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            // 2. Build Context
            const context = ContextBuilder.build(userData, activeTasks, 'chat');

            // 3. Call AI Service
            // (Pass history excluding the just added message for purity, or include it? 
            // usually service needs full history)
            const responseText = await aiService.sendMessage([...messages, userMsg], context);

            // 4. Add AI Message
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat Error:", error);
            // Handle error (maybe show error bubble)
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border-color)',
                textAlign: 'center',
                fontWeight: 'bold'
            }}>
                🤖 Personaalne Assistent
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
                {messages.map(msg => (
                    <ChatBubble key={msg.id} message={msg} />
                ))}
                {loading && (
                    <div style={{ marginLeft: '20px', color: '#8E8E93', fontSize: '13px' }}>
                        Kirjutan...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput onSend={handleSend} disabled={loading} />
        </div>
    );
};
