
import * as fs from 'fs';
import * as path from 'path';

const REGISTRY_PATH = path.join('scripts', 'registries', 'source-registry.ts');

function main() {
    console.log('--- PATCH 4.2: FIXING FINAL VIOLATIONS ---');

    let content = fs.readFileSync(REGISTRY_PATH, 'utf-8');

    // 1. Stuttgarter Zeitung (Podcast skipped -> needs NO_FEED)
    // base_url: "https://www.stuttgarter-zeitung.de"
    content = content.replace(
        'base_url: "https://www.stuttgarter-zeitung.de"',
        'base_url: "https://www.stuttgarter-zeitung.de" // NO_FEED (reason: podcast_feed_only)'
    );

    // 2. Nordbayern (Valid RSS, regex missed)
    // base_url: "https://www.nordbayern.de/nuernberg?isRss=true"
    // Add // RSS comment
    content = content.replace(
        'base_url: "https://www.nordbayern.de/nuernberg?isRss=true"',
        'base_url: "https://www.nordbayern.de/nuernberg?isRss=true" // RSS'
    );

    // 3. Gelsenkirchen (Valid RSS ending in /)
    // base_url: "https://www.gelsenkirchen.de/de/_meta/Aktuelles/artikel/newsfeed/"
    content = content.replace(
        'base_url: "https://www.gelsenkirchen.de/de/_meta/Aktuelles/artikel/newsfeed/"',
        'base_url: "https://www.gelsenkirchen.de/de/_meta/Aktuelles/artikel/newsfeed/" // RSS'
    );

    // 4. Stuttgarter Zeitung (Wait, did I see it twice? Or maybe aliases?)
    // The violation said: base_url: "https://www.stuttgarter-zeitung.de/" (trailing slash?)
    // Let's replace strictly.

    // Also check "stuttgart_stz" which might be the alias.
    // The discovery report had:
    // | **stuttgart_stz** | `https://www.stuttgarter-zeitung.de/` | ...

    // I already handled the one without slash. Let's handle with slash if it exists.
    content = content.replace(
        'base_url: "https://www.stuttgarter-zeitung.de/"',
        'base_url: "https://www.stuttgarter-zeitung.de/" // NO_FEED (reason: podcast_feed_only)'
    );

    fs.writeFileSync(REGISTRY_PATH, content);
    console.log('✅ Applied manual fixes for known violations.');
}

main();
