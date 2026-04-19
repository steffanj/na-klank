-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ═════════════════════════════════════════
-- TABLES
-- ═════════════════════════════════════════

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ORGANIZATION MEMBERS
-- ─────────────────────────────────────────
create table public.organization_members (
  user_id         uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role            text not null default 'director',
  created_at      timestamptz not null default now(),
  primary key (user_id, organization_id)
);

-- ─────────────────────────────────────────
-- MEMORIAL SPACES
-- ─────────────────────────────────────────
create table public.memorial_spaces (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid references public.organizations(id) on delete set null,
  deceased_first_name   text not null,
  deceased_nickname     text,
  deceased_last_name    text not null,
  deceased_age          int,
  deceased_profession   text,
  funeral_date          date,
  created_by            uuid not null references auth.users(id),
  created_at            timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- MEMORIAL SPACE MEMBERS
-- ─────────────────────────────────────────
create table public.memorial_space_members (
  id                uuid primary key default gen_random_uuid(),
  memorial_space_id uuid not null references public.memorial_spaces(id) on delete cascade,
  user_id           uuid references auth.users(id) on delete cascade,
  invited_email     text not null,
  role              text not null check (role in ('primary_contact', 'family_member')),
  invited_by        uuid references auth.users(id),
  invited_at        timestamptz not null default now(),
  accepted_at       timestamptz
);

create index on public.memorial_space_members (memorial_space_id);
create index on public.memorial_space_members (user_id);
create index on public.memorial_space_members (invited_email);

-- ─────────────────────────────────────────
-- COLLECTIVE EULOGY TOKENS
-- ─────────────────────────────────────────
create table public.collective_eulogy_tokens (
  id                uuid primary key default gen_random_uuid(),
  memorial_space_id uuid not null references public.memorial_spaces(id) on delete cascade,
  token             text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at        timestamptz not null default now(),
  revoked_at        timestamptz
);

-- ─────────────────────────────────────────
-- EULOGIES
-- ─────────────────────────────────────────
create table public.eulogies (
  id                   uuid primary key default gen_random_uuid(),
  memorial_space_id    uuid not null references public.memorial_spaces(id) on delete cascade,
  author_user_id       uuid not null references auth.users(id),
  status               text not null default 'intake_in_progress'
                         check (status in ('intake_in_progress','generating','ready','finalized')),
  current_version_id   uuid, -- FK added after eulogy_versions
  opt_in_to_collective boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index on public.eulogies (memorial_space_id);
create index on public.eulogies (author_user_id);

-- ─────────────────────────────────────────
-- EULOGY INTAKES
-- ─────────────────────────────────────────
create table public.eulogy_intakes (
  eulogy_id    uuid primary key references public.eulogies(id) on delete cascade,
  answers_json jsonb not null default '{}',
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- EULOGY VERSIONS
-- ─────────────────────────────────────────
create table public.eulogy_versions (
  id                uuid primary key default gen_random_uuid(),
  eulogy_id         uuid not null references public.eulogies(id) on delete cascade,
  version_number    int not null,
  content           text not null,
  generation_source text not null check (generation_source in ('initial','regenerated','manual_edit')),
  user_edits_diff   text,
  created_at        timestamptz not null default now(),
  unique (eulogy_id, version_number)
);

create index on public.eulogy_versions (eulogy_id);

-- Back-reference from eulogies to current version (deferred to allow mutual FK)
alter table public.eulogies
  add constraint fk_eulogies_current_version
  foreign key (current_version_id) references public.eulogy_versions(id) deferrable initially deferred;

-- ─────────────────────────────────────────
-- COLLECTIVE EULOGIES
-- ─────────────────────────────────────────
create table public.collective_eulogies (
  memorial_space_id  uuid primary key references public.memorial_spaces(id) on delete cascade,
  status             text not null default 'not_started'
                       check (status in ('not_started','generating','ready')),
  current_version_id uuid, -- FK added after collective_eulogy_versions
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- COLLECTIVE EULOGY CONTRIBUTIONS
-- ─────────────────────────────────────────
create table public.collective_eulogy_contributions (
  id                       uuid primary key default gen_random_uuid(),
  memorial_space_id        uuid not null references public.memorial_spaces(id) on delete cascade,
  contributor_name         text not null,
  contributor_email        text,
  relationship_to_deceased text,
  answers_json             jsonb not null default '{}',
  source                   text not null default 'contributor_link'
                             check (source in ('contributor_link','derived_from_eulogy')),
  submitted_at             timestamptz not null default now()
);

create index on public.collective_eulogy_contributions (memorial_space_id);

-- ─────────────────────────────────────────
-- COLLECTIVE EULOGY VERSIONS
-- ─────────────────────────────────────────
create table public.collective_eulogy_versions (
  id                   uuid primary key default gen_random_uuid(),
  memorial_space_id    uuid not null references public.memorial_spaces(id) on delete cascade,
  version_number       int not null,
  content              text not null,
  generated_at         timestamptz not null default now(),
  generated_by_user_id uuid references auth.users(id),
  unique (memorial_space_id, version_number)
);

alter table public.collective_eulogies
  add constraint fk_collective_current_version
  foreign key (current_version_id) references public.collective_eulogy_versions(id) deferrable initially deferred;

-- ─────────────────────────────────────────
-- PHOTO ARTWORKS
-- ─────────────────────────────────────────
create table public.photo_artworks (
  id                      uuid primary key default gen_random_uuid(),
  memorial_space_id       uuid not null references public.memorial_spaces(id) on delete cascade,
  uploaded_by             uuid not null references auth.users(id),
  original_storage_path   text not null,
  category                text not null check (category in ('restoration','artistic')),
  style                   text not null,
  result_storage_path     text,
  replicate_model_version text,
  status                  text not null default 'pending'
                            check (status in ('pending','processing','done','failed')),
  created_at              timestamptz not null default now()
);

create index on public.photo_artworks (memorial_space_id);

-- ─────────────────────────────────────────
-- CLONED VOICES
-- ─────────────────────────────────────────
create table public.cloned_voices (
  id                  uuid primary key default gen_random_uuid(),
  memorial_space_id   uuid not null references public.memorial_spaces(id) on delete cascade,
  uploaded_by         uuid not null references auth.users(id),
  display_name        text not null,
  elevenlabs_voice_id text not null,
  sample_storage_path text not null,
  created_at          timestamptz not null default now()
);

create index on public.cloned_voices (memorial_space_id);

-- ─────────────────────────────────────────
-- VOICE RECORDINGS
-- ─────────────────────────────────────────
create table public.voice_recordings (
  id                       uuid primary key default gen_random_uuid(),
  memorial_space_id        uuid not null references public.memorial_spaces(id) on delete cascade,
  created_by               uuid not null references auth.users(id),
  source_type              text not null check (source_type in ('eulogy','collective_eulogy','custom_text')),
  source_eulogy_version_id uuid references public.eulogy_versions(id),
  input_text               text not null,
  voice_id                 text not null,
  voice_source             text not null check (voice_source in ('preset','cloned')),
  result_storage_path      text,
  status                   text not null default 'pending'
                             check (status in ('pending','processing','done','failed')),
  created_at               timestamptz not null default now()
);

create index on public.voice_recordings (memorial_space_id);

-- ─────────────────────────────────────────
-- GENERATION JOBS
-- ─────────────────────────────────────────
create table public.generation_jobs (
  id                   uuid primary key default gen_random_uuid(),
  memorial_space_id    uuid not null references public.memorial_spaces(id) on delete cascade,
  job_type             text not null check (job_type in (
                         'eulogy_generate','eulogy_regenerate',
                         'collective_synthesize',
                         'photo_generate',
                         'voice_generate','voice_preview'
                       )),
  target_id            uuid,
  status               text not null default 'pending'
                         check (status in ('pending','processing','done','failed')),
  error_message        text,
  triggered_by_user_id uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  completed_at         timestamptz
);

create index on public.generation_jobs (memorial_space_id);
create index on public.generation_jobs (status);

-- Enable realtime on generation_jobs
alter publication supabase_realtime add table public.generation_jobs;


-- ═════════════════════════════════════════
-- ROW LEVEL SECURITY
-- All policies defined here, after all tables exist.
-- ═════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.memorial_spaces enable row level security;
alter table public.memorial_space_members enable row level security;
alter table public.collective_eulogy_tokens enable row level security;
alter table public.eulogies enable row level security;
alter table public.eulogy_intakes enable row level security;
alter table public.eulogy_versions enable row level security;
alter table public.collective_eulogies enable row level security;
alter table public.collective_eulogy_contributions enable row level security;
alter table public.collective_eulogy_versions enable row level security;
alter table public.photo_artworks enable row level security;
alter table public.cloned_voices enable row level security;
alter table public.voice_recordings enable row level security;
alter table public.generation_jobs enable row level security;

-- profiles
create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- organizations
create policy "Org members can view their organization"
  on public.organizations for select using (
    exists (
      select 1 from public.organization_members
      where organization_id = organizations.id and user_id = auth.uid()
    )
  );

-- organization_members
create policy "Members can view their own membership"
  on public.organization_members for select using (user_id = auth.uid());

-- memorial_spaces
create policy "Directors can view spaces they created or manage"
  on public.memorial_spaces for select using (
    created_by = auth.uid()
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = memorial_spaces.organization_id
        and om.user_id = auth.uid()
    )
  );
create policy "Family members can view their space"
  on public.memorial_spaces for select using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = memorial_spaces.id
        and msm.user_id = auth.uid()
        and msm.accepted_at is not null
    )
  );
create policy "Directors can insert spaces"
  on public.memorial_spaces for insert with check (created_by = auth.uid());
create policy "Directors can update their spaces"
  on public.memorial_spaces for update using (created_by = auth.uid());

-- memorial_space_members
create policy "Directors can manage members of their spaces"
  on public.memorial_space_members for all using (
    exists (
      select 1 from public.memorial_spaces ms
      where ms.id = memorial_space_members.memorial_space_id
        and (
          ms.created_by = auth.uid()
          or exists (
            select 1 from public.organization_members om
            where om.organization_id = ms.organization_id and om.user_id = auth.uid()
          )
        )
    )
  );
create policy "Primary contacts can manage members of their space"
  on public.memorial_space_members for all using (
    exists (
      select 1 from public.memorial_space_members self
      where self.memorial_space_id = memorial_space_members.memorial_space_id
        and self.user_id = auth.uid()
        and self.role = 'primary_contact'
        and self.accepted_at is not null
    )
  );
create policy "Users can view their own membership"
  on public.memorial_space_members for select using (user_id = auth.uid());

-- collective_eulogy_tokens
create policy "Space members can view tokens"
  on public.collective_eulogy_tokens for select using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = collective_eulogy_tokens.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = collective_eulogy_tokens.memorial_space_id and om.user_id = auth.uid()
    )
  );
create policy "Directors can manage tokens"
  on public.collective_eulogy_tokens for all using (
    exists (
      select 1 from public.memorial_spaces ms
      where ms.id = collective_eulogy_tokens.memorial_space_id and ms.created_by = auth.uid()
    )
  );

-- eulogies
create policy "Space members can view eulogies"
  on public.eulogies for select using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = eulogies.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = eulogies.memorial_space_id and om.user_id = auth.uid()
    )
  );
create policy "Authors can insert their eulogy"
  on public.eulogies for insert with check (author_user_id = auth.uid());
create policy "Authors can update their eulogy"
  on public.eulogies for update using (author_user_id = auth.uid());

-- eulogy_intakes
create policy "Author can manage their intake"
  on public.eulogy_intakes for all using (
    exists (
      select 1 from public.eulogies e
      where e.id = eulogy_intakes.eulogy_id and e.author_user_id = auth.uid()
    )
  );
create policy "Space members can view intakes"
  on public.eulogy_intakes for select using (
    exists (
      select 1 from public.eulogies e
      join public.memorial_space_members msm on msm.memorial_space_id = e.memorial_space_id
      where e.id = eulogy_intakes.eulogy_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
  );

-- eulogy_versions
create policy "Space members can view eulogy versions"
  on public.eulogy_versions for select using (
    exists (
      select 1 from public.eulogies e
      join public.memorial_space_members msm on msm.memorial_space_id = e.memorial_space_id
      where e.id = eulogy_versions.eulogy_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.eulogies e
      join public.memorial_spaces ms on ms.id = e.memorial_space_id
      join public.organization_members om on om.organization_id = ms.organization_id
      where e.id = eulogy_versions.eulogy_id and om.user_id = auth.uid()
    )
  );
create policy "Authors can insert versions for their eulogy"
  on public.eulogy_versions for insert with check (
    exists (
      select 1 from public.eulogies e
      where e.id = eulogy_versions.eulogy_id and e.author_user_id = auth.uid()
    )
  );

-- collective_eulogies
create policy "Space members can view collective eulogy"
  on public.collective_eulogies for select using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = collective_eulogies.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = collective_eulogies.memorial_space_id and om.user_id = auth.uid()
    )
  );
create policy "Primary contacts and directors can manage collective eulogy"
  on public.collective_eulogies for all using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = collective_eulogies.memorial_space_id
        and msm.user_id = auth.uid() and msm.role = 'primary_contact'
        and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = collective_eulogies.memorial_space_id and om.user_id = auth.uid()
    )
  );

-- collective_eulogy_contributions
create policy "Space members can view contributions"
  on public.collective_eulogy_contributions for select using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = collective_eulogy_contributions.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = collective_eulogy_contributions.memorial_space_id and om.user_id = auth.uid()
    )
  );

-- collective_eulogy_versions
create policy "Space members can view collective versions"
  on public.collective_eulogy_versions for select using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = collective_eulogy_versions.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = collective_eulogy_versions.memorial_space_id and om.user_id = auth.uid()
    )
  );

-- photo_artworks
create policy "Space members can manage photo artworks"
  on public.photo_artworks for all using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = photo_artworks.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = photo_artworks.memorial_space_id and om.user_id = auth.uid()
    )
  );

-- cloned_voices
create policy "Space members can view cloned voices"
  on public.cloned_voices for select using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = cloned_voices.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = cloned_voices.memorial_space_id and om.user_id = auth.uid()
    )
  );
create policy "Space members can insert cloned voices"
  on public.cloned_voices for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = cloned_voices.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
  );

-- voice_recordings
create policy "Space members can manage voice recordings"
  on public.voice_recordings for all using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = voice_recordings.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = voice_recordings.memorial_space_id and om.user_id = auth.uid()
    )
  );

-- generation_jobs
create policy "Space members can view their generation jobs"
  on public.generation_jobs for select using (
    exists (
      select 1 from public.memorial_space_members msm
      where msm.memorial_space_id = generation_jobs.memorial_space_id
        and msm.user_id = auth.uid() and msm.accepted_at is not null
    )
    or exists (
      select 1 from public.memorial_spaces ms
      join public.organization_members om on om.organization_id = ms.organization_id
      where ms.id = generation_jobs.memorial_space_id and om.user_id = auth.uid()
    )
  );
create policy "Space members can insert generation jobs"
  on public.generation_jobs for insert with check (
    triggered_by_user_id = auth.uid()
    and (
      exists (
        select 1 from public.memorial_space_members msm
        where msm.memorial_space_id = generation_jobs.memorial_space_id
          and msm.user_id = auth.uid() and msm.accepted_at is not null
      )
      or exists (
        select 1 from public.memorial_spaces ms
        join public.organization_members om on om.organization_id = ms.organization_id
        where ms.id = generation_jobs.memorial_space_id and om.user_id = auth.uid()
      )
    )
  );

-- ═════════════════════════════════════════
-- TRIGGERS
-- ═════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
