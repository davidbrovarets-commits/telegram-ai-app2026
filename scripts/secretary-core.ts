
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTelegramMessage } from './utils/telegram-notifier';
import { VertexAI } from '@google-cloud/vertexai';

// -- CONFIG --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data'); // Keep data in scripts/data/

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INBOX_PATH = path.join(DATA_DIR, 'inbox.json');
const REMINDERS_PATH = path.join(DATA_DIR, 'reminders.json');
const STATE_PATH = path.join(DATA_DIR, 'state.json');
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
const DOCS_DIR = path.join(DATA_DIR, 'documents');
const VOICE_DIR = path.join(DATA_DIR, 'voice');

// Ensure data dirs exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}
if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}
if (!fs.existsSync(VOICE_DIR)) {
    fs.mkdirSync(VOICE_DIR, { recursive: true });
}
const PROJECT_KNOWLEDGE_PATH = path.join(__dirname, '..', '..', 'brain', 'project_knowledge.md');

// -- TYPES --
export interface InboxItem {
    id: string;
    created_at: string;
    raw_text: string;
    processed: boolean;
    processed_at?: string;
    result?: string;
}

export interface Reminder {
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

export interface State {
    quiet_hours: { start: string; end: string };
    mute_until: string | null;
    last_run_at: string | null;
    last_sent_hashes: Record<string, string>;
    last_reminder_id: string | null;
    last_update_id?: number; // For polling Telegram
    last_briefing_date?: string;
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

// -- AI HELPER --
async function parseWithAI(userText: string, nowIso: string): Promise<any> {
    if (!process.env.GOOGLE_PROJECT_ID) return null;
    try {
        const vertexAI = new VertexAI({ project: process.env.GOOGLE_PROJECT_ID, location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1' });
        const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); // Vision-capable model

        const prompt = `
        Role: Personal Secretary Command Parser.
        Current Time: ${nowIso}
        User Input: "${userText}"
        
        Task: Map input to JSON.
        Allowed Types:
        - oneoff: { type: 'oneoff', time: 'ISO_TIMESTAMP_FUTURE', text: 'summary' } (Infer date/time relative to now)
        - interval: { type: 'interval', hours: NUMBER, text: 'summary' }
        - mute: { type: 'mute', hours: NUMBER }
        - quiet: { type: 'quiet', start: 'HH:mm', end: 'HH:mm' }
        - unknown: { type: 'unknown' }

        Rules:
        - If text is "shut up for 2h", type=mute, hours=2.
        - If text is "remind me to buy milk tomorrow", type=oneoff, time=tomorrow at 09:00 (default) or specified.
        - Return ONLY JSON. No markdown.
        `;

        const res = await model.generateContent(prompt);
        const jsonStr = res.response.candidates[0].content.parts[0].text;
        const cleanJson = jsonStr?.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson || '{}');
    } catch (e) {
        console.error('AI Parse failed:', e);
        return null;
    }
}

// -- MAIN ENGINE --
export async function runSecretaryCore(options: {
    durationMs: number,
    modeName: string,
    runMorningBriefing?: boolean
}) {
    console.log(`🎩 Secretary Core Starting... [${options.modeName}]`);

    // Load Data
    const inbox = loadJSON<InboxItem[]>(INBOX_PATH, []);
    const reminders = loadJSON<Reminder[]>(REMINDERS_PATH, []);
    const state = loadJSON<State>(STATE_PATH, {
        quiet_hours: { start: '23:00', end: '07:30' },
        mute_until: null,
        last_run_at: null,
        last_sent_hashes: {},
        last_reminder_id: null,
        last_update_id: 0
    } as any);

    const now = new Date();
    const nowIso = now.toISOString();

    // 0. POLL TELEGRAM
    // If durationMs is Infinity, we loop until process kill.
    // If durationMs is finite (e.g. 55000), we stop after that time.

    // We deduct 1000ms safety buffer if finite
    const endTime = options.durationMs === Infinity ? Infinity : Date.now() + options.durationMs - 1000;

    // Use a loop that checks both messages and reminders repeatedly?
    // The original cloud version polled messages for 55s, then processed reminders ONCE at the end?
    // No, wait. The original code:
    // 1. Poll loop (Date.now() < endTime) -> Collects messages, processes them, saves state.
    // 2. Process Inbox (Already done in loop? No, loop just pushed to inbox? No, loop pushed to inbox.)
    // 3. Process Inbox (loop over unprocessed).
    // 4. Check Reminders.
    // 5. Morning Briefing.

    // PROBLEM: For "Live" mode (Infinity), we can't do (Poll -> Process -> Check -> Exit).
    // We need (Poll & Check & Process) continuously.

    // NEW LOOP STRUCTURE for Core:
    console.log(`📨 Polling loop started (Duration: ${options.durationMs === Infinity ? 'Infinite' : options.durationMs + 'ms'})...`);

    // Polling interval for updates
    const POLL_INTERVAL = 2000;

    while (Date.now() < endTime) {
        const loopStart = Date.now();

        // A. POLL UPDATES (Telegram)
        let updates: any[] = [];
        const offset = (state.last_update_id || 0) + 1;

        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            if (token) {
                // Short timeout 5s for long polling
                const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=5`);
                const data = await res.json();
                if (data.ok) updates = data.result;
            }
        } catch (e) {
            console.error('Polling error:', e);
            // Don't crash, just wait
        }

        if (updates.length > 0) {
            console.log(`📥 Received ${updates.length} new messages.`);
            for (const u of updates) {
                state.last_update_id = u.update_id;
                const msg = u.message;
                if (!msg || String(msg.chat?.id) !== process.env.TELEGRAM_CHAT_ID) continue;

                let text = msg.text;
                let isVision = false;

                // Handle PHOTO (Vision)
                if (msg.photo) {
                    const fileId = msg.photo[msg.photo.length - 1].file_id;
                    const token = process.env.TELEGRAM_BOT_TOKEN;

                    try {
                        const fRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
                        const fData = await fRes.json();
                        if (fData.ok) {
                            const imgUrl = `https://api.telegram.org/file/bot${token}/${fData.result.file_path}`;
                            const imgBuf = await (await fetch(imgUrl)).arrayBuffer();
                            const base64Img = Buffer.from(imgBuf).toString('base64');

                            // SAVE IMAGE LOCALLY
                            const photoId = generateId('photo');
                            const photoFilename = `${photoId}.jpg`;
                            const photoPath = path.join(PHOTOS_DIR, photoFilename);
                            fs.writeFileSync(photoPath, Buffer.from(imgBuf));
                            console.log(`📸 Saved photo to: ${photoPath}`);

                            await sendTelegramMessage("👁️ Pilt salvestatud. Analüüsin...");
                            const vertexAI = new VertexAI({ project: process.env.GOOGLE_PROJECT_ID, location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1' });
                            const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

                            const req = {
                                contents: [{
                                    role: 'user',
                                    parts: [
                                        { text: "Analyze this image in detail. Describe everything you see: text, UI elements, objects, and context. If it is a screenshot, explain what is happening. Respond in Russian/Estonian as appropriate for the user." },
                                        { inlineData: { mimeType: 'image/jpeg', data: base64Img } }
                                    ]
                                }]
                            };

                            const res = await model.generateContent(req);
                            text = res.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
                            isVision = true;

                            await sendTelegramMessage(`👁️ **Pildi Analüüs:**\n${text}`);

                            inbox.push({
                                id: generateId('img'),
                                created_at: new Date().toISOString(),
                                raw_text: `[IMAGE_CONTEXT] ${text}`,
                                processed: false,
                                result: `Saved to ${photoFilename}`
                            });
                        }
                    } catch (err) {
                        console.error("Vision Error:", err);
                        await sendTelegramMessage("❌ Viga pildi analüüsimisel.");
                    }
                }

                // Handle DOCUMENT (PDF, etc.)
                if (msg.document) {
                    const doc = msg.document;
                    const fileId = doc.file_id;
                    const token = process.env.TELEGRAM_BOT_TOKEN;

                    try {
                        const fRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
                        const fData = await fRes.json();
                        if (fData.ok) {
                            const remotePath = fData.result.file_path;
                            const fileUrl = `https://api.telegram.org/file/bot${token}/${remotePath}`;
                            const fileBuf = await (await fetch(fileUrl)).arrayBuffer();

                            // Use original name or generated
                            const originalName = doc.file_name || `doc_${Date.now()}.pdf`;
                            const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
                            const savePath = path.join(DOCS_DIR, safeName);

                            fs.writeFileSync(savePath, Buffer.from(fileBuf));
                            console.log(`📄 Saved document to: ${savePath}`);
                            await sendTelegramMessage(`📄 Dokument salvestatud: ${safeName}\n🧠 Analüüsin sisu...`);

                            // AI ANALYSIS
                            const vertexAI = new VertexAI({ project: process.env.GOOGLE_PROJECT_ID, location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1' });
                            const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

                            const req = {
                                contents: [{
                                    role: 'user',
                                    parts: [
                                        { text: "Analyze this document. Summarize its content concisely and extract any action items, dates, or deadlines. Respond in Russian/Estonian as appropriate." },
                                        { inlineData: { mimeType: 'application/pdf', data: Buffer.from(fileBuf).toString('base64') } }
                                    ]
                                }]
                            };

                            const res = await model.generateContent(req);
                            const analysis = res.response.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.";

                            await sendTelegramMessage(`📄 **Analüüs:**\n${analysis}`);

                            inbox.push({
                                id: generateId('doc'),
                                created_at: new Date().toISOString(),
                                raw_text: `[DOCUMENT] ${safeName} - ${analysis}`,
                                processed: true,
                                result: `Saved & Analyzed: ${savePath}`
                            });
                        }
                    } catch (e) {
                        console.error("Doc Error:", e);
                        await sendTelegramMessage("❌ Viga dokumendi salvestamisel.");
                    }
                }

                // Handle VOICE
                if (msg.voice) {
                    const voice = msg.voice;
                    const fileId = voice.file_id;
                    const token = process.env.TELEGRAM_BOT_TOKEN;

                    try {
                        const fRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
                        const fData = await fRes.json();
                        if (fData.ok) {
                            const remotePath = fData.result.file_path; // usually voice/file_x.oga
                            const fileUrl = `https://api.telegram.org/file/bot${token}/${remotePath}`;
                            const fileBuf = await (await fetch(fileUrl)).arrayBuffer();

                            const filename = `voice_${Date.now()}.ogg`;
                            const savePath = path.join(VOICE_DIR, filename);

                            fs.writeFileSync(savePath, Buffer.from(fileBuf));
                            console.log(`mic Saved voice to: ${savePath}`);
                            await sendTelegramMessage(`🎤 Häälsõnum salvestatud: ${filename}\n🧠 Transkribeerin...`);

                            // AI TRANSCRIPTION
                            const vertexAI = new VertexAI({ project: process.env.GOOGLE_PROJECT_ID, location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1' });
                            const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

                            const req = {
                                contents: [{
                                    role: 'user',
                                    parts: [
                                        { text: "Transcribe this audio message exactly. Then, if it contains a task or request, summarize it briefly. Respond in the language of the audio." },
                                        { inlineData: { mimeType: 'audio/ogg', data: Buffer.from(fileBuf).toString('base64') } }
                                    ]
                                }]
                            };

                            const res = await model.generateContent(req);
                            const transcription = res.response.candidates?.[0]?.content?.parts?.[0]?.text || "No transcription.";

                            await sendTelegramMessage(`🎤 **Transkriptsioon:**\n${transcription}`);

                            inbox.push({
                                id: generateId('voice'),
                                created_at: new Date().toISOString(),
                                raw_text: `[VOICE] ${filename} - ${transcription}`,
                                processed: true,
                                result: `Saved & Transcribed: ${savePath}`
                            });
                        }
                    } catch (e) {
                        console.error("Voice Error:", e);
                        await sendTelegramMessage("❌ Viga häälsõnumi salvestamisel.");
                    }
                }

                if (text && !isVision) {
                    console.log(`User Input: ${text}`);
                    inbox.push({
                        id: generateId('cmd'),
                        created_at: new Date().toISOString(),
                        raw_text: text,
                        processed: false
                    });
                }
            }
            saveJSON(STATE_PATH, state);
        }

        // B. PROCESS INBOX (Immediate reaction)
        const unprocessed = inbox.filter(i => !i.processed);
        for (const item of unprocessed) {
            console.log(`Processing command: ${item.raw_text}`);
            let responseText = '';
            const text = item.raw_text.toLowerCase().trim();
            const processTimeIso = new Date().toISOString();

            try {
                // A) One-off: "napomni 14:00 text"
                const oneOffMatch = text.match(/(?:napomni|напомни)\s+(?:(\d{4}-\d{2}-\d{2})\s+)?(\d{1,2}:\d{2})\s+(.+)/i);

                // B) Interval: "iga N tunni tagant text"
                const intervalMatch = text.match(/(?:iga|каждые)\s+(\d+)\s+(?:tunni|часов|h)\s+(?:tagant\s+)?(.+)/i);

                // C) Quiet Mode
                const quietMatch = text.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);

                // D) Pause/Mute
                const muteStart = (text.startsWith('paus') || text.startsWith('mute') || text.startsWith('пауза'));

                // -- MATCHING LOGIC --
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
                        created_at: processTimeIso,
                        enabled: true,
                        next_run_at: targetDate.toISOString(),
                        priority: 'MEDIUM'
                    };
                    reminders.push(r);
                    responseText = `✅ Записал: ${targetDate.toLocaleString('fi-FI')} — ${note} (#${r.id})`;
                }
                else if (intervalMatch) {
                    const hours = parseInt(intervalMatch[1]);
                    const note = intervalMatch[2];

                    const r: Reminder = {
                        id: generateId('r'),
                        type: 'interval',
                        text: note,
                        created_at: processTimeIso,
                        enabled: true,
                        next_run_at: new Date(Date.now() + hours * 3600000).toISOString(),
                        interval_hours: hours,
                        active_window: { start: '08:00', end: '23:00' },
                        priority: 'MEDIUM'
                    };
                    reminders.push(r);
                    responseText = `✅ Tsükkel: Iga ${hours}h — ${note} (#${r.id})`;
                }
                else if ((text.includes('vaikne') || text.includes('тихий')) && quietMatch) {
                    state.quiet_hours = { start: quietMatch[1], end: quietMatch[2] };
                    responseText = `🔇 Vaikne aeg seatud: ${quietMatch[1]} - ${quietMatch[2]}`;
                }
                else if (muteStart) {
                    const m = text.match(/(\d+)(?:h|t|ч)/);
                    const hours = m ? parseInt(m[1]) : 1;
                    const until = new Date(Date.now() + hours * 3600000);
                    state.mute_until = until.toISOString();
                    responseText = `🔇 Mute ${hours}h (kuni ${until.toLocaleTimeString()})`;
                }
                else if (text === 'list' || text === 'spisok' || text === 'список') {
                    const upcoming = reminders
                        .filter(r => r.enabled && new Date(r.next_run_at) > new Date())
                        .sort((a, b) => new Date(a.next_run_at).getTime() - new Date(b.next_run_at).getTime())
                        .slice(0, 10);

                    responseText = "📅 **Tulevased:**\n" + upcoming.map(r =>
                        `• ${new Date(r.next_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${r.text} (#${r.id.slice(-4)})`
                    ).join('\n');
                }
                else if (text === '/status') {
                    const n = new Date();
                    responseText = `📊 **Status:**\nRun: ${n.toLocaleTimeString()}\nQuiet: ${state.quiet_hours.start}-${state.quiet_hours.end}\nMute: ${state.mute_until ? 'YES' : 'NO'}\nPending: ${reminders.filter(r => r.enabled).length}`;
                }
                else if (text === 'full') {
                    if (fs.existsSync(PROJECT_KNOWLEDGE_PATH)) {
                        const knowledge = fs.readFileSync(PROJECT_KNOWLEDGE_PATH, 'utf-8');
                        const excerpt = knowledge.substring(0, 3500);
                        responseText = `📄 **Project Knowledge (Excerpt):**\n\n${excerpt}\n...(truncated)`;
                    } else {
                        responseText = "⚠️ Knowledge file not found.";
                    }
                }
                else if (text.startsWith('gotovo') || text.startsWith('tehtud') || text.startsWith('готово')) {
                    let tid = state.last_reminder_id;
                    const words = text.split(' ');
                    if (words.length > 1) {
                        const searchId = words[1].replace('#', '');
                        const match = reminders.find(r => r.id.includes(searchId));
                        if (match) tid = match.id;
                    }
                    if (tid) {
                        const r = reminders.find(r => r.id === tid);
                        if (r) {
                            r.enabled = false;
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
                    // Snooze check or AI fallback
                    if (text.includes('pozzhe') || text.includes('hiljem') || text.includes('позже')) {
                        const m = text.match(/(\d+)(?:m|h|min|ч)/);
                        const amt = m ? parseInt(m[1]) : 30;
                        const unit = (text.includes('h') || text.includes('ч')) ? 60 : 1;
                        const mins = amt * unit;

                        if (state.last_reminder_id) {
                            const r = reminders.find(r => r.id === state.last_reminder_id);
                            if (r) {
                                r.next_run_at = new Date(Date.now() + mins * 60000).toISOString();
                                responseText = `💤 Lükkasin edasi ${mins}min: ${r.text}`;
                            }
                        }
                    } else {
                        // AI fallback
                        console.log('🤖 Regex failed. Asking Gemini...');
                        const aiCmd = await parseWithAI(text, processTimeIso);
                        if (aiCmd && aiCmd.type !== 'unknown') {
                            if (aiCmd.type === 'oneoff') {
                                const r: Reminder = {
                                    id: generateId('r'), type: 'oneoff', text: aiCmd.text,
                                    created_at: processTimeIso, enabled: true, next_run_at: aiCmd.time, priority: 'MEDIUM'
                                };
                                reminders.push(r);
                                responseText = `🧠 AI sai aru: ${r.text} (#${r.id.slice(-4)}) @ ${new Date(r.next_run_at).toLocaleTimeString()}`;
                            }
                            else if (aiCmd.type === 'interval') {
                                const r: Reminder = {
                                    id: generateId('r'), type: 'interval', text: aiCmd.text,
                                    created_at: processTimeIso, enabled: true, next_run_at: new Date(Date.now() + aiCmd.hours * 3600000).toISOString(),
                                    interval_hours: aiCmd.hours, active_window: { start: '08:00', end: '23:00' }, priority: 'MEDIUM'
                                };
                                reminders.push(r);
                                responseText = `🧠 AI Tsükkel: Iga ${aiCmd.hours}h — ${aiCmd.text}`;
                            }
                            else if (aiCmd.type === 'mute') {
                                const until = new Date(Date.now() + aiCmd.hours * 3600000);
                                state.mute_until = until.toISOString();
                                responseText = `🧠 AI Mute ${aiCmd.hours}h (kuni ${until.toLocaleTimeString()})`;
                            }
                        } else {
                            responseText = "❓";
                            item.result = "Unknown command";
                        }
                    }
                }

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
            item.processed_at = processTimeIso;

            // Save after each item to be safe
            saveJSON(INBOX_PATH, inbox);
            saveJSON(REMINDERS_PATH, reminders);
            saveJSON(STATE_PATH, state);
        }

        // C. CHECK REMINDERS
        const quiet = isQuietTime(state);
        const checkNow = new Date();

        for (const r of reminders) {
            if (!r.enabled) continue;
            const due = new Date(r.next_run_at) <= checkNow;

            if (due) {
                if (quiet && r.priority !== 'CRITICAL') {
                    // Silent time, but we don't spam logs
                    continue;
                }

                console.log(`🔔 Sending Reminder: ${r.text}`);
                const msg = `⏰ **Napominanie:**\n${r.text}\n\n(Vasta: 'gotovo' või 'pozzhe 30m')`;
                const sent = await sendTelegramMessage(msg);

                if (sent) {
                    r.last_sent_at = checkNow.toISOString();
                    state.last_reminder_id = r.id;

                    if (r.type === 'oneoff') {
                        r.enabled = false;
                    } else if (r.type === 'interval' && r.interval_hours) {
                        const next = new Date(checkNow.getTime() + r.interval_hours * 3600000);
                        r.next_run_at = next.toISOString();
                    }
                    saveJSON(REMINDERS_PATH, reminders);
                    saveJSON(STATE_PATH, state);
                }
            }
        }

        // D. MORNING BRIEFING
        // Only run if requested via flag OR if mode is Live and it's 8am local
        // Using checkNow
        if (options.runMorningBriefing || (checkNow.getHours() === 8 && checkNow.getMinutes() === 0)) { // simple check for 08:00
            // In live mode, this might trigger multiple times in the 8:00:00 minute if we are not careful.
            // Check state.
            const todayStr = checkNow.toISOString().split('T')[0];
            if (state.last_briefing_date !== todayStr) {
                console.log("☀️ Generating Morning Briefing...");
                // ... (Briefing Logic) ...
                let excerpt = "No knowledge found.";
                if (fs.existsSync(PROJECT_KNOWLEDGE_PATH)) {
                    const raw = fs.readFileSync(PROJECT_KNOWLEDGE_PATH, 'utf-8');
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
                state.last_briefing_date = todayStr;
                saveJSON(STATE_PATH, state);
            }
        }

        // WAIT before next loop
        // If updates found, we might want to loop faster? 
        // Constant 2s is fine for simple secretary.
        const duration = Date.now() - loopStart;
        const wait = Math.max(0, POLL_INTERVAL - duration);
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }

    console.log('🎩 Engine Stops.');
}
