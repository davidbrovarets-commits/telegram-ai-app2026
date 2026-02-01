import { aiService } from "../services/ai/AIService";

/**
 * AI Document Analysis (via OpenAI gpt-4o-mini)
 */
export const analyzeDocument = async (imageUrl: string): Promise<string> => {
    try {
        // Direct delegation to AIService (GPT-4o-mini Vision)
        return await aiService.analyzeImage(imageUrl, "START DIRECTLY with the content. DO NOT use introductory phrases like 'Here is the analysis'. Format the title as: '# Dokument від [Organization Name]'. Language: Ukrainian. Highlight key details, dates, sums, and names.");
    } catch (error: any) {
        console.error('Vision API error:', error);
        throw new Error('Viga analüüsimisel: ' + (error.message || 'Tundmatu viga'));
    }
};
