export const printCss = `
    @page {
        size: A4;
        margin-top: 35mm;
        margin-bottom: 35mm;
        margin-left: 25mm;
        margin-right: 25mm;
    }
    
    body {
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #000;
        background: #fff;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
    }

    .analysis-container {
        /* No fixed padding here to allow Puppeteer margin to work */
        width: 100%;
    }

    h1, h2, h3, h4 {
        color: #0057B8;
        page-break-after: avoid;
    }

    ul {
        padding-left: 20px;
    }

    li {
        margin-bottom: 5px;
    }

    /* Prevent breaking inside list items if possible */
    li, p {
        page-break-inside: avoid;
    }
    
    .original-document-img {
        page-break-before: always;
        max-width: 100%;
        height: auto;
        display: block;
        margin-top: 20px;
    }
`;
