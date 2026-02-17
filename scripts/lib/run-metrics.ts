import fs from 'fs';
import path from 'path';

export class RunMetrics {
    private data: Record<string, number> = {};
    private runId: string;

    constructor(runId?: string) {
        this.runId = runId || new Date().toISOString().replace(/[:.]/g, '-');
    }

    inc(name: string, amount = 1) {
        this.data[name] = (this.data[name] || 0) + amount;
    }

    add(name: string, value: number) {
        this.data[name] = (this.data[name] || 0) + value;
    }

    get(name: string): number {
        return this.data[name] || 0;
    }

    summaryConsole() {
        console.log('--- Run Metrics Summary ---');
        console.table(this.data);
        console.log('---------------------------');
    }

    flushToJson(relativePath = 'artifacts/run-metrics.json') {
        try {
            // Ensure dir exists
            const fullPath = path.resolve(process.cwd(), relativePath);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const payload = {
                runId: this.runId,
                timestamp: new Date().toISOString(),
                metrics: this.data
            };

            fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2));
            console.log(`✅ Metrics written to ${relativePath}`);
        } catch (e) {
            console.error('Failed to write metrics:', e);
        }
    }
}

export const metrics = new RunMetrics();
