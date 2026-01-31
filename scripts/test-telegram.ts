
import dotenv from 'dotenv';
import path from 'path';
import { sendTelegramMessage } from './utils/telegram-notifier';

// Explicitly load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runTest() {
    console.log('🧪 Testing Telegram Integration...');
    console.log('--------------------------------');

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;

    // Log masked verification
    if (token) console.log(`🔑 Token detected: ${token.substring(0, 5)}... (Length: ${token.length})`);
    else console.error('❌ MISSING: TELEGRAM_BOT_TOKEN in .env');

    if (chat) console.log(`🆔 Chat ID detected: ${chat}`);
    else console.error('❌ MISSING: TELEGRAM_CHAT_ID in .env');

    if (!token || !chat) {
        console.log('\n⚠️  NB! GitHub Secrets ei tööta kohalikus arvutis.');
        console.log('👉 Pead lisama need väärtused oma kohalikku `.env` faili testimiseks.');
        return;
    }

    console.log('\n📨 Sending "Hello World"...');
    const result = await sendTelegramMessage("👋 Hello! This is a test message from your Antigravity Assistant. 🧪");

    if (result) {
        console.log('✅ SUCCESS! Sõnum saadeti. Kontrolli telefoni. 📱');
    } else {
        console.log('❌ FAILURE. Vaata veateadet ülal ↑');
        console.log('   Tüüpilised vead:');
        console.log('   - 403 Forbidden: Sa unustasid vajutada "Start" nuppu oma boti vestluses.');
        console.log('   - 404 Not Found: Token on vale (kontrolli tühikuid).');
        console.log('   - 400 Bad Request: Chat ID on vale.');
    }
}

runTest();
