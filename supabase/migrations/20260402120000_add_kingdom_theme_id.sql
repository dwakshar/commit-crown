alter table public.kingdoms
  add column if not exists theme_id uuid references public.shop_items(id);
