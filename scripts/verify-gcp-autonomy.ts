
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyAuth() {
    console.log('🔍 Checking GCP Authentication...');

    // Check Env
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log(`✅ GOOGLE_APPLICATION_CREDENTIALS is set: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    } else {
        console.log('❌ GOOGLE_APPLICATION_CREDENTIALS is NOT set.');
    }

    try {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        const creds = await auth.getCredentials();

        console.log(`\n🆔 Authenticated Project: ${projectId}`);
        console.log(`📧 Client Email: ${creds.client_email || 'Unknown (Likely User Credentials)'}`);
        console.log(`🔑 Auth Type: ${client.constructor.name}`);

        if (!creds.client_email) {
            console.log('\n⚠️  WARNING: No client_email found. You are likely using Personal User Credentials via gcloud ADC.');
            console.log('   Autonomy Goal: Should be a Service Account (e.g. agent@project.iam.gserviceaccount.com)');
        } else {
            console.log('\n✅ SUCCESS: Authenticated as a Service Account.');
        }

    } catch (e: any) {
        console.error('❌ Authentication Failed:', e.message);
    }
}

verifyAuth();
