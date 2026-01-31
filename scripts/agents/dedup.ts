/**
 * Agent 4: Deduplication
 * Purpose: Detect duplicate/similar articles to prevent content repetition
 */

/**
 * Calculate Jaccard similarity between two strings
 * Enhanced for German compound words (substring matching)
 */
function jaccardSimilarity(str1: string, str2: string): number {
    const tokens1 = str1.toLowerCase().split(/\s+/).filter(t => t.length > 2); // Ignore tiny words
    const tokens2 = str2.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    // Soft Intersection: Count if token A is substring of token B or vice versa
    let intersectionCount = 0;

    // We iterate over the smaller set for performance
    const smallerSet = set1.size < set2.size ? set1 : set2;
    const largerSet = set1.size < set2.size ? set2 : set1;

    for (const t1 of smallerSet) {
        let matchFound = false;
        if (largerSet.has(t1)) {
            matchFound = true;
        } else {
            // Check for substring matches (compound words)
            for (const t2 of largerSet) {
                if (t1.includes(t2) || t2.includes(t1)) {
                    matchFound = true;
                    break;
                }
            }
        }
        if (matchFound) intersectionCount++;
    }

    const unionSize = set1.size + set2.size - intersectionCount;
    return unionSize === 0 ? 0 : intersectionCount / unionSize;
}

/**
 * Normalize title for comparison (remove common prefixes, lowercase, trim)
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/^(aktuell|breaking|eilmeldung|update|neu):\s*/i, '')
        .replace(/[^\w\s]/g, '')
        .trim();
}

export interface DedupResult {
    isDuplicate: boolean;
    similarity: number;
    matchedTitle?: string;
    matchedId?: number;
}

/**
 * Check if a title is a duplicate of existing titles
 * @param newTitle The new article title to check
 * @param existingItems Array of existing articles with id and title
 * @param threshold Similarity threshold (default 0.7 = 70%)
 */
export function findDuplicate(
    newTitle: string,
    existingItems: Array<{ id: number; title: string }>,
    threshold: number = 0.6
): DedupResult {
    const normalizedNew = normalizeTitle(newTitle);

    for (const item of existingItems) {
        const normalizedExisting = normalizeTitle(item.title);
        const similarity = jaccardSimilarity(normalizedNew, normalizedExisting);

        if (similarity >= threshold) {
            return {
                isDuplicate: true,
                similarity,
                matchedTitle: item.title,
                matchedId: item.id
            };
        }
    }

    return {
        isDuplicate: false,
        similarity: 0
    };
}

/**
 * Batch deduplication: find all duplicates in a list
 * @param items Array of items with title
 * @param threshold Similarity threshold
 * @returns Map of cluster IDs to item indices
 */
export function clusterByDuplication(
    items: Array<{ title: string }>,
    threshold: number = 0.7
): Map<string, number[]> {
    const clusters = new Map<string, number[]>();
    const assigned = new Set<number>();
    let clusterCounter = 0;

    for (let i = 0; i < items.length; i++) {
        if (assigned.has(i)) continue;

        const clusterId = `cluster_${clusterCounter++}`;
        clusters.set(clusterId, [i]);
        assigned.add(i);

        const normalizedI = normalizeTitle(items[i].title);

        for (let j = i + 1; j < items.length; j++) {
            if (assigned.has(j)) continue;

            const normalizedJ = normalizeTitle(items[j].title);
            const similarity = jaccardSimilarity(normalizedI, normalizedJ);

            if (similarity >= threshold) {
                clusters.get(clusterId)!.push(j);
                assigned.add(j);
            }
        }
    }

    return clusters;
}
