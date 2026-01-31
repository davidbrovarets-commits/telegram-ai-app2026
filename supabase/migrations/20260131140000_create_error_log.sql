-- Table for logging client-side errors
create table if not exists public.system_errors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  error_code text not null, -- e.g. 'STATE_CORRUPTION', 'FEED_EMPTY'
  error_message text,
  context jsonb default '{}'::jsonb, -- e.g. { device: 'iphone', state_clip: ... }
  status text check (status in ('OPEN', 'FIXED', 'IGNORED')) default 'OPEN',
  created_at timestamptz default now()
);

-- RLS: Users can INSERT errors, but not read them (Privacy)
alter table public.system_errors enable row level security;

create policy "Users can report errors"
  on public.system_errors for insert
  with check (true); -- Public insert allowed (or restrict to auth users)

-- Only admins/service role can read/update (No policy for select/update = strictly service role)
