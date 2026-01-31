-- Create a table to store user news state (deleted, archived, preferences)
create table if not exists public.user_news_states (
  user_id uuid references auth.users(id) on delete cascade primary key,
  state jsonb not null default '{}'::jsonb,
  last_updated timestamptz default now()
);

-- Enable RLS
alter table public.user_news_states enable row level security;

-- Policies
create policy "Users can view their own state"
  on public.user_news_states for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own state"
  on public.user_news_states for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own state"
  on public.user_news_states for update
  using (auth.uid() = user_id);
