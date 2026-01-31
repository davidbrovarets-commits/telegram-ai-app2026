import { getAI, VertexAIBackend, getGenerativeModel, GenerativeModel } from "firebase/ai";
import { app } from "../../firebaseConfig";
import type { ChatMessage, AIContext } from '../../types';

export interface AIServiceConfig {
    model?: string;
}

export class AIService {
    private genModel: GenerativeModel | null = null;
    private initError: string | null = null;

    constructor(/* config: AIServiceConfig = {} */) {
        // modelIdentifier removed as it was unused and causing build error

        try {
            // Initialize Vertex AI service with new API (Firebase v12.8+)
            const ai = getAI(app, {
                backend: new VertexAIBackend('us-central1')
            });

            // Initialize the generative model
            // 1.5-flash retired in '25. Using 2.0-flash-exp for '26 context.
            this.genModel = getGenerativeModel(ai, {
                model: 'gemini-2.5-pro',
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            });
        } catch (e: any) {
            console.error("Failed to initialize Vertex AI:", e);
            this.initError = e.message || String(e);
        }
    }

    private createSystemPrompt(context: AIContext): string {
        const today = new Date().toISOString().split('T')[0];
        const tasks = context.activeTasks ? context.activeTasks.map(t => `- [${t.title}] (${t.price} 💎)`).join('\n') : "No active tasks.";
        const location = context.location || context.userProfile?.city || 'Unknown';

        return `
You are a helpful AI assistant for the 'Telegram AI App'.
IDENTITY: You are Gemini 2.5 Pro, a large language model trained by Google. You are NOT ChatGPT.
Current Date: ${today}
User Location: ${location}
User Context:
- Name: ${context.userProfile?.name || 'User'}
- Credits: ${context.userProfile?.credits || 0} 💎
- Tasks:
${tasks}

Goal: Be helpful, concise, and friendly. Answer in the same language as the user (default Estonian).
`;
    }

    async sendMessage(
        history: ChatMessage[],
        context: AIContext,
        _onStream?: (chunk: string) => void
    ): Promise<string> {

        console.log("🤖 AI Service (Vertex): Sending message...", { context, lastUserMessage: history[history.length - 1] });

        if (!this.genModel) {
            return `Viga: Google Vertex AI ei ole initsialiseeritud. \nDetailid: ${this.initError || 'Tundmatu viga'}`;
        }

        try {
            const systemPrompt = this.createSystemPrompt(context);

            const vertexHistory = history.slice(0, -1).map(m => ({
                role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
                parts: [{ text: m.content }]
            }));

            const lastMsg = history[history.length - 1];
            const prompt = lastMsg.content;

            // Construct history carefully to avoid "model follows model" error
            let chatHistory;

            if (vertexHistory.length > 0 && vertexHistory[0].role === 'model') {
                // If history starts with model (e.g. welcome message),
                // we precede it with the system prompt (User).
                chatHistory = [
                    { role: 'user' as const, parts: [{ text: `SYSTEM INSTRUCTION:\n${systemPrompt}` }] },
                    ...vertexHistory
                ];
            } else {
                // If history starts with user or is empty,
                // we add our own pair of [User, Model(Ack)].
                chatHistory = [
                    { role: 'user' as const, parts: [{ text: `SYSTEM INSTRUCTION:\n${systemPrompt}` }] },
                    { role: 'model' as const, parts: [{ text: "Arusaadav. Olen valmis aitama." }] },
                    ...vertexHistory
                ];
            }

            const chat = this.genModel.startChat({
                history: chatHistory
            });

            const result = await chat.sendMessage(prompt);
            const response = result.response;
            const text = response.text();

            return text || "Vabandust, tühi vastus.";

        } catch (error: any) {
            console.error("Vertex AI Error:", error);
            if (error.message?.includes("403") || error.message?.includes("API key")) {
                return "Viga: Ligipääs keelatud. Kontrolli Firebase/Google Cloud õigusi.";
            }
            return `Vabandust, tekkis viga: ${error.message}`;
        }
    }

    async analyzeImage(imageUrl: string, prompt: string = "Analyze this image"): Promise<string> {
        if (!this.genModel) return "AI Service not initialized";

        try {
            let inlineData;

            if (imageUrl.startsWith('data:')) {
                // Handle Base64 Data URI
                const base64 = imageUrl.split(',')[1];
                const mimeType = imageUrl.split(';')[0].split(':')[1];
                inlineData = { inlineData: { data: base64, mimeType } };
            } else {
                // Fetch URL and convert to base64
                // Note: CORS might block this in browser if not same-origin or allowed
                const resp = await fetch(imageUrl);
                const blob = await resp.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                const realBase64 = base64.split(',')[1];
                inlineData = { inlineData: { data: realBase64, mimeType: blob.type } };
            }

            const result = await this.genModel.generateContent([
                prompt,
                inlineData
            ]);
            return result.response.text();

        } catch (e: any) {
            console.error("AI Vision Error:", e);
            return "Viga pildi analüüsimisel: " + e.message;
        }
    }
}

export const aiService = new AIService();
