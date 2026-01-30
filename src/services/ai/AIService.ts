import OpenAI from 'openai';
import type { ChatMessage, AIContext } from '../../types';

export interface AIServiceConfig {
    apiKey?: string;
    model?: string;
}

export class AIService {
    private client: OpenAI | null = null;
    private model: string;

    constructor(config: AIServiceConfig = {}) {
        const apiKey = config.apiKey || '';
        this.model = config.model || 'gpt-4o-mini';

        if (apiKey) {
            this.client = new OpenAI({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true // Client-side execution
            });
        }
    }

    /**
     * Sends a message to the AI and returns the response.
     * Uses OpenAI if API key is present, otherwise falls back to Mock.
     */
    async sendMessage(
        history: ChatMessage[],
        context: AIContext,
        _onStream?: (chunk: string) => void
    ): Promise<string> {

        console.log("🤖 AI Service: Sending message...", { context, lastUserMessage: history[history.length - 1] });

        // 1. FALLBACK TO MOCK IF NO API KEY
        if (!this.client) {
            console.warn("⚠️ No API Key found. Using Mock response.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(`[MOCK GLOBAL] Tere, ${context.userProfile.name}! 👋\n\nMul puudub 'VITE_OPENAI_API_KEY'. Lisa see .env faili, et ma saaksin päriselt mõelda.\n\nSeni näen vaid, et sul on **${context.activeTasks.length}** aktiivset ülesannet.`);
                }, 1000);
            });
        }

        // 2. REAL OPENAI CALL
        try {
            const systemPrompt = this.createSystemPrompt(context);

            const messages = [
                { role: 'system' as const, content: systemPrompt },
                ...history.map(m => ({
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content
                }))
            ];

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: messages,
            });

            return completion.choices[0].message.content || "Vabandust, ma ei saanud vastust.";

        } catch (error) {
            console.error("OpenAI Error:", error);
            return "Vabandust, tekkis viga AI ühendusega. Palun kontrolli konsooli.";
        }
    }

    /**
     * Analyzes an image (document) using GPT-4o-mini Vision capabilities.
     * @param imageUrl Public URL or Base64 data of the image
     */
    async analyzeImage(imageUrl: string): Promise<string> {
        if (!this.client) {
            return "⚠️ [MOCK] Pildianalüüs nõuab toimivat OpenAI võtit (.env).";
        }

        try {
            console.log("👁️ AI Vision: Analyzing image...");
            const response = await this.client.chat.completions.create({
                model: this.model, // gpt-4o-mini supports vision
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze this document image. Summarize key points (Dates, Amounts, Actions). Respond in Ukrainian. FORMATTING RULES:\n- Do NOT use numbered lists for main sections (No '1.', '2.').\n- Use '## ' for Section Headers (e.g. '## Dates').\n- Use bullet points ('- ') for details.\n- Make headers bold." },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ],
                    },
                ],
            });

            return response.choices[0].message.content || "Viga: Tühi vastus.";
        } catch (error) {
            console.error("AI Vision Error:", error);
            return "Vabandust, pildi analüüs ebaõnnestus. Veendu, et fail on avalikult kättesaadav või korrektne.";
        }
    }

    private createSystemPrompt(context: AIContext): string {
        const tasks = context.activeTasks.map(t => `- [${t.title}] (${t.price} 💎)`).join('\n');

        return `You are a helpful personal assistant for ${context.userProfile.name} living in ${context.userProfile.city}.
        
        CURRENT CONTEXT:
        - Credits: ${context.userProfile.credits} 💎
        - Active Tasks (${context.activeTasks.length}):
        ${tasks}

        GUIDELINES:
        - Answer in the same language as the user (mostly Estonian).
        - Be concise, friendly, and helpful.
        - You have access to the user's tasks and portfolio data context.
        - Encourage completing tasks to earn gems.`;
    }
}

export const aiService = new AIService({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY
});
