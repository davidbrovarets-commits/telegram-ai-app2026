import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function runCheck(name: string, checkFn: () => void) {
    try {
        checkFn();
        console.log(`✅ [PASS] ${name}`);
    } catch (err: any) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Reason: ${err.message}`);
        process.exit(1);
    }
}

function getGhPath() {
    // Attempt standard 'gh', but on windows we might need explicit path resolution or just shell out.
    // The standard node child_process execSync resolves against the system PATH.
    return 'gh';
}

console.log('--- PREFLIGHT MUTATION CHECK ---');

// 1. Verify gh authenticated
runCheck('GitHub CLI Authenticated', () => {
    try {
        execSync(`${getGhPath()} auth status`, { stdio: 'pipe' });
    } catch (e: any) {
        throw new Error('Not authenticated to GitHub CLI or CLI not found. Run \"gh auth login\".');
    }
});

// 2. Confirm 0 in-progress runs
runCheck('Zero "in progress" GitHub Actions runs', () => {
    const rawOut = execSync(`${getGhPath()} run list --status in_progress --limit 50 --json name,databaseId,status`, { encoding: 'utf8' });
    const runs = JSON.parse(rawOut);
    if (runs.length > 0) {
        const details = runs.map((r: any) => `   - ${r.name} (ID: ${r.databaseId}) [${r.status}]`).join('\n');
        throw new Error(`Found ${runs.length} in-progress run(s):\n${details}`);
    }
});

// 3. Verify schedules are paused (allowlist: news-orchestrator.yml)
runCheck('Schedules Paused (except allowlist)', () => {
    const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
    if (!fs.existsSync(workflowsDir)) {
        throw new Error('Workflows directory not found');
    }

    const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    const allowlist = ['news-orchestrator.yml'];
    const activeSchedules: string[] = [];

    for (const file of files) {
        if (allowlist.includes(file)) continue;

        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        const lines = content.split('\n');

        // Very basic YAML parsing: look for `schedule:` that is not commented out
        let inScheduleBlock = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) continue; // Commented line

            if (trimmed.startsWith('schedule:')) {
                inScheduleBlock = true;
                continue;
            }
            if (inScheduleBlock) {
                // If we un-indent back to a top level key, we stepped out of schedule
                if (line.match(/^[a-zA-Z_-]+:/)) {
                    inScheduleBlock = false;
                } else if (trimmed.startsWith('- cron:')) {
                    activeSchedules.push(`${file}:${i + 1}`);
                }
            }
        }
    }

    if (activeSchedules.length > 0) {
        throw new Error(`Found active schedules in non-allowlisted workflows:\n` + activeSchedules.map(s => `   - ${s}`).join('\n'));
    }
});

console.log('\n✅ All preflight mutation checks passed.');
process.exit(0);
