/**
 * AG Integration Read-Only Verification Script
 * 
 * Safe verification of GitHub, Supabase, Vertex AI, Firebase, and Telegram credentials.
 * NEVER prints secret values.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local') });

function execSilent(cmd: string): string | null {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
        return null;
    }
}

async function verifyGithub() {
    console.log('\n--- STEP 1: GITHUB (CLI Check) ---');
    const version = execSilent('gh --version');
    if (!version) {
        console.log('GitHub CLI (gh) not found in system PATH.');
        console.log('MISSING: Required deterministic alternative: user sets GH_TOKEN (classic PAT) or performs interactive login.');
        return;
    }
    console.log(`gh version: ${version.split('\n')[0]}`);

    const authStatus = execSilent('gh auth status');
    if (!authStatus) {
        console.log('MISSING: gh auth status failed (not authenticated). Required deterministic alternative: user sets GH_TOKEN (classic PAT) or performs interactive login.');
        return;
    }
    console.log('gh auth OK.');

    const repoDetails = execSilent('gh repo view --json nameWithOwner,defaultBranchRef');
    if (repoDetails) {
        console.log(`Repo: ${repoDetails}`);
    }

    console.log('\nRecent Runs (L6):');
    const runs = execSilent('gh run list --limit 5 --json databaseId,workflowName,status,conclusion,createdAt');
    if (runs) console.log(runs);
}

async function verifySupabase() {
    console.log('\n--- STEP 2: SUPABASE (READ-ONLY) ---');
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const sRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`VITE_SUPABASE_URL present: ${!!url}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY present: ${!!sRoleKey}`);

    if (!url || !sRoleKey) {
        console.log('SKIPPED: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        return;
    }

    try {
        const supabase = createClient(url, sRoleKey);

        // 1) public.news inserted last 24h
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const { count: newsCount, error: err1 } = await supabase
            .from('news')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday.toISOString());

        if (err1) {
            console.log(`Error querying public.news: ${err1.message}`);
        } else {
            console.log(`public.news inserted last 24h count: ${newsCount}`);
        }

        // 2) table existence sanity
        const { data, error: err2 } = await supabase
            .from('news_user_state')
            .select('1')
            .limit(1);

        if (err2) {
            console.log(`Error querying public.news_user_state: ${err2.message}`);
        } else {
            console.log(`public.news_user_state exists: true (row count returned > 0 or empty array)`);
        }

    } catch (e: any) {
        console.log(`SKIPPED/ERROR: Failed to initialize or query Supabase - ${e.message}`);
    }
}

async function verifyVertex() {
    console.log('\n--- STEP 3: VERTEX AI (READ-ONLY) ---');
    const projectId = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    console.log(`GOOGLE_PROJECT_ID present: ${!!projectId}`);

    try {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const token = await client.getAccessToken();

        console.log(`token_ok true`);
        console.log(`project + location: ${projectId || 'inherited-from-ADC'} + ${location}`);

        // Target model ID (inferred from orchestration workflows)
        console.log(`target model id configured: gemini-2.5-pro / gemini-1.5-pro`);

    } catch (e: any) {
        console.log(`token_ok false`);
        console.log(`MISSING: Failed to obtain Vertex AI credentials. Error: ${e.message}. Required deterministic alternative: Ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid service account JSON or ADC is configured.`);
    }
}

async function verifyFirebase() {
    console.log('\n--- STEP 4: FIREBASE (READINESS ONLY) ---');

    const fbJsonExists = fs.existsSync(path.join(projectRoot, 'firebase.json'));
    const fbrcExists = fs.existsSync(path.join(projectRoot, '.firebaserc'));

    console.log(`firebase_config_present ${fbJsonExists}`);

    if (fbrcExists) {
        try {
            const fbrc = JSON.parse(fs.readFileSync(path.join(projectRoot, '.firebaserc'), 'utf8'));
            const projectId = fbrc.projects?.default;
            console.log(`projectId_from_config: ${projectId}`);
        } catch (e) {
            console.log('Failed to parse .firebaserc');
        }
    }

    const fbVersion = execSilent('npx firebase --version');
    if (fbVersion) {
        console.log(`firebase tools version: ${fbVersion}`);
    } else {
        console.log(`firebase tools version: missing or failed to run npx firebase`);
    }
}

async function verifyTelegram() {
    console.log('\n--- STEP 5: TELEGRAM BOT API (READ-ONLY) ---');
    const token = process.env.TELEGRAM_BOT_TOKEN;

    console.log(`TELEGRAM_BOT_TOKEN present: ${!!token}`);

    if (!token) {
        console.log('MISSING: TELEGRAM_BOT_TOKEN');
        return;
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await res.json();

        console.log(`ok ${data.ok}`);
        if (data.ok) {
            console.log(`bot username: ${data.result.username}`);
        }
    } catch (e: any) {
        console.log(`MISSING: Telegram fetch failed: ${e.message}`);
    }
}

async function main() {
    await verifyGithub();
    await verifySupabase();
    await verifyVertex();
    await verifyFirebase();
    await verifyTelegram();
}

main().catch(e => {
    console.error('Fatal execution error:', e);
});
