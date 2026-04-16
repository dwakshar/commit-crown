-- Add missing gold snapshot columns to raids table.
-- execute_raid_transaction (production-mechanics migration) references these
-- columns, but the table was created before they were added to the schema.

alter table public.raids
  add column if not exists attacker_gold_after integer not null default 0,
  add column if not exists defender_gold_after integer not null default 0;
