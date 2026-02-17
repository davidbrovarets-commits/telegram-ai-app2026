BEGIN;
-- 1. Detect duplicates BEFORE creating index
DO $$
DECLARE dup_count integer;
BEGIN
SELECT COUNT(*) INTO dup_count
FROM (
        SELECT link
        FROM public.news
        GROUP BY link
        HAVING COUNT(*) > 1
    ) t;
IF dup_count > 0 THEN RAISE EXCEPTION 'Duplicate links detected in public.news. Resolve before applying UNIQUE index.';
END IF;
END $$;
-- 2. Create unique index safely
CREATE UNIQUE INDEX IF NOT EXISTS news_link_unique ON public.news (link);
COMMIT;