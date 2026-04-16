-- Drop the stale raids_result_check constraint (created before 002_raids.sql ran)
-- and replace it with the correct allowed values used by execute_raid_transaction.

alter table public.raids
  drop constraint if exists raids_result_check;

alter table public.raids
  add constraint raids_result_check
    check (result in ('attacker_win', 'defender_win'));
