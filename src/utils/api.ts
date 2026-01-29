import { HfInference } from "@huggingface/inference";

/**
 * Hugging Face API kutse dokumentide analüüsimiseks
 */
export const analyzeDocument = async (imageUrl: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

    if (!apiKey) {
        throw new Error('Hugging Face API võti puudub. Lisa VITE_HUGGINGFACE_API_KEY .env faili.');
    }

    const hf = new HfInference(apiKey);

    try {
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();

        // 1. Proovime Document QA mudelit (see on kõige stabiilsem dokumentide jaoks)
        try {
            const response = await hf.documentQuestionAnswering({
                model: "impira/layoutlm-document-qa",
                data: imageBlob,
                inputs: {
                    question: "Summarize this document and what to do provided in the document?",
                    image: imageBlob
                }
            });

            // Tõlgime vastuse ja vormindame
            return `📄 **Dokumendi analüüs:**\n\n${response.answer}\n\n⚠️ NB: See on lühike kokkuvõte.`;

        } catch (qaError) {
            // Fallback: Proovime Image Captioning mudelit kui QA ebaõnnestub
            const captionResponse = await hf.imageToText({
                data: imageBlob,
                model: "Salesforce/blip-image-captioning-large",
            });
            return `📄 **Pildi sisu:** ${captionResponse.generated_text}\n\n(Detailsem analüüs pole hetkel saadaval)`;
        }

    } catch (error: any) {
        console.error('HF API error:', error);
        throw new Error('Viga analüüsimisel: ' + (error.message || 'Tundmatu viga'));
    }
};
