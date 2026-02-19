import 'dotenv/config';
import { VertexAI } from '@google-cloud/vertexai';

function must(name: string, v?: string) {
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function nowIso() {
    return new Date().toISOString();
}

async function testModel(model: string, project: string, location: string) {
    const vertex = new VertexAI({ project, location });

    // Use generateContent-style call (VertexAI SDK)
    const generativeModel = vertex.getGenerativeModel({ model });

    const prompt = `DIAG ping ${nowIso()}. Reply with: OK <model> <location>.`;
    try {
        const res = await generativeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 50 },
        });
        const text =
            res?.response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
        return { ok: true, model, location, project, text: text.slice(0, 120) };
    } catch (e: any) {
        return {
            ok: false,
            model,
            location,
            project,
            errName: e?.name,
            errCode: e?.code,
            errStatus: e?.status,
            errMessage: String(e?.message || e).slice(0, 300),
        };
    }
}

async function main() {
    // These MUST match what pipeline uses.
    const project =
        process.env.GOOGLE_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.GCLOUD_PROJECT ||
        process.env.GCP_PROJECT ||
        process.env.PROJECT_ID ||
        process.env.VERTEX_PROJECT ||
        process.env.VERTEX_PROJECT_ID ||
        '';

    const location =
        process.env.VERTEX_LOCATION ||
        process.env.VERTEX_REGION ||
        process.env.GCP_REGION ||
        process.env.GOOGLE_CLOUD_REGION ||
        'us-central1';

    const modelFromEnv =
        process.env.VERTEX_MODEL ||
        process.env.GEMINI_MODEL ||
        process.env.VERTEX_TEXT_MODEL ||
        'gemini-3-pro-preview';

    console.log('=== VERTEX DIAG: ENV SNAPSHOT ===');
    console.log(JSON.stringify({
        at: nowIso(),
        project_detected: project || '(empty)',
        location_detected: location,
        model_env: modelFromEnv,
        runner: {
            ga: !!process.env.GITHUB_ACTIONS,
            workflow: process.env.GITHUB_WORKFLOW,
            run_id: process.env.GITHUB_RUN_ID,
            sha: process.env.GITHUB_SHA,
        },
    }, null, 2));

    // Fail-fast if we cannot detect project at all
    const projectFinal = must('GOOGLE_CLOUD_PROJECT (or equivalent)', project);

    // Test the model env + a couple known-good fallbacks to locate the mismatch
    const modelsToTest = [
        modelFromEnv,
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-1.5-pro',
    ];

    console.log('\n=== VERTEX DIAG: MODEL REACHABILITY MATRIX ===');
    const results = [];
    for (const m of modelsToTest) {
        const r = await testModel(m, projectFinal, location);
        results.push(r);
        console.log(r.ok ? 'OK  ' : 'FAIL', JSON.stringify(r));
    }

    console.log('\n=== DIAG CONCLUSION HINTS ===');
    console.log(
        [
            'If Studio works but pipeline FAIL(404): pipeline likely uses different project OR different region OR different credentials.',
            'Compare project_detected + location_detected with Studio project/region.',
            'If gemini-2.5-pro works but gemini-3-pro-preview fails: model not enabled/available in this project+region.',
        ].join('\n')
    );

    // Exit code for CI visibility
    const anyOk = results.some((r: any) => r.ok);
    if (!anyOk) process.exit(2);
}

main().catch((e) => {
    console.error('DIAG_FATAL', e);
    process.exit(3);
});
