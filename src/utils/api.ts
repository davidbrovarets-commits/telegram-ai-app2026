import { aiService } from "../services/ai/AIService";
import { analyzeDocumentStructured, type DocumentAnalysisResult } from "../services/ai/document-analysis";
import { MODEL_CONFIG } from "../services/ai/model-config";
import { invokeWithFallback, routeForTask } from '../services/ai/model-router';

/**
 * AI Document Analysis
 *
 * When MODEL_ROUTER_ENABLED=true:
 *   Uses two-step pipeline (UNDERSTAND_DOC → DECIDE_ACTIONS) with structured JSON output.
 *
 * When MODEL_ROUTER_ENABLED=false (default):
 *   Falls back to legacy free-text analysis via AIService.analyzeImage().
 */
export const analyzeDocument = async (imageUrl: string): Promise<string> => {
    try {
        if (MODEL_CONFIG.ROUTER_ENABLED) {
            // --- New structured pipeline ---
            const result: DocumentAnalysisResult = await analyzeDocumentStructured(imageUrl);

            console.log('[DocAnalysis] model_trace:', result.model_trace);

            // Format structured result as readable markdown for UI
            return formatStructuredResult(result);
        }

        // --- Legacy: Direct delegation to AIService (free-text) ---
        return await aiService.analyzeImage(
            imageUrl,
            "START DIRECTLY with the content. DO NOT use introductory phrases like 'Here is the analysis'. Format the title as: '# Dokument від [Organization Name]'. Language: Ukrainian. Highlight key details, dates, sums, and names."
        );
    } catch (error: any) {
        console.error('Vision API error:', error);
        throw new Error('Viga analüüsimisel: ' + (error.message || 'Tundmatu viga'));
    }
};

/**
 * Export structured analysis directly (for future UI integration).
 */
export const analyzeDocumentJSON = async (imageUrl: string): Promise<DocumentAnalysisResult> => {
    return analyzeDocumentStructured(imageUrl);
};

/**
 * Format structured analysis result as readable markdown.
 */
function formatStructuredResult(r: DocumentAnalysisResult): string {
    const lines: string[] = [];

    // Header
    const typeLabels: Record<string, string> = {
        jobcenter: 'Jobcenter',
        auslaenderbehoerde: 'Ausländerbehörde',
        court: 'Суд / Gericht',
        other: 'Документ',
    };
    lines.push(`# ${typeLabels[r.doc_type] || 'Документ'}`);
    lines.push('');
    lines.push(r.summary);
    lines.push('');

    // Deadlines (most urgent first)
    if (r.key_entities.deadlines.length > 0) {
        lines.push('## ⏰ Терміни');
        for (const d of r.key_entities.deadlines) {
            const icon = d.risk === 'high' ? '🔴' : d.risk === 'medium' ? '🟡' : '🟢';
            lines.push(`- ${icon} **${d.date}** — ${d.context}`);
        }
        lines.push('');
    }

    // Actions
    if (r.required_actions.length > 0) {
        lines.push('## 📋 Дії');
        for (const a of r.required_actions) {
            const pIcon = a.priority === 'P0' ? '🚨' : a.priority === 'P1' ? '⚠️' : 'ℹ️';
            lines.push(`- ${pIcon} **[${a.priority}]** ${a.action} (${a.who}, до: ${a.when})`);
        }
        lines.push('');
    }

    // Amounts
    if (r.key_entities.amounts.length > 0) {
        lines.push('## 💶 Суми');
        for (const a of r.key_entities.amounts) {
            lines.push(`- **${a.value} ${a.currency}** — ${a.context}`);
        }
        lines.push('');
    }

    // Risks
    if (r.risks.length > 0) {
        lines.push('## ⚠️ Ризики');
        for (const risk of r.risks) {
            const sIcon = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢';
            lines.push(`- ${sIcon} **${risk.risk}** — ${risk.why}`);
        }
        lines.push('');
    }

    // People & Cases (compact)
    const entities: string[] = [];
    if (r.key_entities.person_names.length > 0) {
        entities.push(`👤 ${r.key_entities.person_names.join(', ')}`);
    }
    if (r.key_entities.case_numbers.length > 0) {
        entities.push(`📎 ${r.key_entities.case_numbers.join(', ')}`);
    }
    if (entities.length > 0) {
        lines.push('## Реквізити');
        lines.push(entities.join(' | '));
        lines.push('');
    }

    // Model trace (debug)
    lines.push(`---`);
    lines.push(`_🤖 Моделі: ${r.model_trace.understand_model} → ${r.model_trace.decide_model}_`);
    if (r.model_trace.fallbacks.length > 0) {
        for (const fb of r.model_trace.fallbacks) {
            lines.push(`_⚡ Fallback (${fb.step}): ${fb.from} → ${fb.to}_`);
        }
    }

    return lines.join('\n');
}

// ─── Runtime Model Verification (browser console) ─────────────────
// Usage: open browser console → await window.__testModelRouter()
// This bypasses the router-enabled flag to test actual model access.

interface TestResult {
    ok: boolean;
    model_trace?: {
        used_model: string;
        fallback: boolean;
        primary_target: string;
        fallback_target: string;
        router_enabled: boolean;
        time: number;
    };
    error?: string;
}

async function testModelRouter(): Promise<TestResult> {
    console.log('🧪 [__testModelRouter] Starting model verification...');
    console.log('🧪 Router enabled:', MODEL_CONFIG.ROUTER_ENABLED);

    const route = routeForTask('UNDERSTAND_DOC');
    console.log('🧪 Route:', {
        primary: route.primary.id,
        primaryLocation: route.primary.location,
        fallback: route.fallback.id,
    });

    try {
        const testPrompt = 'Reply with exactly: {"status":"ok","model_name":"<your model name>"}';
        const result = await invokeWithFallback('UNDERSTAND_DOC', [testPrompt]);

        const trace: TestResult = {
            ok: true,
            model_trace: {
                used_model: result.modelUsed,
                fallback: result.fallbackUsed,
                primary_target: route.primary.id,
                fallback_target: route.fallback.id,
                router_enabled: MODEL_CONFIG.ROUTER_ENABLED,
                time: Date.now(),
            },
        };

        console.log('🧪 [__testModelRouter] RESULT:', JSON.stringify(trace, null, 2));

        if (result.fallbackUsed) {
            console.warn('⚠️ FALLBACK WAS USED. Reason:', result.fallbackReason);
        } else {
            console.log('✅ PRIMARY MODEL RESPONDED:', result.modelUsed);
        }

        console.log('🧪 Raw response:', result.text.slice(0, 200));
        return trace;
    } catch (e: any) {
        const errorResult: TestResult = {
            ok: false,
            error: e.message || String(e),
        };
        console.error('🧪 [__testModelRouter] FAILED:', errorResult);
        return errorResult;
    }
}

// Expose to browser console
(window as any).__testModelRouter = testModelRouter;
