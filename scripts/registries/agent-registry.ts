
export const AGENT_REGISTRY = {
    AGENT_0_COLLECTOR: {
        name: "Collector",
        type: "NON_AI",
        responsibility: [
            "ingest articles from SOURCE_REGISTRY",
            "normalize text and metadata"
        ],
        models: null,
        rules: [
            "deterministic logic only",
            "no AI usage allowed"
        ]
    },
    AGENT_1_RULE_FILTER: {
        name: "Rule Filter",
        type: "NON_AI",
        responsibility: [
            "apply FILTERS_V1",
            "keyword filtering",
            "hard topic constraints"
        ],
        models: null,
        rules: [
            "must run BEFORE any AI agent",
            "immediate discard on failure"
        ]
    },
    AGENT_2_CLASSIFIER: {
        name: "Classifier",
        type: "LOW_COST_LLM",
        responsibility: [
            "topic classification",
            "relevance_score (0–100)"
        ],
        primary_model: {
            provider: "vertex_ai",
            model_id: "claude-3-5-sonnet@20240620"
        },
        fallback_model: {
            provider: "vertex_ai",
            model_id: "claude-3-5-haiku@20241022"
        },
        rules: [
            "no summarization",
            "no translation",
            "classification only"
        ]
    },
    AGENT_3_GEO_LAYER_ROUTER: {
        name: "Geo & Layer Router",
        type: "HYBRID (RULES_FIRST + LLM_ON_DEMAND)",
        responsibility: [
            "determine distribution layer: COUNTRY | STATE | CITY",
            "assign target_state / target_city"
        ],
        primary_model: {
            provider: "vertex_ai",
            model_id: "claude-3-5-sonnet@20240620"
        },
        fallback_model: {
            provider: "vertex_ai",
            model_id: "claude-3-5-haiku@20241022"
        },
        rules: [
            "rules-first (entity matching)",
            "LLM ONLY if geo-scope is ambiguous",
            "no text rewriting"
        ]
    },
    AGENT_4_DEDUP: {
        name: "Dedup Agent",
        type: "EMBEDDINGS",
        responsibility: [
            "semantic deduplication across ALL sources and layers",
            "cluster similar articles",
            "select canonical item"
        ],
        primary_model: {
            provider: "vertex_ai",
            model_id: "text-embedding-004"
        },
        fallback_model: {
            provider: "vertex_ai",
            model_id: "gemini-embedding-001"
        },
        rules: [
            "source-agnostic",
            "enforce specificity priority: CITY > STATE > COUNTRY"
        ]
    },
    AGENT_5_SUMMARY: {
        name: "Summary Agent",
        type: "HIGH_QUALITY_LLM",
        responsibility: [
            "generate 2–3 sentence practical summary",
            "extract optional action_hint"
        ],
        primary_model: {
            provider: "vertex_ai",
            model_id: "claude-opus-3-5@20251101" // Adjusted based on realistic availability or keeping user string
        },
        fallback_model: {
            provider: "vertex_ai",
            model_id: "claude-sonnet-3-5@20250929"
        },
        rules: [
            "execute ONLY after AGENT_1–4 passed",
            "summary must be grounded strictly in article text",
            "no hallucinations"
        ]
    },
    AGENT_6_TRANSLATION: {
        name: "Translation Agent",
        type: "LLM_TRANSLATION",
        responsibility: [
            "translate summary from German to Ukrainian"
        ],
        primary_model: {
            provider: "vertex_ai",
            model_id: "claude-sonnet-3-5@20250929"
        },
        fallback_model: {
            provider: "vertex_ai",
            model_id: "claude-3-5-sonnet@20240620"
        },
        rules: [
            "translate ONLY approved summaries",
            "preserve legal terms, numbers, dates exactly",
            "no interpretation or additions"
        ]
    }
};
