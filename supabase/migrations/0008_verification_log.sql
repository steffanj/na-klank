alter table collective_eulogy_versions
  add column if not exists verification_log text;
