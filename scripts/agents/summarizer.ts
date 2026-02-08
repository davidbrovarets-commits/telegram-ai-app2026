/**
 * Agent 5 & 6: Summarizer + Translator
 * Purpose: Generate German summary and translate to Ukrainian using Vertex AI Gemini
 * 
 * Uses direct REST API with Bearer token (same pattern as weekly_news_banner_job.ts)
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'claude-vertex-prod';
const LOCATION = 'us-central1';
const MODEL = 'gemini-2.5-pro';

// Get access token (same logic as weekly_news_banner_job.ts)
async function getAccessToken(): Promise<string | undefined> {
    // Priority 1: From env
    if (process.env.GOOGLE_ACCESS_TOKEN) {
        return process.env.GOOGLE_ACCESS_TOKEN;
    }

    // Priority 2: gcloud CLI
    try {
        const gcloudCmd = process.platform === 'win32'
            ? '"C:\\Users\\David\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd" auth print-access-token'
            : 'gcloud auth print-access-token';

        const token = execSync(gcloudCmd, { encoding: 'utf-8', shell: 'powershell.exe' }).trim();
        if (token && token.length > 20) {
            return token;
        }
    } catch (e) {
        console.warn('[Summarizer] gcloud CLI token failed');
    }

    // Priority 3: GoogleAuth
    try {
        const { GoogleAuth } = await import('google-auth-library');
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const { token } = await client.getAccessToken();
        if (token) return token;
    } catch (e) {
        console.warn('[Summarizer] GoogleAuth failed');
    }

    return undefined;
}

export interface SummaryResult {
    de_summary: string;
    uk_summary: string;
    uk_content: string;
    action_hint?: string;
    model_used: string;
    cost_estimate: number;
}

export async function summarizeAndTranslate(article: {
    title: string;
    content: string;
}): Promise<SummaryResult> {
    const accessToken = await getAccessToken();

    if (!accessToken) {
        console.error('[Summarizer] No access token available');
        return { de_summary: '', uk_summary: '', uk_content: '', model_used: 'error', cost_estimate: 0 };
    }

    const prompt = `Du bist ein Nachrichten-Assistent für ukrainische Migranten in Deutschland.

AUFGABE:
1. Fasse den Artikel in 2-3 Sätzen auf Deutsch zusammen (praktisch, neutral, klar)
2. Extrahiere wichtige Fristen oder erforderliche Aktionen (falls vorhanden)
3. Übersetze die Zusammenfassung ins Ukrainische.
   FORMAT for "uk_summary":
   Generiere eine sehr kurze Teaser-Zusammenfassung (Intro) auf Ukrainisch.
   STRIKTES LIMIT: Maximal 30 Wörter.
   Muss ein ganzer Satz sein, der mit einem Punkt endet.
   KEINE "..." am Ende.

   FORMAT for "uk_content":
   Eine detaillierte Zusammenfassung auf Ukrainisch (250-290 Wörter).
   Nutze logische Absätze und Aufzählungspunkte (•).
   Ton: Objektiv, journalistisch.

ARTIKEL:
Titel: ${article.title}
Inhalt: ${article.content.substring(0, 2000)}

ANTWORT im JSON-Format (NUR JSON):
{
  "de_summary": "Deutsche Zusammenfassung hier",
  "uk_summary": "Kurzer Teaser (max 30 Wörter)", 
  "uk_content": "Langer Inhalt (250-290 Wörter)...",
  "action_hint": "Frist oder Aktion (optional, null wenn keine)"
}`;

    // Vertex AI Gemini REST API endpoint (v1beta1 for better JSON support)
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.3,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Vertex AI Error: ${response.status} - ${errText.substring(0, 200)}`);
        }

        const result: any = await response.json();
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) throw new Error('No text in response');

        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[Summarizer] Debug - Raw content:', textContent);
            throw new Error('No JSON in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const inputTokens = prompt.length / 4;
        const outputTokens = textContent.length / 4;
        const cost_estimate = (inputTokens * 0.000000075) + (outputTokens * 0.0000003);

        return {
            de_summary: parsed.de_summary || '',
            uk_summary: parsed.uk_summary || '',
            uk_content: parsed.uk_content || '',
            action_hint: parsed.action_hint || null,
            model_used: MODEL,
            cost_estimate
        };
    } catch (error: any) {
        console.error('[Summarizer] Error:', error.message);
        return { de_summary: '', uk_summary: '', uk_content: '', model_used: 'error', cost_estimate: 0 };
    }
}

export async function summarizeAndTranslateMock(article: {
    title: string;
    content: string;
}): Promise<SummaryResult> {
    return {
        de_summary: `${article.title}. ${article.content.substring(0, 100)}...`,
        uk_summary: `[UK Teaser] ${article.title.substring(0, 20)}... (Max 30 words)`,
        uk_content: `[UK Content] ${article.content.substring(0, 500)}... (Long version with bullets)\n\n• Point 1\n• Point 2`,
        action_hint: undefined,
        model_used: 'mock',
        cost_estimate: 0
    };
}
