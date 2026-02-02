import express, { Request, Response } from 'express';
import cors from 'cors';
import { generatePdf } from './pdf';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));

app.use(express.json({ limit: '10mb' }));

app.get('/healthz', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

app.post('/render-pdf', async (req: Request, res: Response) => {
    try {
        const { html } = req.body;

        if (!html) {
            return res.status(400).send('Missing html');
        }

        const pdfBuffer = await generatePdf(html);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        res.status(500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`PDF Renderer listening on port ${PORT}`);
});
