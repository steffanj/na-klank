# Na-klank MVP — Project Specification

## 1. Concept & Scope

Na-klank is an AI-powered platform that helps funeral directors and bereaved families create personal tributes for a funeral. This document describes the **MVP**: a demonstrable version of the platform covering four core modules, on top of a shared "memorial space" and a simple funeral director dashboard.

**In scope for MVP**
- Memorial space (central container per deceased person)
- Funeral director dashboard
- Four modules:
  1. Eulogy (personal tribute speech)
  2. Collective eulogy (synthesized from many contributors)
  3. Photo module (restoration/colorization + artistic styles)
  4. Voice module (text-to-speech of the eulogy, selectable voices + voice cloning)
- Magic link authentication
- Multi-user invites (by email)
- In-app notifications (no transactional email beyond auth)

**Out of scope for MVP**
- Song generation module
- Physical memorial keepsakes
- Payment integration / billing
- Production-grade polish (UI can be functional, not final)
- English interface (Dutch only for MVP)
- Transactional email via Resend (Supabase built-in auth mail is sufficient)

**Guiding principle:** the MVP must demonstrate all four modules convincingly end-to-end. Polish can come later; missing functionality cannot be demoed.

---

## 2. User Roles & Access Model

### Roles

| Role | Description |
|---|---|
| **Funeral director** | Creates memorial spaces, invites a primary family contact, has overview of all spaces they manage. |
| **Primary family contact** | One person per memorial space. Can invite additional family members. Has full access to all modules within the space. |
| **Family member** | Invited by director or primary contact. Can use all modules within the space they're invited to. |
| **Contributor** (collective eulogy only) | Accesses the space via a shareable link + simple code/token. Can only submit to the collective eulogy intake. No login required. |

### Access model

- Authentication is magic link only (Supabase Auth).
- A user can have multiple roles across different memorial spaces.
- Access is scoped per memorial space via Supabase Row Level Security (RLS).
- The collective eulogy contributor link is a tokenized public URL; contributors do not create accounts.

---

## 3. High-Level Architecture

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router, React, TypeScript) |
| Hosting | Vercel |
| Database + Auth + Storage | Supabase |
| Background/long-running AI work | Supabase Edge Functions (invoked asynchronously) |
| Realtime updates | Supabase Realtime |
| Text AI | Claude Opus 4.7 via Anthropic API |
| Audio AI | ElevenLabs API (TTS + Instant Voice Cloning) |
| Image AI | Replicate (model per use case) |
| Styling | Tailwind CSS |

### Orchestration pattern: workflow-state in DB

All AI-driven generations (eulogy, collective eulogy synthesis, photo, voice) follow the same pattern:

1. User triggers generation (e.g. clicks "Generate eulogy").
2. Next.js API route creates a `generation_job` row in Supabase with status `pending` and returns the job ID.
3. The API route invokes a Supabase Edge Function asynchronously (fire-and-forget) with the job ID.
4. The Edge Function:
   - Sets status to `processing`.
   - Fetches the relevant inputs from the database.
   - Calls the external AI provider (Claude / ElevenLabs / Replicate).
   - Downloads the output (if applicable) and writes it to Supabase Storage.
   - Updates the job row with the result reference (text content, storage path, etc.) and sets status to `done` — or `failed` with an error message.
5. The frontend listens to changes on the `generation_jobs` row via Supabase Realtime (or polls as fallback) and updates the UI when the status changes.

**Why this pattern:** Vercel serverless timeouts (10–60s) are too tight for Claude Opus on long eulogies, ElevenLabs on long audio, and Replicate on image generation. Edge Functions have longer execution windows and are better suited for async work. Keeping state in the database makes it trivial to show progress, preserve versions, and recover from failures.

### Storage

All generated and user-uploaded media (photos, MP3s, PDFs, restored/stylized images) are stored in **Supabase Storage**, organized by memorial space ID. RLS policies mirror the database access model.

---

## 4. Data Model (high level)

This is a conceptual overview, not a final SQL schema. Claude Code should finalize column types, indices, and RLS policies during implementation.

### Core tables

**`organizations`** — funeral director companies.
- `id`, `name`, `created_at`

**`users`** — managed by Supabase Auth (`auth.users`). A `profiles` table holds display info (name, role hints).

**`organization_members`** — links users to organizations (for funeral directors' staff).
- `user_id`, `organization_id`, `role`

**`memorial_spaces`** — one per deceased person.
- `id`, `organization_id` (which funeral director owns it)
- `deceased_first_name`, `deceased_nickname`, `deceased_last_name`
- `deceased_age`, `deceased_profession` (optional)
- `created_by` (user ID of the director), `created_at`
- `funeral_date` (optional — deadline for collective eulogy)

**`memorial_space_members`** — users with access to a space.
- `user_id`, `memorial_space_id`, `role` (`primary_contact` | `family_member`)
- `invited_by`, `invited_at`, `accepted_at`

**`collective_eulogy_tokens`** — public links for contributors.
- `memorial_space_id`, `token` (random string), `created_at`, `revoked_at` (optional)

### Module tables

**`eulogies`** — one per author (multiple per space allowed).
- `id`, `memorial_space_id`, `author_user_id`
- `status` (`intake_in_progress` | `generating` | `ready` | `finalized`)
- `current_version_id` (FK to latest version)
- `opt_in_to_collective` (default `true`)
- `created_at`, `updated_at`

**`eulogy_intakes`** — the deep intake answers (one per eulogy).
- `eulogy_id`, `answers_json` (structured: relationship, memories, character traits, anecdotes, desired tone, desired length, etc.)

**`eulogy_versions`** — every generation/edit produces a new row.
- `id`, `eulogy_id`, `version_number`
- `content` (markdown/plain text)
- `generation_source` (`initial` | `regenerated` | `manual_edit`)
- `user_edits_diff` (optional — when user manually edits, stored to preserve in regeneration)
- `created_at`

**`collective_eulogy`** — one per space.
- `memorial_space_id` (PK), `status`, `current_version_id`, `created_at`, `updated_at`

**`collective_eulogy_contributions`** — one per contributor submission.
- `id`, `memorial_space_id`
- `contributor_name` (free-text, no login required)
- `contributor_email` (optional)
- `relationship_to_deceased` (free-text)
- `answers_json` (short intake: favorite memory, one word to describe them, a wish, etc.)
- `submitted_at`
- `source` (`contributor_link` | `derived_from_eulogy` — when pulled from an opted-in eulogy intake)

**`collective_eulogy_versions`** — similar to `eulogy_versions`, but for the collective synthesis.
- `id`, `collective_eulogy_id`, `version_number`, `content`, `generated_at`, `generated_by_user_id`

**`photo_artworks`** — one row per source photo + generated variant.
- `id`, `memorial_space_id`, `uploaded_by`
- `original_storage_path`
- `category` (`restoration` | `artistic`)
- `style` (e.g. `colorize`, `restore_damaged`, `oil_painting`, `watercolor`, `charcoal`, `pencil`)
- `result_storage_path`
- `replicate_model_version` (for reproducibility)
- `status`, `created_at`

**`voice_recordings`** — one row per generated audio.
- `id`, `memorial_space_id`, `created_by`
- `source_type` (`eulogy` | `collective_eulogy` | `custom_text`)
- `source_eulogy_version_id` (nullable)
- `input_text` (snapshot of text used)
- `voice_id` (ElevenLabs voice ID, either preset or cloned)
- `voice_source` (`preset` | `cloned`)
- `result_storage_path` (MP3)
- `status`, `created_at`

**`cloned_voices`** — user-uploaded cloned voices.
- `id`, `memorial_space_id`, `uploaded_by`
- `display_name`, `elevenlabs_voice_id`
- `sample_storage_path`, `created_at`

### Workflow table

**`generation_jobs`** — tracks every async AI generation.
- `id`, `memorial_space_id`
- `job_type` (`eulogy_generate` | `eulogy_regenerate` | `collective_synthesize` | `photo_generate` | `voice_generate` | `voice_preview`)
- `target_id` (points to the row being generated, e.g. `eulogy_version_id`)
- `status` (`pending` | `processing` | `done` | `failed`)
- `error_message`
- `created_at`, `updated_at`, `completed_at`
- `triggered_by_user_id`

---

## 5. Module Specifications

### 5.1 Memorial space & director dashboard

**Director dashboard**
- List of all memorial spaces the director manages
- Per space: deceased name, funeral date, primary contact status, module progress indicators
- "Create new memorial space" flow:
  - Enter deceased basic info (first name, nickname, last name, age, profession optional, funeral date optional)
  - Enter primary family contact email → sends magic-link invitation
- Option to add additional family members by email

**Primary contact view (when they log in)**
- Shows all memorial spaces they have access to (usually one)
- Can invite more family members
- Sees module hub (see below)

### 5.2 Module hub (per memorial space)

When a family member enters a memorial space, they see the **module hub**: a dashboard with four cards, one per module. Each card shows status (not started / in progress / ready) and opens the module's dedicated flow.

### 5.3 Eulogy module

**Intake (deep)**
- Multi-step guided form
- Alternative: chat with Claude (see **Chat mode** below)
- Questions cover: relationship to deceased, how they met, favorite memories (3–5), character traits, anecdotes, things the author wants to emphasize, desired tone (warm / light-hearted / formal), desired length (short / medium / long)
- Saved incrementally (users often do this across multiple sessions)

**Chat mode**
- Alternative to the guided form
- Claude acts as a gentle interviewer, asking follow-up questions
- **Critical:** the system prompt must instruct Claude to be extremely sensitive: acknowledge grief, never rush, never be clinical, let the user set the pace, avoid therapeutic language, never offer unsolicited advice, mirror the user's tone (some want to laugh, others want to reflect). The chat must feel like a patient, warm human interviewer — not a productivity tool.
- Output: same `answers_json` structure as the guided form
- User can switch between chat and form at any time

**Generation**
- User clicks "Generate eulogy" → creates a `generation_job`
- Claude Opus 4.7 produces one complete eulogy
- Shown in an editable textarea

**Revision**
- Preset tone-adjustment buttons: *simpler language*, *more joyful*, *more reserved* (extensible)
- Field: *add extra memory / detail*
- Field: *free instruction to Claude*
- Editable textarea for direct manual edits
- On regeneration, Claude receives:
  - The original intake
  - The most recent version (with the user's manual edits)
  - An instruction to preserve manual edits where possible while applying the requested change
- Every revision creates a new `eulogy_version` row
- User can view version history and revert

**Finalization**
- User marks eulogy as "finalized"
- Finalized eulogy becomes available as input to the voice module
- Can still be revised after finalization

**Multiple eulogies per space**
- Several family members can each author their own eulogy
- Each eulogy has its own intake, versions, and status

### 5.4 Collective eulogy module

**Intake (short)**
- Shorter form than the personal eulogy intake
- Questions: name, relationship to deceased, one favorite memory, one word to describe them, what they meant to you, optional photo (not used in MVP synthesis but stored)
- Accessible two ways:
  1. Contributors use the shareable tokenized link (no login)
  2. Authors of personal eulogies who opted in have their relevant answers **auto-derived** (subset mapping from deep intake to short intake structure, stored as a contribution with `source = derived_from_eulogy`)

**Opt-in / opt-out**
- Default: eulogy authors are opted in — their relevant intake data flows into the collective eulogy
- Clear toggle per eulogy to opt out
- If opted out, no data flows; a previously-flowed contribution is deleted if the author later opts out

**Synthesis**
- Manual trigger by primary contact or director
- Claude Opus 4.7 reads all contributions + the basic info about the deceased
- Produces one coherent eulogy "from the community", not a list of quotes
- Stored as a new `collective_eulogy_version`
- Can be re-synthesized later as new contributions arrive (up to the day before the funeral)
- Versions preserved; user can compare and revert

**Editor**
- Same editor pattern as personal eulogy (editable textarea, revision buttons, etc.)

### 5.5 Photo module

**Two categories, clearly separated in the UI:**

**Category A — Restoration / colorization**
- Use cases: colorize black-and-white photo, restore damaged photo, enhance resolution
- Each use case maps to a specific Replicate model best suited for that task (e.g. GFPGAN or CodeFormer for restoration, specialized colorization models for b&w, Real-ESRGAN for upscaling). Claude Code should pick the currently-recommended models on Replicate at build time and make the mapping configurable.

**Category B — Artistic styles**
- Oil painting, watercolor, charcoal sketch, pencil drawing
- Each maps to an appropriate image-to-image model on Replicate (e.g. Flux-based or SDXL-based img2img with style prompts/LoRAs, depending on what's available). Again, configurable.

**Flow**
- Upload photo (drag-and-drop + file picker)
- Pick category → pick style
- Preview original → click "Generate" → job created → user sees "generating..." with realistic progress language
- Result shown side-by-side with original
- User can download (full resolution) or regenerate with a different style

**Configurability**
- The mapping from (category, style) → (Replicate model, version, parameters) is stored in a config file or a `photo_styles` config table so it can be tuned without code changes

### 5.6 Voice module

**Input selection**
- Choose source:
  - Pick a finalized eulogy from this space
  - Pick the current collective eulogy version
  - Paste custom text
  - Upload a `.txt` file

**Voice selection**
- Preset voices: ~6–8 curated ElevenLabs voices, mix of warm / neutral, male / female, all Dutch-capable (using ElevenLabs multilingual models)
- Custom voice: upload audio sample (~1 minute) → create via ElevenLabs Instant Voice Cloning → stored in `cloned_voices`, usable for all future generations in this space

**Preview before full generation**
- Short preview (~15 seconds) generated first
- User confirms before full text is generated — this saves ElevenLabs credits significantly on long eulogies

**Output**
- MP3 stored in Supabase Storage
- User can play in-browser and download

---

## 6. AI Integrations

### Claude Opus 4.7 (Anthropic API)

Used for:
- Eulogy intake chat mode
- Eulogy generation and revision
- Collective eulogy synthesis

Key implementation notes:
- Use `claude-opus-4-7` as the model string
- Enable prompt caching on system prompts and intake data (stable across revisions) — significant cost reduction on multi-turn revision
- System prompts must be crafted carefully for sensitivity; these should live in a dedicated `lib/prompts/` directory for review and iteration
- Responses should be streamed to the Edge Function, but persisted all-at-once to the DB when complete (no streaming to the frontend needed in MVP)
- Always set a reasonable `max_tokens` aligned with the user's chosen eulogy length

### ElevenLabs API

Used for:
- Text-to-speech (preset voices, Dutch multilingual model)
- Instant Voice Cloning for custom voices
- Short preview generation before full audio

Key implementation notes:
- Curated preset voice IDs stored in config
- Cloned voices created via ElevenLabs API, voice ID stored in `cloned_voices`
- Generated MP3s downloaded and written to Supabase Storage — do not rely on ElevenLabs URLs (they can expire)

### Replicate

Used for:
- Photo restoration / colorization / upscaling (Category A)
- Artistic style transfer (Category B)

Key implementation notes:
- Model mapping is configurable (see §5.5)
- Generated images downloaded and written to Supabase Storage — do not rely on Replicate URLs
- Use Replicate webhooks if feasible (Edge Function endpoint receives the webhook, marks job done); otherwise poll the prediction status

---

## 7. Authentication & Authorization

- **Supabase Auth magic link** for all logged-in roles (directors, primary contacts, family members)
- **Token-based public access** for collective eulogy contributors (no login)
- **RLS policies** enforce per-space access throughout the database
- Invitation flow: director/primary contact enters email → backend creates a pending `memorial_space_members` row → sends magic link via Supabase Auth → on first login, row is linked to `auth.users.id` and marked accepted

---

## 8. Frontend Structure (proposed)

```
/app
  /(marketing)              — minimal landing page
  /auth                     — magic link flow
  /director
    /dashboard              — list of spaces
    /spaces/new             — create new space
    /spaces/[id]            — space detail
  /spaces/[id]              — family-facing hub
    /eulogy
      /new                  — new eulogy (intake → chat or form)
      /[eulogyId]           — editor
    /collective-eulogy
      /editor
    /photo
      /new
      /[artworkId]
    /voice
      /new
      /[recordingId]
  /contribute/[token]       — public contributor link (collective eulogy intake)
/lib
  /supabase                 — client + server helpers
  /ai
    /claude                 — Anthropic client, prompt builders
    /elevenlabs             — TTS + cloning helpers
    /replicate              — model wrappers
  /prompts                  — system prompts (eulogy-intake-chat, eulogy-generate, collective-synthesize, etc.)
/supabase
  /migrations               — SQL schema + RLS
  /functions                — Edge Functions (generation workers)
```

---

## 9. UI/UX Principles

- **Calm, warm, dignified.** Muted palette, generous whitespace, serif headings if appropriate.
- **Never hurry the user.** No timers, no "quick action" language. Everything saves automatically.
- **Always acknowledge what has been done.** Clear status: draft, generating, ready, finalized.
- **Never lose user work.** Every version is preserved; manual edits always respected.
- **Accessibility.** Legible font sizes, strong contrast, keyboard navigable. Many users will be elderly.
- **Mobile-friendly.** Many contributors (collective eulogy) will submit from phones.

For the MVP, polish is not required — but these principles should still guide the rough UX.

---

## 10. Open Questions / Deferred Decisions

- Final choice of Replicate models per photo style (pick best-available at build time)
- Final preset ElevenLabs voice selection (curate 6–8 at build time)
- Exact wording of tone-adjustment buttons in the eulogy editor (starter set: simpler / more joyful / more reserved)
- System prompt wording for the sensitive eulogy chat (iterate with real test users)
- Transactional email (Resend) — deferred until post-MVP / production
- Billing — deferred entirely
- Song module — deferred entirely

---

## 11. Environment Variables (expected)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
REPLICATE_API_TOKEN=
APP_URL=
```

---

## 12. Definition of Done (MVP)

The MVP is considered done when:

1. A funeral director can sign up (manually provisioned in MVP), log in via magic link, create a memorial space with basic info about the deceased, and invite a primary family contact.
2. The primary contact logs in via magic link and sees the module hub.
3. An eulogy can be drafted via both guided form and sensitive chat, generated by Claude, revised with preset buttons and free instructions, manually edited, and finalized — with version history.
4. A collective eulogy contributor link can be shared; contributions can be submitted without login; the primary contact can manually trigger synthesis; re-synthesis works after new contributions.
5. A photo can be uploaded and processed via at least two restoration/colorization styles and at least two artistic styles.
6. A voice recording can be generated using both a preset voice and a cloned voice, from a finalized eulogy and from pasted text, with a short preview before full generation.
7. All four module outputs are persisted in Supabase Storage and survive page refresh / re-login.
8. Basic mobile layout works for the contributor link and the module hub.
