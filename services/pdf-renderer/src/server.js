const express = require('express');
const cors = require('cors');
const { generatePdf } = require('./pdf');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));

app.use(express.json({ limit: '10mb' }));

app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

app.post('/render-pdf', async (req, res) => {
    try {
        const { html } = req.body;

        if (!html) {
            return res.status(400).send('Missing html');
        }

        const pdfBuffer = await generatePdf(html);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`PDF Renderer listening on port ${PORT}`);
});
