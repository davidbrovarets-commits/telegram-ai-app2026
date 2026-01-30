import { aiService } from "../services/ai/AIService";

/**
 * AI Document Analysis (via OpenAI gpt-4o-mini)
 */
export const analyzeDocument = async (imageUrl: string): Promise<string> => {
    try {
        // Direct delegation to AIService (GPT-4o-mini Vision)
        return await aiService.analyzeImage(imageUrl);
    } catch (error: any) {
        console.error('Vision API error:', error);
        throw new Error('Viga analüüsimisel: ' + (error.message || 'Tundmatu viga'));
    }
};
