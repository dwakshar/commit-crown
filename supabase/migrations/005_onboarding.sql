alter table public.profiles
  add column if not exists onboarding_done boolean not null default false;

alter table public.profiles
  add column if not exists kingdom_name_set boolean not null default false;
