# Multi-Layer News Orchestrator Specification

**Version:** 1.0  
**Target Users:** Ukrainian Migrants in Germany  
**Layers:** Germany → Bundesland → City

---

## Distribution Layers

| Layer | Scope | Visibility |
|-------|-------|------------|
| L1 | COUNTRY (DE) | All users |
| L2 | BUNDESLAND | Users with matching `settings.land` |
| L3 | CITY | Users with matching `settings.city` |

---

## Topic Constraints (Hard Filter)

Include ONLY items affecting life in Germany for Ukrainian migrants:
- Aufenthalt / §24 / migration / refugees
- Jobcenter / Bürgergeld / social benefits
- Work / taxes / housing / integration
- Laws / regulations / Bundestag / Bundesregierung
- Germany/EU policies affecting Ukrainians

### Required Keywords (German)

```
Ukraine, Ukrainer, Flüchtlinge, Migration, Aufenthalt, §24,
Jobcenter, Bürgergeld, Sozialhilfe, Arbeit, Steuern, Miete,
Integration, Bundestag, Bundesregierung, Gesetz
```

---

## Agent Pipeline

| Agent | Type | Purpose |
|-------|------|---------|
| 0 | Non-AI | Collector: Ingest from SOURCE_REGISTRY |
| 1 | Non-AI | Rule Filter: FILTERS_V1 + keywords |
| 2 | Low-cost LLM | Classifier: topics[], relevance_score |
| 3 | Rules/LLM | Geo Router: CITY/STATE/COUNTRY |
| 4 | Embeddings | Dedup: cluster, canonical selection |
| 5 | High-quality LLM | Summary: 2-3 sentences, action_hint |
| 6 | Translation | German → Ukrainian |

---

## Data Contract

```typescript
interface NewsItem {
  raw: {
    title: string;
    text: string;
    url: string;
    source_id: string;
    published_at: string;
    language: 'de';
  };
  signals: {
    keyword_hits: string[];
    entities: string[];
  };
  classification: {
    topics: string[];
    relevance_score: number; // 0-100
  };
  routing: {
    layer: 'COUNTRY' | 'STATE' | 'CITY';
    target_state?: string;
    target_city?: string;
  };
  dedup: {
    cluster_id: string;
    canonical: boolean;
    specificity: number;
  };
  summary: {
    de_summary: string;
    uk_summary: string;
    action_hint?: string;
  };
  meta: {
    agent_versions: Record<string, string>;
    model_used: string;
    cost_estimate: number;
    timestamp: string;
  };
}
```

---

## Routing Rules

1. **Specificity Priority:** CITY > STATE > COUNTRY
2. **No Duplication:** Same news in multiple layers = keep most specific only
3. **Geo Matching:**
   - `scope: 'DE'` → All users
   - `scope: 'LAND'` → `user.land === news.land`
   - `scope: 'CITY'` → `user.city === news.city`

---

## Cost Control

1. Rules + embeddings run FIRST (cheap)
2. Translation runs ONLY for approved items
3. Batch translation calls
4. Per-agent cost limits enforced

---

## Stop Conditions

- FILTERS_V1 fail → **STOP**
- Dedup rejects → **SKIP** summary & translation
- Summary not approved → **DO NOT** translate

---

## Success Criteria

- [x] Correct 3-layer routing (implemented in FeedManager)
- [ ] Automatic support for new cities/sources
- [ ] Ukrainian-language output
- [ ] No duplication across layers
- [ ] Predictable AI cost
