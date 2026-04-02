create table if not exists public.github_oauth_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  updated_at timestamptz not null default now()
);

alter table public.github_oauth_tokens enable row level security;

drop policy if exists "Service role can manage github oauth tokens" on public.github_oauth_tokens;
create policy "Service role can manage github oauth tokens"
  on public.github_oauth_tokens
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
