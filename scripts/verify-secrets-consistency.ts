
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const AMBER = '\x1b[33m';
const RESET = '\x1b[0m';

function log(color: string, msg: string) {
    console.log(`${color}${msg}${RESET}`);
}

async function auditSecrets() {
    console.log('🔐  AG SECRETS AUDIT  🔐\n');
    let errors = 0;

    // 1. Google Cloud Service Account
    const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'C:\\gcp\\vertex\\sa.json';
    console.log(`[GCP] Checking Service Account at: ${saPath}`);

    if (fs.existsSync(saPath)) {
        try {
            const sa = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
            if (sa.type === 'service_account' && sa.project_id && sa.client_email && sa.private_key) {
                log(GREEN, `  ✅ Valid JSON. Project: ${sa.project_id}`);
                log(GREEN, `  ✅ Identity: ${sa.client_email}`);

                // Consistency Check
                const envProject = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
                if (envProject && envProject !== sa.project_id) {
                    log(AMBER, `  ⚠️  MISMATCH: .env says ${envProject}, but SA is for ${sa.project_id}`);
                    // This might be intended (cross-project SA), but worth noting.
                }

            } else {
                log(RED, '  ❌ Invalid Service Account JSON structure.');
                errors++;
            }
        } catch (e) {
            log(RED, `  ❌ Error reading SA file: ${e.message}`);
            errors++;
        }
    } else {
        log(RED, '  ❌ Service Account file NOT FOUND locally.');
        errors++;
    }

    console.log('\n[Supabase]');
    const sbUrl = process.env.VITE_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const sbToken = process.env.SUPABASE_ACCESS_TOKEN;

    if (sbUrl) log(GREEN, `  ✅ URL: ${sbUrl}`);
    else { log(RED, '  ❌ URL (VITE_SUPABASE_URL) missing in .env'); errors++; }

    if (sbKey && sbKey.startsWith('eyJ')) log(GREEN, '  ✅ Service Role Key found (JWT format).');
    else { log(RED, '  ❌ SUPABASE_SERVICE_ROLE_KEY missing or invalid.'); errors++; }

    if (sbToken && sbToken.startsWith('sbp_')) log(GREEN, '  ✅ Access Token found (sbp_ format).');
    else { log(AMBER, '  ⚠️  SUPABASE_ACCESS_TOKEN missing (Required for Edge Functions deploy).'); }


    console.log('\n[Firebase]');
    const fbApiKey = process.env.VITE_FIREBASE_API_KEY;
    const fbProject = process.env.VITE_FIREBASE_PROJECT_ID;

    if (fbApiKey) log(GREEN, '  ✅ API Key found.');
    else { log(RED, '  ❌ VITE_FIREBASE_API_KEY missing.'); errors++; }

    if (fbProject) log(GREEN, `  ✅ Project: ${fbProject}`);
    else { log(RED, '  ❌ VITE_FIREBASE_PROJECT_ID missing.'); errors++; }


    console.log('\n[GitHub Actions Readiness]');
    console.log('To run autonomously in CI, GitHub Secrets must match these local values.');

    if (errors === 0) {
        log(GREEN, '\n✨  LOCAL SECRETS ARE HEALTHY.  ✨');
        console.log('Proceed to validate GitHub Secrets.');
    } else {
        log(RED, `\n🛑  FOUND ${errors} ISSUES. Fix local config first.`);
        process.exit(1);
    }
}

auditSecrets();
