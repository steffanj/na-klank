alter table public.photo_artworks
  add column if not exists error_message text;
