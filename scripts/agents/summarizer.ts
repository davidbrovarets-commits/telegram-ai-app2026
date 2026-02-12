/**
 * Agent 5 & 6: Summarizer + Translator
 * Purpose: Generate German summary and translate to Ukrainian using Vertex AI Gemini
 * 
 * Uses direct REST API with Bearer token (same pattern as weekly_news_banner_job.ts)
 */

import { vertexClient } from '../utils/vertex-client';
import dotenv from 'dotenv';

dotenv.config();

const MODEL = 'gemini-2.5-pro';

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

    try {
        // VertexClient handles auth, retries, and rate limiting
        const parsed = await vertexClient.generateJSON<any>(prompt, 0.3);

        return {
            de_summary: parsed.de_summary || '',
            uk_summary: parsed.uk_summary || '',
            uk_content: parsed.uk_content || '',
            action_hint: parsed.action_hint || null,
            model_used: MODEL,
            cost_estimate: 0
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
