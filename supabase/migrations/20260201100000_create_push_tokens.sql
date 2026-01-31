-- Create table for storing FCM push tokens
create table if not exists public.user_push_tokens (
  token text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  city text, -- The city they are subscribed to
  land text, -- The land they are subscribed to
  last_updated timestamptz default now()
);

-- Enable RLS
alter table public.user_push_tokens enable row level security;

-- Policies
create policy "Users can insert/update their own tokens"
  on public.user_push_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast lookup by city
create index if not exists idx_push_tokens_city on public.user_push_tokens(city);
create index if not exists idx_push_tokens_land on public.user_push_tokens(land);
