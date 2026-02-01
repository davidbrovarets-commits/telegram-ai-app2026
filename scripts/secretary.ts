
import { runSecretaryCore } from './secretary-core';

// This is the Cloud version (Cron job)
// Runs for ~55 seconds to fit into 1-minute schedule overlap
console.log("🚀 Starting Cloud Secretary...");

runSecretaryCore({
    durationMs: 55000,
    modeName: 'Cloud/Cron',
    runMorningBriefing: process.argv.includes('--morning')
}).catch(console.error);
