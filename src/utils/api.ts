import { aiService } from "../services/ai/AIService";
import { analyzeDocumentStructured, type DocumentAnalysisResult } from "../services/ai/document-analysis";
import { MODEL_CONFIG } from "../services/ai/model-config";
import { invokeWithFallback, routeForTask } from '../services/ai/model-router';
import { getAI, VertexAIBackend, getGenerativeModel } from 'firebase/ai';
import { app } from '../firebaseConfig';

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


// ═══════════════════════════════════════════════════════════════════
// DEFINITIVE RUNTIME VERTEX ACCESS PROBE
// Usage:  await window.__probeVertexAccess()
// Bypasses router feature flag. Tests each model directly.
// REMOVE after verification.
// ═══════════════════════════════════════════════════════════════════

interface ProbeResult {
    ok: boolean;
    modelId: string;
    location: string;
    elapsedMs: number;
    requestId: string;
    status: 'OK' | 'ERROR';
    responsePreview?: string;
    httpStatus?: number | string;
    code?: string;
    reason?: string;
    message?: string;
}

interface ProbeReport {
    ts: string;
    routerEnabled: boolean;
    results: Array<{ case: string } & ProbeResult>;
}

/**
 * Low-level model access probe. Uses Firebase AI SDK directly.
 * NEVER throws — always returns a structured result.
 */
async function probeModelAccess(
    modelId: string,
    location: string,
    prompt: string,
): Promise<ProbeResult> {
    const requestId = `probe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const t0 = performance.now();

    console.log(`[PROBE_START] ${requestId} → ${modelId}@${location}`);

    try {
        const ai = getAI(app, {
            backend: new VertexAIBackend(location),
        });

        const model = getGenerativeModel(ai, { model: modelId });
        const result = await model.generateContent([prompt]);
        const text = result.response.text();
        const elapsedMs = Math.round(performance.now() - t0);

        console.log(`[PROBE_OK] ${requestId} ${modelId}@${location} ${elapsedMs}ms`);

        return {
            ok: true,
            modelId,
            location,
            elapsedMs,
            requestId,
            status: 'OK',
            responsePreview: (text || '').slice(0, 120),
        };
    } catch (err: any) {
        const elapsedMs = Math.round(performance.now() - t0);

        // Extract as much diagnostic data as possible
        const httpStatus = err.status ?? err.response?.status ?? err.httpErrorCode?.status ?? undefined;
        const code = err.code ?? err.response?.code ?? extractGrpcCode(err.message) ?? undefined;
        const reason = extractReason(err.message || String(err));
        const message = (err.message || String(err)).slice(0, 300);
        const details = err.details ? JSON.stringify(err.details).slice(0, 200) : undefined;
        const cause = err.cause ? String(err.cause).slice(0, 200) : undefined;

        console.error(`[PROBE_FAIL] ${requestId} ${modelId}@${location} ${elapsedMs}ms`, {
            httpStatus, code, reason, message, details, cause,
        });

        return {
            ok: false,
            modelId,
            location,
            elapsedMs,
            requestId,
            status: 'ERROR',
            httpStatus,
            code,
            reason,
            message,
        };
    }
}

/** Extract gRPC-style status code from error messages */
function extractGrpcCode(msg: string): string | undefined {
    const codes = [
        'PERMISSION_DENIED', 'NOT_FOUND', 'UNIMPLEMENTED',
        'RESOURCE_EXHAUSTED', 'UNAUTHENTICATED', 'UNAVAILABLE',
        'INTERNAL', 'INVALID_ARGUMENT', 'DEADLINE_EXCEEDED',
    ];
    for (const c of codes) {
        if (msg.includes(c)) return c;
    }
    return undefined;
}

/** Extract human-readable reason from error */
function extractReason(msg: string): string {
    if (msg.includes('PERMISSION_DENIED')) return 'PERMISSION_DENIED';
    if (msg.includes('NOT_FOUND') || msg.includes('404')) return 'NOT_FOUND';
    if (msg.includes('UNIMPLEMENTED')) return 'UNIMPLEMENTED';
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) return 'RESOURCE_EXHAUSTED';
    if (msg.includes('UNAUTHENTICATED') || msg.includes('401')) return 'UNAUTHENTICATED';
    if (msg.includes('model not found') || msg.includes('is not supported')) return 'MODEL_NOT_AVAILABLE';
    if (msg.includes('403')) return 'FORBIDDEN';
    return 'UNKNOWN';
}

/**
 * Definitive Vertex AI access probe.
 * Tests Gemini 3 Pro Preview, GLM 4.7, and Gemini 2.5 Pro fallback individually.
 * Returns a structured report. Bypasses all feature flags.
 */
async function probeVertexAccess(): Promise<ProbeReport> {
    const defaultLocation = MODEL_CONFIG.GEMINI_FALLBACK.location; // us-central1

    const cases = [
        { name: 'GEMINI_3_PRO_PREVIEW', model: 'gemini-3-pro-preview', location: 'global' },
        { name: 'GLM_4_7', model: 'glm-4.7', location: defaultLocation },
        { name: 'GEMINI_2_5_PRO', model: 'gemini-2.5-pro', location: defaultLocation },
    ];

    const prompt = 'Return exactly: {"ok":true}. JSON only.';

    console.log('');
    console.log('══════════════════════════════════════════════');
    console.log('  VERTEX AI ACCESS PROBE');
    console.log(`  ${new Date().toISOString()}`);
    console.log(`  Router enabled: ${MODEL_CONFIG.ROUTER_ENABLED}`);
    console.log('══════════════════════════════════════════════');
    console.log('');

    const results: ProbeReport['results'] = [];

    for (const c of cases) {
        const r = await probeModelAccess(c.model, c.location, prompt);
        results.push({ case: c.name, ...r });

        // Single-line summary
        if (r.ok) {
            console.log(`✅ ACCESS OK: ${c.model}@${c.location}  (${r.elapsedMs}ms)`);
        } else {
            console.log(`❌ ACCESS FAIL: ${c.model}@${c.location} — ${r.reason || r.code || r.httpStatus || 'unknown'}  (${r.elapsedMs}ms)`);
        }
    }

    const report: ProbeReport = {
        ts: new Date().toISOString(),
        routerEnabled: MODEL_CONFIG.ROUTER_ENABLED,
        results,
    };

    console.log('');
    console.log('[VERTEX_ACCESS_REPORT]', JSON.stringify(report, null, 2));
    console.log('');

    return report;
}

// Expose to browser console
(window as any).__probeVertexAccess = probeVertexAccess;
