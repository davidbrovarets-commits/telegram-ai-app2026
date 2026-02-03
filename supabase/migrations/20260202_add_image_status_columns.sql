-- Adds deterministic image pipeline state for news_items
-- Safe MVP upgrade: non-breaking defaults

ALTER TABLE public.news_items
  ADD COLUMN IF NOT EXISTS image_status text NOT NULL DEFAULT 'placeholder',
  ADD COLUMN IF NOT EXISTS image_error text,
  ADD COLUMN IF NOT EXISTS image_generation_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS image_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS image_prompt text;

-- Reference-first metadata (minimal, non-breaking)
ALTER TABLE public.news_items
  ADD COLUMN IF NOT EXISTS image_source_type text,
  ADD COLUMN IF NOT EXISTS image_source_url text,
  ADD COLUMN IF NOT EXISTS image_source_license text,
  ADD COLUMN IF NOT EXISTS image_source_attribution text;

-- Optional: normalize existing rows that already have a real image
UPDATE public.news_items
SET image_status = 'generated',
    image_generated_at = COALESCE(image_generated_at, now())
WHERE
  image_url IS NOT NULL
  AND image_url <> ''
  AND image_url NOT ILIKE '%placehold.co%'
  AND image_status = 'placeholder';

-- Index for banner job selection performance
CREATE INDEX IF NOT EXISTS idx_news_items_image_status_created_at
  ON public.news_items (image_status, created_at DESC);
