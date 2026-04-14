-- Enable raids for all existing users and change the default to true.
-- Previously raids_enabled defaulted to false with no UI/API to toggle it,
-- making PvP permanently inaccessible. Players can opt-out via the toggle in
-- the Kingdom HUD; the default is now opt-in (open for battle).

alter table public.profiles
  alter column raids_enabled set default true;

-- Backfill every existing profile — nobody could have explicitly disabled raids
-- because the toggle UI didn't exist until this release.
update public.profiles
set raids_enabled = true
where raids_enabled is null or raids_enabled = false;
