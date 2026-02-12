
import 'dotenv/config';
import { vertexClient } from '../utils/vertex-client';
import * as dotenv from 'dotenv';

dotenv.config();

async function runDocsStressTest() {
    console.log('🚀 Starting Vertex Client Stress Test...');
    console.log('Objective: Send 20 requests rapidly and observe Queue/Backoff behavior.');

    const prompt = "Say 'Hello' and the current request index.";
    const totalRequests = 20;
    const promises: Promise<any>[] = [];

    const startTime = Date.now();

    for (let i = 0; i < totalRequests; i++) {
        // Add a tiny delay just to not stack overflow the call stack immediately, 
        // but fast enough to fill the queue
        const p = vertexClient.generateText(`${prompt} (Request #${i})`, 0.1)
            .then(res => {
                const duration = Date.now() - startTime;
                console.log(`✅ Request #${i} success [${duration}ms]: "${res.trim().slice(0, 30)}..."`);
                return { id: i, status: 'success', duration };
            })
            .catch(err => {
                const duration = Date.now() - startTime;
                console.error(`❌ Request #${i} failed [${duration}ms]:`, err.message);
                return { id: i, status: 'fail', error: err.message };
            });

        promises.push(p);
    }

    console.log(`... ${totalRequests} requests enqueued.`);

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 'success').length;

    console.log('\n=== TEST COMPLETE ===');
    console.log(`Success: ${successCount}/${totalRequests}`);
    console.log(`Time: ${(Date.now() - startTime) / 1000}s`);
}

runDocsStressTest().catch(console.error);
