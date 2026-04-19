# Claude Code Prompt — Na-klank MVP

You are helping me build an MVP for **Na-klank**, an AI-powered platform that helps bereaved families create personal tributes for a funeral. The full specification is in the attached file `na-klank-mvp-spec.md`. Read it in full before doing anything else — it is the source of truth for scope, architecture, data model, and module behavior.

## Your task

Build the MVP described in the spec, in an iterative way. This is not a one-shot code generation job — we'll work through it in phases, and I expect us to pause, review, and adjust between phases.

## Tech stack (non-negotiable)

- Next.js (App Router, TypeScript) hosted on Vercel
- Supabase for Postgres + Auth + Storage + Edge Functions + Realtime
- Tailwind CSS
- Claude Opus 4.7 via the Anthropic API (model string: `claude-opus-4-7`)
- ElevenLabs API for TTS + Instant Voice Cloning
- Replicate for image generation/restoration

## Orchestration pattern (non-negotiable)

All AI generation runs as async jobs: a Next.js API route creates a `generation_jobs` row (status `pending`), fires off a Supabase Edge Function, and the frontend subscribes via Supabase Realtime to the job row. The Edge Function does the long work, writes results to Storage + DB, and sets status to `done` or `failed`. Vercel serverless functions never wait on long AI calls. See §3 of the spec.

## Working agreement

1. **Plan before coding.** Start by proposing a phased build plan (e.g. Phase 1: scaffolding + auth + schema; Phase 2: memorial space + director dashboard; Phase 3: eulogy module; Phase 4: collective eulogy; Phase 5: photo; Phase 6: voice). Let me approve the plan before you start building.

2. **One phase at a time.** Complete one phase, show me what's done (key files, how to run it, what I can test), then wait for my go-ahead before starting the next.

3. **Ask, don't assume.** If the spec is ambiguous or a decision point comes up that isn't covered (e.g. exact model choice on Replicate, exact copy for tone buttons, SQL schema details), ask me a concise question before choosing. Don't silently pick.

4. **Keep the build runnable.** After each phase, `npm run dev` should still work without errors, and I should be able to test the newly-built functionality end-to-end (even if UI is rough).

5. **Respect the sensitivity.** The eulogy chat and generation prompts need to be written with real care. When you reach those, pause and let me review the prompts before you wire them up. Do not ship placeholder "write a eulogy" prompts — these are the heart of the product.

6. **Security defaults on.** Every table needs RLS from the start. Service role key only used in Edge Functions and server-side code, never exposed to the client.

7. **Keep it lean.** MVP polish is not required; functionality is. Do not build features that aren't in the spec. Do not over-abstract — this is a focused MVP, not a framework.

8. **Configurability where the spec calls for it.** Photo style → Replicate model mapping, preset ElevenLabs voices, and system prompts should live in clearly-named config files (`lib/config/`) or prompt files (`lib/prompts/`) so I can tune them without hunting through code.

## Environment

I will provide the API keys and Supabase project. You scaffold the `.env.local.example` file with all expected variables (§11 of spec) and never commit real secrets.

## First step

Read `na-klank-mvp-spec.md` in full, then propose the phased build plan as described above. Do not write any code yet. Once I approve the plan, we begin Phase 1.
