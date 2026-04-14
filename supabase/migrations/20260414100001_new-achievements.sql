-- Seed new achievements added in the production mechanics overhaul.
-- Existing rows are left untouched (insert ignore on conflict).

insert into public.achievements (key, name, description, category)
values
  ('consistent',    'Consistent',       'Maintain a 14-day active commit streak.',                        'coding'),
  ('contributor',   'Contributor',      'Reach 500 total commits.',                                       'coding'),
  ('maximalist',    'Maximalist',       'Have at least 10 buildings standing in your kingdom.',           'kingdom'),
  ('treasurer',     'Treasurer',        'Accumulate 5 000 gold in your kingdom treasury.',                'kingdom'),
  ('warlord',       'Warlord',          'Win 25 raids.',                                                  'raid'),
  ('networked',     'Networked',        'Reach 50 GitHub followers.',                                     'social')
on conflict (key) do nothing;
