alter table public.memorial_spaces
  add column deceased_retired boolean not null default false;

alter table public.memorial_space_members
  add column invited_name text;
