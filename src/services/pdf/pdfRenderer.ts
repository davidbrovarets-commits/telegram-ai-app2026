export const renderPdf = async (htmlContent: string): Promise<Blob> => {
    // Falls back to localhost for development if env var is missing
    const SERVICE_URL = import.meta.env.VITE_PDF_RENDER_URL || 'http://localhost:8080/render-pdf';

    const response = await fetch(SERVICE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html: htmlContent })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`PDF Render Failed: ${text}`);
    }

    return await response.blob();
};
