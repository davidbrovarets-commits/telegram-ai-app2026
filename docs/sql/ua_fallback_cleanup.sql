BEGIN;
-- Strip prefix from title
UPDATE public.news
SET title = regexp_replace(title, '^\[UA Fallback\]\s*', '')
WHERE title LIKE '[UA Fallback]%';
-- Strip prefix from uk_summary  
UPDATE public.news
SET uk_summary = regexp_replace(uk_summary, '^\[UA Fallback\]\s*', '')
WHERE uk_summary LIKE '[UA Fallback]%';
-- Strip prefix from content (or uk_content if applicable)
UPDATE public.news
SET content = regexp_replace(content, '^\[UA Fallback(?: Content)?\]\s*', '')
WHERE content LIKE '[UA Fallback]%';
-- Check remaining prefixed rows
SELECT count(*) AS remaining_prefixed
FROM public.news
WHERE title LIKE '[UA Fallback]%'
    OR uk_summary LIKE '[UA Fallback]%'
    OR content LIKE '[UA Fallback]%';
COMMIT;