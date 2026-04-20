alter table collective_eulogy_versions
  add column if not exists attribution_audit_raw text;

alter table collective_eulogies
  drop constraint collective_eulogies_status_check;

alter table collective_eulogies
  add constraint collective_eulogies_status_check
  check (status in ('not_started', 'generating', 'ready', 'finalized'));
