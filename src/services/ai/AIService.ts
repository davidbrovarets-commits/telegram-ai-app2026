import { getVertexAI, getGenerativeModel, GenerativeModel } from "firebase/vertexai-preview";
import { app } from "../../firebaseConfig";
import type { ChatMessage, AIContext } from '../../types';

export interface AIServiceConfig {
    // Legacy apiKey support not strictly needed for Vertex AI via Firebase, 
    // but keeping config interface structure for compatibility if needed.
    model?: string;
}

export class AIService {
    private modelIdentifier: string;
    private genModel: GenerativeModel | null = null;

    constructor(config: AIServiceConfig = {}) {
        // Use the user-requested model or fallback
        this.modelIdentifier = config.model || 'gemini-3-pro-preview';

        try {
            // Initialize Vertex AI service
            const vertexAI = getVertexAI(app);

            // Initialize the generative model
            this.genModel = getGenerativeModel(vertexAI, {
                model: this.modelIdentifier,
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            });
        } catch (e) {
            console.error("Failed to initialize Vertex AI:", e);
        }
    }

    /**
     * Sends a message to the AI and returns the response.
     */
    async sendMessage(
        history: ChatMessage[],
        context: AIContext,
        _onStream?: (chunk: string) => void
    ): Promise<string> {

        console.log("🤖 AI Service (Vertex): Sending message...", { context, lastUserMessage: history[history.length - 1] });

        if (!this.genModel) {
            return "Viga: Google Vertex AI ei ole initsialiseeritud. Kontrolli Firebase seadistust.";
        }

        try {
            const systemPrompt = this.createSystemPrompt(context);

            // Vertex AI via Firebase uses 'startChat' or 'generateContent'.
            // For history, startChat is best.
            // Convert our simplified ChatMessage[] to Vertex AI Content format if needed,
            // or just use the history directly if the SDK supports 'role: user|model'.
            // Note: OpenAI uses 'assistant', Gemini uses 'model'.

            const vertexHistory = history.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

            // The last message is the new user prompt
            const lastMsg = history[history.length - 1];
            const prompt = lastMsg.content;

            const chat = this.genModel.startChat({
                history: [
                    { role: 'user', parts: [{ text: `SYSTEM INSTRUCTION:\n${systemPrompt}` }] },
                    { role: 'model', parts: [{ text: "Arusaadav. Olen valmis aitama." }] },
                    ...vertexHistory
                ]
            });

            const result = await chat.sendMessage(prompt);
            const response = result.response;
            const text = response.text();

            return text || "Vabandust, tühi vastus.";

        } catch (error: any) {
            console.error("Vertex AI Error:", error);
            // Fallback mock if completely failed?
            if (error.message?.includes("403") || error.message?.includes("API key")) {
                return "Viga: Ligipääs keelatud. Kontrolli Firebase/Google Cloud õigusi.";
            }
            return `Vabandust, tekkis viga: ${error.message}`;
        }
    }

    /**
     * Analyzes an image (document) using Gemini Vision capabilities.
     * @param imageUrl Public URL or Base64 data of the image
     */
    async analyzeImage(imageUrl: string): Promise<string> {
        if (!this.genModel) {
            return "Viga: Vertex AI ei tööta.";
        }

        try {
            console.log("👁️ AI Vision: Analyzing image...");

            // For images, we can use the same model (gemini-pro/1.5/3 are multimodal).
            // Fetch the image to get base64 if it's a URL, or expect base64.
            // The SDK often handles base64.

            // Simple approach: Assume imageUrl is base64 data URI?
            // If it's a URL, we might need to fetch it first.
            // Let's implement a quick fetcher if it's http.

            let inlineData;
            if (imageUrl.startsWith('data:')) {
                const base64 = imageUrl.split(',')[1];
                const mimeType = imageUrl.split(';')[0].split(':')[1];
                inlineData = { inlineData: { data: base64, mimeType } };
            } else {
                // Fetch URL
                // Note: CORS might be an issue for external URLs.
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

            const prompt = "Analyze this document image. Summarize key points (Dates, Amounts, Actions). Respond in Ukrainian.";

            const result = await this.genModel.generateContent([
                prompt,
                inlineData
            ]);

            return result.response.text();

        } catch (error: any) {
            console.error("AI Vision Error:", error);
            return "Vabandust, pildi analüüs ebaõnnestus.";
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

export const aiService = new AIService();
