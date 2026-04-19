create table public.deleted_spaces_log (
  id                    uuid primary key default gen_random_uuid(),
  space_id              uuid not null,
  deceased_first_name   text not null,
  deceased_last_name    text not null,
  deceased_nickname     text,
  organization_id       uuid,
  deleted_by            uuid not null references auth.users(id),
  deleted_at            timestamptz not null default now()
);

alter table public.deleted_spaces_log enable row level security;

-- Only the deleting director and org members can view the log
create policy "Directors can view their deletion log"
  on public.deleted_spaces_log for select
  using (deleted_by = auth.uid());
