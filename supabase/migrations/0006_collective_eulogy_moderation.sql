-- Add moderation status to contributions
alter table public.collective_eulogy_contributions
  add column moderation_status text not null default 'pending'
  check (moderation_status in ('pending', 'accepted', 'rejected'));

-- Allow primary contacts and directors to moderate contributions
create policy "Primary contacts and directors can moderate contributions"
  on public.collective_eulogy_contributions for update
  using (
    public.auth_is_primary_contact(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

-- Allow primary contacts and directors to insert collective eulogy versions (manual edits)
create policy "Primary contacts and directors can insert collective versions"
  on public.collective_eulogy_versions for insert
  with check (
    public.auth_is_primary_contact(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );
