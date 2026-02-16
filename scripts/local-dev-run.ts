
import 'dotenv/config';
import { main as runOrchestrator } from './orchestrator-l6';

async function main() {
    console.log('🚧 LOCAL DEV RUNNER STARTING 🚧');

    // 1. Enforce Safe Defaults
    if (process.env.DRY_RUN === undefined) {
        process.env.DRY_RUN = 'true';
        console.log('🛡️  DRY_RUN not set. Defaulting to TRUE (Safe Mode).');
    } else {
        console.log(`⚠️  DRY_RUN is explicitly set to: ${process.env.DRY_RUN}`);
    }

    /* 
       Feature: We could parse args to run specific agents only.
       For now, we run the full orchestrator cycle (which includes auto-healer in dry mode).
    */

    try {
        console.log('\n--- STARTED ORCHESTRATOR ---\n');
        await runOrchestrator();
        console.log('\n--- FINISHED ORCHESTRATOR ---\n');

        if (process.env.DRY_RUN === 'true') {
            console.log('✅ Local Dry Run Complete. Verify no DB mutations occurred.');
        } else {
            console.log('⚠️  REAL RUN COMPLETE. Database was updated.');
        }

    } catch (e) {
        console.error('❌ Local Run Failed:', e);
        process.exit(1);
    }
}

main();
