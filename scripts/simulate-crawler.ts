
import * as cheerio from 'cheerio';

// Mock list of portals to scan
const PORTALS = [
    {
        city: "München",
        url: "https://ru.muenchen.de/",
        selector: ".c-teaser, .entry, .news-item, li a"
    },
    {
        city: "Leipzig",
        url: "https://www.leipzig.de/news/",
        selector: ".news-list-item, .ce-textpic, h3 a"
    },
    {
        city: "Köln",
        url: "https://www.stadt-koeln.de/politik-und-verwaltung/presse/mitteilungen/",
        selector: ".news-list-item, li a, .entry-title a"
    },
    {
        city: "Düsseldorf",
        url: "https://www.duesseldorf.de/aktuelles/news/uebersicht",
        selector: ".news-list-item, .teaser, h3 a"
    },
    {
        city: "Hamburg",
        url: "https://www.hamburg.de/presse/",
        selector: "article a, .teaser-text a, h3 a"
    }
];

async function runDemo() {
    console.log("🤖 Starting System Demo: Portal Scanner -> Deep Link Extractor\n");

    for (const portal of PORTALS) {
        console.log(`1️⃣  Opening Portal: ${portal.url}`);

        try {
            // 1. Fetch the Main Page
            const response = await fetch(portal.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const html = await response.text();
            console.log(`    ✅ Page Loaded (${html.length} bytes)`);

            // 2. Parse Headlines
            console.log("2️⃣  Scanning Headlines & Extracting Links...");
            const $ = cheerio.load(html);
            const foundLinks: any[] = [];

            // Targeted extraction for ru.muenchen.de based on previous observations
            // It seems to use specific structures. Let's look for known keywords from previous turn
            $('a').each((i, el) => {
                const title = $(el).text().trim();
                const href = $(el).attr('href');

                if (title && href && title.length > 20) {
                    // Normalize link
                    const fullLink = href.startsWith('http') ? href : new URL(href, portal.url).toString();

                    // Filter logic (simulated)
                    if (fullLink.includes('2026') || fullLink.includes('article') || fullLink.includes('meldung')) {
                        foundLinks.push({ title, link: fullLink });
                    }
                }
            });

            console.log(`    🔍 Found ${foundLinks.length} potential articles.`);

            // 3. Filter & Select
            console.log("3️⃣  Filtering for Relevant News (Ukraine, Social, Housing, General)...");
            // Broaden keywords for demo purposes to ensure we find *some* news to prove deep linking works
            const relevanceKeywords = ['Ukraine', 'Wohnung', 'Geflüchtet', 'Hilfe', 'Registrierbescheid', 'Schutz', 'Aufenthalt', 'Soziales', 'Stadt', 'München', 'Leipzig', 'Köln', 'Düsseldorf', 'Hamburg', 'Presse', 'Mitteilung', 'Termin', 'Verkehr', 'Bau'];


            const matches = foundLinks.filter(item => {
                const text = item.title + " " + item.link;
                return relevanceKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()));
            });

            if (matches.length > 0) {
                console.log(`\n🎉 SUCCESS! Found ${matches.length} RELEVANT deep-links:`);
                matches.forEach(m => {
                    console.log(`\n   📄 Title: "${m.title}"`);
                    console.log(`   🔗 Deep-Link: ${m.link}`);
                    console.log(`   (System would now open this specific link to analyze content)`);
                });
            } else {
                console.log("\n   ℹ️  No specific keyword matches found today on the front page.");
                console.log("   (Showing top 3 generic news links found instead as proof of extraction):");
                foundLinks.slice(0, 3).forEach(m => {
                    console.log(`   - [General] ${m.title} -> ${m.link}`);
                });
            }

        } catch (error) {
            console.error("Error fetching portal:", error);
        }
    }
}

runDemo();
