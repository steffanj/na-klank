-- ─────────────────────────────────────────
-- SECURITY DEFINER helpers
-- These bypass RLS so policies can check membership without recursing.
-- ─────────────────────────────────────────

create or replace function public.auth_is_space_director(space_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memorial_spaces ms
    where ms.id = space_id
      and (
        ms.created_by = auth.uid()
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = ms.organization_id
            and om.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.auth_is_accepted_member(space_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memorial_space_members
    where memorial_space_id = space_id
      and user_id = auth.uid()
      and accepted_at is not null
  );
$$;

create or replace function public.auth_is_primary_contact(space_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memorial_space_members
    where memorial_space_id = space_id
      and user_id = auth.uid()
      and role = 'primary_contact'
      and accepted_at is not null
  );
$$;

-- ─────────────────────────────────────────
-- Rewrite recursive policies
-- ─────────────────────────────────────────

-- memorial_spaces
drop policy if exists "Family members can view their space" on public.memorial_spaces;
drop policy if exists "Directors can view spaces they created or manage" on public.memorial_spaces;

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
  on public.memorial_spaces for select
  using (public.auth_is_accepted_member(id));

-- memorial_space_members
drop policy if exists "Directors can manage members of their spaces" on public.memorial_space_members;
drop policy if exists "Primary contacts can manage members of their space" on public.memorial_space_members;
drop policy if exists "Users can view their own membership" on public.memorial_space_members;

create policy "Directors can manage members of their spaces"
  on public.memorial_space_members for all
  using (public.auth_is_space_director(memorial_space_id));

create policy "Primary contacts can manage members of their space"
  on public.memorial_space_members for all
  using (public.auth_is_primary_contact(memorial_space_id));

create policy "Users can view their own membership"
  on public.memorial_space_members for select
  using (user_id = auth.uid());

-- Rewrite all other policies that reference memorial_space_members directly
-- to use the helper functions instead.

-- collective_eulogy_tokens
drop policy if exists "Space members can view tokens" on public.collective_eulogy_tokens;
drop policy if exists "Directors can manage tokens" on public.collective_eulogy_tokens;

create policy "Space members can view tokens"
  on public.collective_eulogy_tokens for select
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

create policy "Directors can manage tokens"
  on public.collective_eulogy_tokens for all
  using (public.auth_is_space_director(memorial_space_id));

-- eulogies
drop policy if exists "Space members can view eulogies" on public.eulogies;

create policy "Space members can view eulogies"
  on public.eulogies for select
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

-- eulogy_intakes
drop policy if exists "Space members can view intakes" on public.eulogy_intakes;

create policy "Space members can view intakes"
  on public.eulogy_intakes for select using (
    exists (
      select 1 from public.eulogies e
      where e.id = eulogy_intakes.eulogy_id
        and public.auth_is_accepted_member(e.memorial_space_id)
    )
  );

-- eulogy_versions
drop policy if exists "Space members can view eulogy versions" on public.eulogy_versions;

create policy "Space members can view eulogy versions"
  on public.eulogy_versions for select using (
    exists (
      select 1 from public.eulogies e
      where e.id = eulogy_versions.eulogy_id
        and (
          public.auth_is_accepted_member(e.memorial_space_id)
          or public.auth_is_space_director(e.memorial_space_id)
        )
    )
  );

-- collective_eulogies
drop policy if exists "Space members can view collective eulogy" on public.collective_eulogies;
drop policy if exists "Primary contacts and directors can manage collective eulogy" on public.collective_eulogies;

create policy "Space members can view collective eulogy"
  on public.collective_eulogies for select
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

create policy "Primary contacts and directors can manage collective eulogy"
  on public.collective_eulogies for all
  using (
    public.auth_is_primary_contact(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

-- collective_eulogy_contributions
drop policy if exists "Space members can view contributions" on public.collective_eulogy_contributions;

create policy "Space members can view contributions"
  on public.collective_eulogy_contributions for select
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

-- collective_eulogy_versions
drop policy if exists "Space members can view collective versions" on public.collective_eulogy_versions;

create policy "Space members can view collective versions"
  on public.collective_eulogy_versions for select
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

-- photo_artworks
drop policy if exists "Space members can manage photo artworks" on public.photo_artworks;

create policy "Space members can manage photo artworks"
  on public.photo_artworks for all
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

-- cloned_voices
drop policy if exists "Space members can view cloned voices" on public.cloned_voices;
drop policy if exists "Space members can insert cloned voices" on public.cloned_voices;

create policy "Space members can view cloned voices"
  on public.cloned_voices for select
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

create policy "Space members can insert cloned voices"
  on public.cloned_voices for insert with check (
    uploaded_by = auth.uid()
    and public.auth_is_accepted_member(memorial_space_id)
  );

-- voice_recordings
drop policy if exists "Space members can manage voice recordings" on public.voice_recordings;

create policy "Space members can manage voice recordings"
  on public.voice_recordings for all
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

-- generation_jobs
drop policy if exists "Space members can view their generation jobs" on public.generation_jobs;
drop policy if exists "Space members can insert generation jobs" on public.generation_jobs;

create policy "Space members can view their generation jobs"
  on public.generation_jobs for select
  using (
    public.auth_is_accepted_member(memorial_space_id)
    or public.auth_is_space_director(memorial_space_id)
  );

create policy "Space members can insert generation jobs"
  on public.generation_jobs for insert with check (
    triggered_by_user_id = auth.uid()
    and (
      public.auth_is_accepted_member(memorial_space_id)
      or public.auth_is_space_director(memorial_space_id)
    )
  );
