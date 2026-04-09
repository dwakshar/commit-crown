-- Ensure message column exists in notifications table

alter table public.notifications
add column if not exists message text not null default 'Notification';

-- Update default to allow proper inserts going forward
alter table public.notifications
alter column message drop default;

-- Also ensure other columns exist
alter table public.notifications
add column if not exists data jsonb default '{}'::jsonb;

alter table public.notifications
add column if not exists read_at timestamptz;
