
import { initializeApp } from "firebase/app";
import { getAI, VertexAIBackend, getGenerativeModel } from "firebase/ai";
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', { ...firebaseConfig, apiKey: '***' });

const app = initializeApp(firebaseConfig);

async function test() {
    try {
        console.log('Initializing Vertex AI...');
        const ai = getAI(app, {
            // "backend" is optional but AIService.ts uses it
            backend: new VertexAIBackend('us-central1')
        });

        const model = getGenerativeModel(ai, {
            model: 'gemini-2.5-pro'
        });

        console.log('Generating content...');
        const result = await model.generateContent('Say "Hello from Firebase Node"');
        console.log('Response:', result.response.text());

    } catch (e: any) {
        console.error('❌ Error:', e);
        // Sometimes it prints a JSON object
        if (e.customData) console.error('CustomData:', e.customData);
    }
}

test();
