import puppeteer from 'puppeteer';

export const generatePdf = async (html: string): Promise<Buffer> => {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--font-render-hinting=none' // Better font rendering
        ],
        headless: true
    });

    const page = await browser.newPage();

    try {
        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },
            preferCSSPageSize: true
        });

        return pdfBuffer;

    } finally {
        await browser.close();
    }
};
