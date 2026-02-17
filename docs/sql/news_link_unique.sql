BEGIN;
-- 1. Delete older duplicates (keep row with MAX id per link)
DELETE FROM public.news
WHERE id NOT IN (
        SELECT MAX(id)
        FROM public.news
        GROUP BY link
    );
-- 2. Verify zero duplicates remain
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
IF dup_count > 0 THEN RAISE EXCEPTION 'Duplicates still exist after cleanup: % groups',
dup_count;
END IF;
END $$;
-- 3. Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS news_link_unique ON public.news (link);
COMMIT;