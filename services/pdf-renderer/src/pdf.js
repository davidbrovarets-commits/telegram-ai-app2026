const puppeteer = require('puppeteer');

const generatePdf = async (html) => {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--font-render-hinting=none'
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
                top: '35mm',
                bottom: '35mm',
                left: '25mm',
                right: '25mm'
            },
            preferCSSPageSize: true
        });

        return pdfBuffer;

    } finally {
        await browser.close();
    }
};

module.exports = { generatePdf };
