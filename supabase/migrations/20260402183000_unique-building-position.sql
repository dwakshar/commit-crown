create unique index if not exists buildings_kingdom_position_unique
  on public.buildings (kingdom_id, position_x, position_y);
