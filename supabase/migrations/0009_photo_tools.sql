-- Expand category constraint to include new tool types
alter table public.photo_artworks drop constraint photo_artworks_category_check;
alter table public.photo_artworks add constraint photo_artworks_category_check
  check (category in ('restoration', 'artistic', 'upscale', 'remove_background'));

-- Add upscale add-on toggle
alter table public.photo_artworks
  add column if not exists upscale boolean not null default false;

-- Add Replicate prediction id for status polling
alter table public.photo_artworks
  add column if not exists replicate_prediction_id text;

-- Create private photos storage bucket
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload to photos bucket (space access enforced server-side)
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.uid() is not null);

create policy "Authenticated users can read photos"
  on storage.objects for select
  using (bucket_id = 'photos' and auth.uid() is not null);

create policy "Authenticated users can delete photos"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.uid() is not null);
