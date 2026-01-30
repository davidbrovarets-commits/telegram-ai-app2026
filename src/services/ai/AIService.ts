
import { ChatMessage, AIContext, ChatRole } from '../../types';

export interface AIServiceConfig {
    apiKey?: string;
    model?: string;
}

export class AIService {
    private apiKey: string;
    private model: string;

    constructor(config: AIServiceConfig = {}) {
        this.apiKey = config.apiKey || '';
        this.model = config.model || 'gpt-4o-mini';
    }

    /**
     * Sends a message to the AI and returns the response.
     * Prepared for OpenAI API integration.
     */
    async sendMessage(
        history: ChatMessage[],
        context: AIContext,
        onStream?: (chunk: string) => void
    ): Promise<string> {

        // 1. Construct System Prompt
        // In real impl, we would append a System Message to the history
        // const systemPrompt = generateSystemPrompt(context); 

        console.log("🤖 AI Service: Sending message...", { context, lastUserMessage: history[history.length - 1] });

        // MOCK RESPONSE (Structural Prep)
        return new Promise((resolve) => {
            setTimeout(() => {
                const response = `[MOCK AI] Tere, ${context.userProfile.name}! 👋\n\nMa olen Sinu personaalne assistent. Ma näen, et Sul on **${context.activeTasks.length}** aktiivset ülesannet.\n\nKui lisad API võtme, saan ma sind päriselt aidata! 🚀`;
                resolve(response);
            }, 1000);
        });

        // TODO: UNCOMMENT FOR REAL API
        /*
        if (!this.apiKey) throw new Error("API Key missing");
        
        const messages = [
            { role: 'system', content: this.createSystemPrompt(context) },
            ...history.map(m => ({ role: m.role, content: m.content }))
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-5.2-fast", // Future model
            messages: messages,
            stream: true
        });
        */
    }

    private createSystemPrompt(context: AIContext): string {
        return `You are a personal assistant for ${context.userProfile.name} in ${context.userProfile.city}.`;
    }
}

export const aiService = new AIService({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY
});
