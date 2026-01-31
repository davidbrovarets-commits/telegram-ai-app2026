
import dotenv from 'dotenv';
import path from 'path';

// Load env if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Your Personal ID or Admin Group

export interface AlertData {
    title: string;
    uk_summary: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    score: number;
    city?: string | null;
    land?: string | null;
    id?: number;
}

/**
 * Sends a raw text message to the configured Telegram Chat.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
    if (!BOT_TOKEN || !CHAT_ID) {
        console.warn('⚠️ Telegram Bot Token or Chat ID missing. Skipping notification.');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const body = {
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'Markdown'
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`❌ Telegram Send Failed: ${err}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error('❌ Telegram Network Error:', error);
        return false;
    }
}

/**
 * Formats and sends a News Alert (used by Scraper).
 */
export async function sendAlert(data: AlertData): Promise<void> {
    const icon = data.priority === 'HIGH' ? '🚨' : 'ℹ️';
    const loc = data.city ? `📍 ${data.city}` : data.land ? `📍 ${data.land}` : '🌍 National';

    const message = `
${icon} *Valid News Detected*
${loc} (Score: ${data.score})

*${data.title}*

${data.uk_summary.substring(0, 200)}...

[View in App](${process.env.APP_URL || 'http://localhost'})
`.trim();

    await sendTelegramMessage(message);
}
