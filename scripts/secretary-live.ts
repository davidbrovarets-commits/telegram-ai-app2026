
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

// FORCE OVERRIDE of system credentials for this process
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.join(__dirname, '..', 'claude-vertex-prod-firebase-adminsdk-fbsvc-1cbb42469e.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = KEY_PATH;
console.log(`🔑 Forced Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

import { runSecretaryCore } from './secretary-core';

// This is the Live version (Local)
// Runs forever until stopped
console.log("🚀 Starting Live Secretary (Turbo Mode)...");

if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ ERROR: TELEGRAM_BOT_TOKEN is missing in .env");
}
if (!process.env.GOOGLE_PROJECT_ID) {
    console.error("⚠️ WARNING: GOOGLE_PROJECT_ID is missing. AI features will fail.");
}

runSecretaryCore({
    durationMs: Infinity,
    modeName: 'Live/Local',
    runMorningBriefing: false // Live mode can handle briefing via time check
}).catch(e => {
    console.error("🔥 Fatal Error in Live Secretary:", e);
});
