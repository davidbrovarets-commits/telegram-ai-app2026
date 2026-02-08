
import process from 'process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(color: string, msg: string) {
    console.log(`${color}${msg}${RESET}`);
}

function checkEnv(name: string, required: boolean = true, validator?: (val: string) => boolean): boolean {
    const val = process.env[name];
    if (!val) {
        if (required) {
            log(RED, `❌ MISSING: ${name}`);
            return false;
        } else {
            log(YELLOW, `⚠️  MISSING (Optional): ${name}`);
            return true; // Not a failure
        }
    }

    if (validator && !validator(val)) {
        log(RED, `❌ INVALID: ${name} (Format check failed)`);
        return false;
    }

    log(GREEN, `✅ PRESENT: ${name}`);
    return true;
}

async function runPreflight() {
    console.log('🛫  CI PRE-FLIGHT CHECKS  🛫\n');

    const args = process.argv.slice(2);
    const scopeArg = args.find(a => a.startsWith('--scope='));
    const scope = scopeArg ? scopeArg.split('=')[1] : 'all';

    console.log(`Scope: ${scope.toUpperCase()}\n`);

    let failed = false;

    // 1. Google Cloud Credentials (GCP/Firebase)
    if (scope === 'all' || scope === 'gcp' || scope === 'firebase') {
        console.log('[GCP / Firebase Creds]');
        const gcpCreds = process.env.GOOGLE_CREDENTIALS;
        if (!gcpCreds) {
            log(RED, '❌ MISSING: GOOGLE_CREDENTIALS');
            failed = true;
        } else {
            try {
                const json = JSON.parse(gcpCreds);
                if (!json.project_id || !json.client_email) {
                    log(RED, '❌ INVALID: GOOGLE_CREDENTIALS (Missing project_id or client_email)');
                    failed = true;
                } else {
                    log(GREEN, '✅ PRESENT: GOOGLE_CREDENTIALS (Valid JSON)');

                    // Project ID Consistency
                    const envProject = process.env.GOOGLE_PROJECT_ID;
                    if (envProject && json.project_id !== envProject) {
                        log(RED, `❌ MISMATCH: GOOGLE_PROJECT_ID (${envProject}) != SA project_id (${json.project_id})`);
                        failed = true;
                    }
                }
            } catch (e) {
                log(RED, '❌ INVALID: GOOGLE_CREDENTIALS (Not valid JSON)');
                failed = true;
            }
        }
    }

    // 2. Supabase
    if (scope === 'all' || scope === 'supabase') {
        console.log('\n[Supabase]');
        if (!checkEnv('VITE_SUPABASE_URL', true, (v) => v.startsWith('https://'))) failed = true;
        if (!checkEnv('SUPABASE_ACCESS_TOKEN', true, (v) => v.startsWith('sbp_'))) failed = true;
        checkEnv('SUPABASE_SERVICE_ROLE_KEY', false); // Warn logic handled inside
    }

    // 3. Firebase Config
    if (scope === 'all' || scope === 'firebase') {
        console.log('\n[Firebase Config]');
        if (!checkEnv('VITE_FIREBASE_API_KEY')) failed = true;
        if (!checkEnv('VITE_FIREBASE_PROJECT_ID')) failed = true;
    }

    console.log('\n--------------------------------');
    if (failed) {
        log(RED, '🛑 PRE-FLIGHT FAILED. Blocking deployment.');
        process.exit(1);
    } else {
        log(GREEN, '✨ ALL SYSTEMS GO. Proceeding to deploy.');
        process.exit(0);
    }
}

runPreflight();
