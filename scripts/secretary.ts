
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTelegramMessage } from './utils/telegram-notifier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function runSecretary() {
    console.log('🎩 Secretary is waking up...');

    // 1. Read Architectural Suggestions
    const suggestionsPath = path.join(ROOT_DIR, 'docs', 'architectural_suggestions.md');
    let content = "No new suggestions today.";

    if (fs.existsSync(suggestionsPath)) {
        const fullContent = fs.readFileSync(suggestionsPath, 'utf-8');
        // Get the last critique (assuming appended)
        const parts = fullContent.split('## Critique');
        if (parts.length > 1) {
            content = "## Critique" + parts[parts.length - 1]; // Take last entry
        }
    }

    // 2. Format Message
    const morningBriefing = `
☕ *Tere hommikust, David!*
Kell on 08:00.

📄 **Öine Arhitekti Raport:**
${content.substring(0, 3000)} ${content.length > 3000 ? '...(truncated)' : ''}

Palun vaata täispikka raportit repositooriumis: \`docs/architectural_suggestions.md\`

Kas soovid, et ma lisan midagi "Project Knowledge" faili?
`;

    // 3. Send
    console.log('📨 Sending Briefing...');
    const success = await sendTelegramMessage(morningBriefing);

    if (success) {
        console.log('✅ Briefing sent to Telegram.');
    } else {
        console.error('❌ Failed to send briefing.');
        process.exit(1);
    }
}

runSecretary().catch(console.error);
