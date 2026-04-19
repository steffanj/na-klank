-- Add role to profiles to distinguish directors from family members.
-- Directors may optionally belong to an organization (organization_id on
-- memorial_spaces is nullable). To enforce org membership in the future,
-- add a NOT NULL constraint to memorial_spaces.organization_id and ensure
-- every director has a row in organization_members.

alter table public.profiles
  add column role text not null default 'family'
  check (role in ('director', 'family'));

comment on column public.profiles.role is
  'director = funeral home staff who create/manage spaces; family = invited family member. '
  'To require directors to belong to an org: add NOT NULL to memorial_spaces.organization_id '
  'and enforce via organization_members.';

comment on column public.memorial_spaces.organization_id is
  'Nullable for now — directors can operate without a formal org in the MVP. '
  'To enforce: ALTER TABLE public.memorial_spaces ALTER COLUMN organization_id SET NOT NULL;';
