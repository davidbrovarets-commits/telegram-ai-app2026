
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTelegramMessage } from './utils/telegram-notifier';

// -- CONFIG --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const INBOX_PATH = path.join(DATA_DIR, 'inbox.json');
const REMINDERS_PATH = path.join(DATA_DIR, 'reminders.json');
const STATE_PATH = path.join(DATA_DIR, 'state.json');
const PROJECT_KNOWLEDGE_PATH = path.join(__dirname, '..', '..', 'brain', '131f6a58-7079-474a-828f-6c1614bc6882', 'project_knowledge.md');
// Note: Brain path might vary in CI, fallbacks required if running in cloud without full checkout or different checkout path.
// Assuming cwd is root.

// -- TYPES --
interface InboxItem {
    id: string;
    created_at: string;
    raw_text: string;
    processed: boolean;
    processed_at?: string;
    result?: string;
}

interface Reminder {
    id: string;
    type: 'oneoff' | 'interval';
    text: string;
    created_at: string;
    enabled: boolean;
    next_run_at: string;
    interval_hours?: number;
    active_window?: { start: string; end: string };
    last_sent_at?: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
}

interface State {
    quiet_hours: { start: string; end: string };
    mute_until: string | null;
    last_run_at: string | null;
    last_sent_hashes: Record<string, string>;
    last_reminder_id: string | null;
}

// -- HELPERS --
function loadJSON<T>(filePath: string, defaultVal: T): T {
    if (!fs.existsSync(filePath)) return defaultVal;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
        return defaultVal;
    }
}

function saveJSON(filePath: string, data: any) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// -- LOGIC: TIME & SCHEDULE --
function parseTime(timeStr: string): Date {
    // HH:mm logic (today or tomorrow)
    const [hh, mm] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    if (target <= now) {
        target.setDate(target.getDate() + 1); // Tomorrow
    }
    return target;
}

function parseDateTime(dateStr: string): Date {
    return new Date(dateStr); // ISO or simple date
}

function isQuietTime(state: State): boolean {
    if (state.mute_until && new Date(state.mute_until) > new Date()) return true;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [sH, sM] = state.quiet_hours.start.split(':').map(Number);
    const [eH, eM] = state.quiet_hours.end.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    // Handle overnight range (23:00 - 07:30)
    if (startMins > endMins) {
        return currentMins >= startMins || currentMins < endMins;
    } else {
        return currentMins >= startMins && currentMins < endMins;
    }
}

// -- MAIN PROCESSOR --
async function runSecretary() {
    console.log('🎩 Secretary Engine Starting...');

    // Load Data
    const inbox = loadJSON<InboxItem[]>(INBOX_PATH, []);
    const reminders = loadJSON<Reminder[]>(REMINDERS_PATH, []);
    const state = loadJSON<State>(STATE_PATH, {
        quiet_hours: { start: '23:00', end: '07:30' },
        mute_until: null,
        last_run_at: null,
        last_sent_hashes: {},
        last_reminder_id: null,
        last_sent_hashes: {} // Fix typo in default
    } as any);

    const now = new Date();
    const nowIso = now.toISOString();

    // 1. PROCESS INBOX (COMMANDS)
    const unprocessed = inbox.filter(i => !i.processed);
    for (const item of unprocessed) {
        console.log(`Processing command: ${item.raw_text}`);
        let responseText = '';
        const text = item.raw_text.toLowerCase().trim();

        try {
            // A) One-off: "napomni 14:00 text"
            const oneOffMatch = text.match(/(?:napomni|напомни)\s+(?:(\d{4}-\d{2}-\d{2})\s+)?(\d{1,2}:\d{2})\s+(.+)/i);
            if (oneOffMatch) {
                const datePart = oneOffMatch[1];
                const timePart = oneOffMatch[2];
                const note = oneOffMatch[3];

                let targetDate: Date;
                if (datePart) {
                    targetDate = new Date(`${datePart}T${timePart}:00`);
                } else {
                    targetDate = parseTime(timePart);
                }

                const r: Reminder = {
                    id: generateId('r'),
                    type: 'oneoff',
                    text: note,
                    created_at: nowIso,
                    enabled: true,
                    next_run_at: targetDate.toISOString(),
                    priority: 'MEDIUM'
                };
                reminders.push(r);
                responseText = `✅ Записал: ${targetDate.toLocaleString('fi-FI')} — ${note} (#${r.id})`;
            }

            // B) Interval: "iga N tunni tagant text" / "каждые N часов text"
            else if (text.match(/(?:iga|каждые)\s+(\d+)\s+(?:tunni|часов|h)\s+(?:tagant\s+)?(.+)/i)) {
                const m = text.match(/(?:iga|каждые)\s+(\d+)\s+(?:tunni|часов|h)\s+(?:tagant\s+)?(.+)/i)!;
                const hours = parseInt(m[1]);
                const note = m[2];

                const r: Reminder = {
                    id: generateId('r'),
                    type: 'interval',
                    text: note,
                    created_at: nowIso,
                    enabled: true,
                    next_run_at: new Date(Date.now() + hours * 3600000).toISOString(),
                    interval_hours: hours,
                    active_window: { start: '08:00', end: '23:00' },
                    priority: 'MEDIUM'
                };
                reminders.push(r);
                responseText = `✅ Tsükkel: Iga ${hours}h — ${note} (#${r.id})`;
            }

            // C) Quiet Mode
            else if (text.includes('vaikne') || text.includes('тихий')) {
                // "vaikne reziim 23:00-07:30"
                const m = text.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
                if (m) {
                    state.quiet_hours = { start: m[1], end: m[2] };
                    responseText = `🔇 Vaikne aeg seatud: ${m[1]} - ${m[2]}`;
                }
            }
            else if (text.startsWith('paus') || text.startsWith('mute') || text.startsWith('пауза')) {
                // "paus 2h"
                const m = text.match(/(\d+)(?:h|t|ч)/);
                const hours = m ? parseInt(m[1]) : 1;
                const until = new Date(Date.now() + hours * 3600000);
                state.mute_until = until.toISOString();
                responseText = `🔇 Mute ${hours}h (kuni ${until.toLocaleTimeString()})`;
            }

            // D) List / Status
            else if (text === 'list' || text === 'spisok' || text === 'список') {
                const upcoming = reminders
                    .filter(r => r.enabled && new Date(r.next_run_at) > now)
                    .sort((a, b) => new Date(a.next_run_at).getTime() - new Date(b.next_run_at).getTime())
                    .slice(0, 10);

                responseText = "📅 **Tulevased:**\n" + upcoming.map(r =>
                    `• ${new Date(r.next_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${r.text} (#${r.id.slice(-4)})`
                ).join('\n');
            }
            else if (text === '/status') {
                responseText = `📊 **Status:**\nRun: ${now.toLocaleTimeString()}\nQuiet: ${state.quiet_hours.start}-${state.quiet_hours.end}\nMute: ${state.mute_until ? 'YES' : 'NO'}\nPending: ${reminders.filter(r => r.enabled).length}`;
            }
            else if (text === 'full') {
                // Read knowledge file
                if (fs.existsSync(PROJECT_KNOWLEDGE_PATH)) {
                    const knowledge = fs.readFileSync(PROJECT_KNOWLEDGE_PATH, 'utf-8');
                    const excerpt = knowledge.substring(0, 3500); // 4096 char limit
                    responseText = `📄 **Project Knowledge (Excerpt):**\n\n${excerpt}\n...(truncated)`;
                } else {
                    responseText = "⚠️ Knowledge file not found.";
                }
            }

            // E) Manage: Done/Review
            else if (text.startsWith('gotovo') || text.startsWith('tehtud') || text.startsWith('готово')) {
                // "gotovo #ID" or just "gotovo" (last reminder)
                let tid = state.last_reminder_id;
                const m = text.match(/#?([a-z0-9_]+)/); // rough match
                if (text.split(' ').length > 1 && m) tid = m[1]; // try to find ID in text if explicit
                // Actually, finding proper ID from partial text is hard without strict pattern.
                // Let's assume user types ID if not "gotovo".
                // Logic: if text has ID, use it. Else use last_reminder_id.

                // Fix: Parse ID from message correctly
                const words = text.split(' ');
                if (words.length > 1) {
                    // try to find matching ID in reminders
                    const searchId = words[1].replace('#', '');
                    const match = reminders.find(r => r.id.includes(searchId));
                    if (match) tid = match.id;
                }

                if (tid) {
                    const r = reminders.find(r => r.id === tid);
                    if (r) {
                        r.enabled = false; // Mark done
                        responseText = `✅ Märkisin tehtuks: ${r.text}`;
                    } else {
                        responseText = `❌ Ei leidnud id: ${tid}`;
                    }
                } else {
                    responseText = "❓ Milline ülesanne?";
                }
            }

            else if (text.startsWith('/start')) {
                responseText = `🤖 **David's Secretary**\n\nCommands:\n• napomni 14:00 [text]\n• iga 2h [text]\n• list\n• vaikne 23:00-08:00\n• paus 1h`;
            }

            else {
                // If not matched, maybe snooze? "pozzhe 30m"
                if (text.includes('pozzhe') || text.includes('hiljem') || text.includes('позже')) {
                    const m = text.match(/(\d+)(?:m|h|min|ч)/);
                    const amt = m ? parseInt(m[1]) : 30;
                    const unit = (text.includes('h') || text.includes('ч')) ? 60 : 1; // mins
                    const mins = amt * unit;

                    if (state.last_reminder_id) {
                        const r = reminders.find(r => r.id === state.last_reminder_id);
                        if (r) {
                            r.next_run_at = new Date(now.getTime() + mins * 60000).toISOString();
                            responseText = `💤 Lükkasin edasi ${mins}min: ${r.text}`;
                        }
                    }
                } else {
                    // Fallback
                    // Don't spam error on every mismatch, just ignore or log.
                    // But user expects feedback.
                    // responseText = "❓ Arusaamatu käsk."; 
                    // Better to be silent if unsure? No, explicit inbox.
                    responseText = "❓";
                    item.result = "Unknown command";
                }
            }

            // SEND CONFIRMATION
            if (responseText) {
                await sendTelegramMessage(responseText);
                item.result = responseText;
            } else {
                item.result = "No output";
            }

        } catch (e: any) {
            console.error(`Cmd Error: ${e.message}`);
            item.result = `Error: ${e.message}`;
            await sendTelegramMessage(`🛑 Error processing: ${item.raw_text}`);
        }

        item.processed = true;
        item.processed_at = nowIso;
    }

    // 2. CHECK REMINDERS
    const quiet = isQuietTime(state);

    for (const r of reminders) {
        if (!r.enabled) continue;
        const due = new Date(r.next_run_at) <= now;

        if (due) {
            // Check Quiet Mode (Skip unless CRITICAL)
            if (quiet && r.priority !== 'CRITICAL') {
                console.log(`Skipping quiet time reminder: ${r.text}`);
                continue;
            }

            // Send!
            console.log(`🔔 Sending Reminder: ${r.text}`);
            const msg = `⏰ **Napominanie:**\n${r.text}\n\n(Vasta: 'gotovo' või 'pozzhe 30m')`;
            const sent = await sendTelegramMessage(msg);

            if (sent) {
                r.last_sent_at = nowIso;
                state.last_reminder_id = r.id;

                if (r.type === 'oneoff') {
                    r.enabled = false; // Done
                } else if (r.type === 'interval' && r.interval_hours) {
                    // Schedule next
                    const next = new Date(now.getTime() + r.interval_hours * 3600000);
                    // Check active window?
                    // Implementation: If next falls outside, push to start of window?
                    // Simple: Just add interval. If silent time, it triggers next check.
                    r.next_run_at = next.toISOString();
                }
            }
        }
    }

    // 3. MORNING BRIEFING (Daily Logic)
    // Run only if hour is 08 AND we haven't run specifically for morning briefing today?
    // Or just check if "daily_report_sent" date != today.
    // Let's use last_run_at to guess, but safer to have specific state key.
    // For now, rely on Workflow Cron 08:00 to trigger SPECIFIC flag?
    // Or just check time window (08:00-08:59) and ensure only once.
    // State doesn't have "last_morning_briefing". Adding it dynamically. (JS flexible).

    // Check local time roughly. Environment is UTC?
    // GitHub Actions is UTC.
    // User wants 08:00 local (EST/EET is UTC+2/+3).
    // So UTC 06:00 is 08:00 EET.
    // Adjust logic: Just run if argument says "--briefing" OR check time.

    if (process.argv.includes('--morning') || (now.getUTCHours() === 6)) { // Approx 8am local
        const lastBriefKey = "last_briefing_date";
        const lastDate = (state as any)[lastBriefKey];
        const todayStr = nowIso.split('T')[0];

        if (lastDate !== todayStr) {
            console.log("☀️ Generating Morning Briefing...");

            // Get Knowledge Excerpt
            let excerpt = "No knowledge found.";
            if (fs.existsSync(PROJECT_KNOWLEDGE_PATH)) {
                const raw = fs.readFileSync(PROJECT_KNOWLEDGE_PATH, 'utf-8');
                // Smart excerpt: Find "Latest Changes" or just first 20 lines?
                // Let's take first 500 chars to verify it's working.
                excerpt = raw.substring(0, 500) + "...\n(Reply 'FULL' for more)";
            }

            const brief = `
🕗 **08:00 · Hommikune ülevaade**

☀️ Süsteem töötab.
📅 ${new Date().toLocaleDateString()}
✅ Aktiivseid meeldetuletusi: ${reminders.filter(r => r.enabled).length}

**Project Knowledge:**
${excerpt}
`.trim();

            await sendTelegramMessage(brief);
            (state as any)[lastBriefKey] = todayStr;
        }
    }

    // SAVE STATE
    state.last_run_at = nowIso;
    saveJSON(STATE_PATH, state);
    saveJSON(INBOX_PATH, inbox);
    saveJSON(REMINDERS_PATH, reminders);
    console.log('🎩 Done.');
}

runSecretary().catch(console.error);
