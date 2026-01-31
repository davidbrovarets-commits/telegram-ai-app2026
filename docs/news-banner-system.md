# News Banner System (Google Imagen / Vertex AI)

This system automatically generates a weekly "hero" banner for the News section of the app, visualizing the top topics of the week without using real photos or sensitive data.

## Architecture

1.  **Sources Layer**: `config/sources.json` defines RSS feeds for National (DE), Bundesland (e.g., Sachsen), and City (e.g., Leipzig) levels.
2.  **Aggregation**: The script fetches these feeds and extracts the top 5 titles.
3.  **Brief & Prompt**: A "Creative Brief" is converted into a safe, abstract Image Prompt.
4.  **Generation**: The system calls **Google Vertex AI (Imagen)** to generate the image.
5.  **Publishing**: Saves to `public/assets/news/hero/{regionKey}/` and updates `latest.png`.

## Configuration

To add a new region or source, edit `config/sources.json`.

## Google Cloud Setup

1.  Enable **Vertex AI API** in your Google Cloud Project.
2.  Create a Service Account with `Vertex AI User` role.
3.  Download JSON Key.
4.  Add secrets to GitHub Repository:
    *   `GOOGLE_CREDENTIALS`: The content of the JSON key file.
    *   `GOOGLE_PROJECT_ID`: Your GCP Project ID.

## Running Manually

To test the generation locally:

```bash
# Auth with gcloud for local testing
gcloud auth application-default login

# Run the job
npx tsx scripts/weekly_news_banner_job.ts
```

## Automation

The system runs via GitHub Actions (`.github/workflows/weekly-banner.yml`) every **Monday at 06:00 UTC**.

## Assets Structure

- `public/assets/news/hero/{regionKey}/latest.png` - The file the UI should load.
- `public/assets/news/hero/{regionKey}/latest.json` - Metadata (topics, timestamp).
- `public/assets/news/hero/{regionKey}/{YYYY-WW}.png` - Archive.

## UI Integration

The frontend should load `latest.png` with a cache-busting query parameter:

```tsx
<img src={`/assets/news/hero/sachsen-leipzig/latest.png?v=${metadata.updatedAt}`} />
```
