
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function runGrandTest() {
    console.log("🚀 STARTING GRAND VERIFICATION SUITE");
    console.log("==================================================");

    let l6Passed = false;
    let l7Passed = false;

    // --- TEST 1: L6 NEWS ORCHESTRATOR AI (Summary & Action Detection) ---
    console.log("\n🧪 TEST 1: L6 News Orchestrator (German -> Ukrainian + Actions)");
    try {
        const rawText = "Wichtig: Alle Flüchtlinge aus der Ukraine müssen ihren Aufenthaltstitel bis spätestens 31.03.2026 verlängern. Bitte reichen Sie die Unterlagen beim Amt ein.";
        console.log("   📝 Input:", rawText);

        // 1. Summarize & Detect Action
        const sumResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Summarize in German (2 sentences). Extract action items (deadlines) if any." },
                { role: "user", content: rawText }
            ]
        });
        const summary = sumResp.choices[0].message.content || "";
        console.log("   🇩🇪 Summary:", summary);

        // 2. Translate to Ukrainian
        const transResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Translate to Ukrainian. Official tone." },
                { role: "user", content: summary }
            ]
        });
        const translation = transResp.choices[0].message.content || "";
        console.log("   🇺🇦 Translation:", translation);

        // CRITERIA
        const hasDeadline = summary.includes("31.03.2026") || summary.includes("Verlängerung");
        const hasUA = /[а-яА-Яіїєґ]/.test(translation); // Check for Cyrillic

        if (hasDeadline && hasUA) {
            console.log("   ✅ L6 CRITERIA MET: Action detected & Translated");
            l6Passed = true;
        } else {
            console.error("   ❌ L6 FAILED: Missing deadline or bad translation");
        }

    } catch (e) {
        console.error("   ❌ L6 EXCEPTION:", e);
    }

    // --- TEST 2: L7 PERSONAL ASSISTANT (Context Awareness) ---
    console.log("\n🧪 TEST 2: L7 AI Assistant (Context Injection)");
    try {
        // Mock Context
        const userProfile = { name: "David", city: "Berlin", credits: 50 };
        const activeTasks = ["Register Address (Anmeldung)", "Find Health Insurance"];

        // Construct System Prompt (Same logic as AIService)
        const systemPrompt = `You are a helpful personal assistant for ${userProfile.name} living in ${userProfile.city}.
        CURRENT CONTEXT:
        - Credits: ${userProfile.credits} 💎
        - Active Tasks:
        ${activeTasks.map(t => `- ${t}`).join('\n')}
        
        GUIDELINE: Mention the user's name and their specific tasks. Answer in English for this test.`;

        const userQuestion = "What do I need to do next?";
        console.log("   👤 User:", userQuestion);

        const chatResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuestion }
            ]
        });

        const answer = chatResp.choices[0].message.content || "";
        console.log("   🤖 AI:", answer);

        // CRITERIA
        const knowsName = answer.includes("David");
        const knowsTask = answer.includes("Anmeldung") || answer.includes("Register") || answer.includes("Insurance");

        if (knowsName && knowsTask) {
            console.log("   ✅ L7 CRITERIA MET: AI knows User & Tasks");
            l7Passed = true;
        } else {
            console.error("   ❌ L7 FAILED: AI ignored context");
        }

    } catch (e) {
        console.error("   ❌ L7 EXCEPTION:", e);
    }

    console.log("\n==================================================");
    if (l6Passed && l7Passed) {
        console.log("🎉 GRAND VERIFICATION PASSED! ALL SYSTEMS GO.");
        process.exit(0);
    } else {
        console.log("⚠️ VERIFICATION COMPLETED WITH ERRORS.");
        process.exit(1);
    }
}

runGrandTest();
