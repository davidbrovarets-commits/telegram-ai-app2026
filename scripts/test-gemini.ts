import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_FIREBASE_API_KEY;
console.log('API Key exists:', !!API_KEY, 'length:', API_KEY?.length);

const genAI = new GoogleGenerativeAI(API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

async function test() {
    try {
        console.log('Calling Gemini...');
        const result = await model.generateContent('Sage "Tere" eesti keeles. Vastus max 5 sõna.');
        console.log('✅ Response:', result.response.text());
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
}
test();
