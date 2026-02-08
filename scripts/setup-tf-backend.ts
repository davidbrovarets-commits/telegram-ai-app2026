
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function setupBackend() {
    console.log('🏗️  Setting up Terraform Backend...');

    // 1. Determine Project & Bucket Name
    const projectId = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) {
        console.error('❌ Project ID not found in .env');
        process.exit(1);
    }

    const bucketName = `${projectId}-tf-state`; // Standard convention
    console.log(`Target Bucket: gs://${bucketName}`);

    // 2. Initialize Storage
    // Uses GOOGLE_APPLICATION_CREDENTIALS automatically
    const storage = new Storage({ projectId });

    try {
        const [buckets] = await storage.getBuckets();
        const exists = buckets.find(b => b.name === bucketName);

        if (exists) {
            console.log(`✅ Bucket '${bucketName}' already exists.`);
        } else {
            console.log(`⚠️  Bucket '${bucketName}' does not exist. Attempting to create...`);
            await storage.createBucket(bucketName, {
                location: 'US', // Start with US or your preferred region
                storageClass: 'STANDARD',
                versioning: {
                    enabled: true // Important for state recovery
                }
            });
            console.log(`✅ Bucket '${bucketName}' created successfully!`);
        }

        console.log('\n📝 NEXT STEPS:');
        console.log('Update main.tf with the following block:');
        console.log(`
terraform {
  backend "gcs" {
    bucket  = "${bucketName}"
    prefix  = "terraform/state"
  }
}
        `);

    } catch (e: any) {
        console.error('❌ Error accessing GCS:', e.message);
        if (e.code === 403) {
            console.error('   Hint: Service Account needs "Storage Admin" role to create buckets.');
        }
    }
}

setupBackend();
