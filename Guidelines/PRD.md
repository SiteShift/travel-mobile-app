# Travel Diary Mobile App – Product Requirements Document (PRD)

**Version 0.9 – 21 Jun 2025**

---

## 1 • Executive Summary

Create a high‑quality, visually immersive travel diary app (iOS/Android, built with React Native + Expo) that lets users log day‑by‑day memories (text & photos) while automatically dropping geo‑pins on a personal world map. Every pin represents a *digital book* (journal) that can be viewed, shared, or exported. Think **“Airbnb‑level polish”** applied to a diary/route tracker.

## 2 • Objectives & Success Metrics

| Objective              | KPI                                   | Target after 6 months post‑launch |
| ---------------------- | ------------------------------------- | --------------------------------- |
| Drive adoption         | Monthly Active Users (MAU)            | ≥ 50 k                            |
| Engagement             | Avg. diary entries per user per month | ≥ 6                               |
| Retention              | D7 & D30 retention                    | ≥ 40 % / ≥ 20 %                   |
| Virality               | Invites sent per MAU                  | ≥ 0.7                             |
| Monetisation (phase 2) | Conversion to Pro                     | ≥ 2 %                             |

## 3 • Personas

* **Adventure Alice (27, gap‑year backpacker)** – documents trips in real time, likes social sharing.
* **Family Sam (38, travelling with kids)** – journals offline, curates memories for annual photobooks.
* **Minimalist Maya (24, design‑savvy)** – values aesthetics, wants quick, frictionless capture.
* **Creator Carlos (31, travel blogger)** – needs high‑quality export & deep links to embed in blog.
* Gen Z'er (18) - store memories in an app like a travel scrapbook

## 4 • Competitive Landscape

| App            | Strengths                                                                                                                                                | Gaps we can exploit                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Polarsteps** | Automatic GPS tracking & book printing ([play.google.com](https://play.google.com/store/apps/details?hl=en_US&id=com.polarsteps&utm_source=chatgpt.com)) | Limited day‑level storytelling, bland UI customisation |
| **Day One**    | Rich journaling features                                                                                                                                 | No map‑first experience, subscription barrier          |
| **Journey**    | Cross‑platform sync                                                                                                                                      | Less visual, dated UX                                  |

Our differentiation: **map‑centred UI, real‑time capture, share‑ready visual design, free core.**

## 5 • Feature Scope (MVP)

1. **Auth** – Email magic link & Apple / Google OAuth via Supabase Auth.
2. **Home / Map** – Interactive globe (Mapbox), personalised pins; cluster & zoom.
3. **Diary (Trip)** – Timeline of daily entries with cover image, stats (distance, days).
4. **Entry Editor** – Rich text, photo/video picker (Expo Image Picker), automatic location & weather stamp.
5. **Media Storage** – Upload originals to Supabase Storage; generate responsive thumbnails via Edge Function.
6. **Offline Drafts** – Local queue (SQLite/MMKV) with automatic sync.
7. **Sharing** – Deep‑link per pin/trip; share sheet & open‑graph preview.
8. **Settings** – Privacy (public/unlisted/private), data export (JSON/ZIP).

### Phase 2 + (Post‑MVP)

* Social graph (follow, likes), collaborative journals
* AI auto‑summary & printable photo‑book integration
* Android Wear / Apple Watch quick‑note

## 6 • User Stories & Acceptance Criteria (excerpt)

* *US‑01:* **Sign‑up** – As a new user I can sign up with email magic link so I don’t need a password.

  * **AC:** Email arrives < 60 s; tapping link logs in & routes to Onboarding.
* *US‑05:* **Create entry** – As a traveller I can add text & up to 30 photos so my day is documented.

  * **AC:** Offline queue if no network; images compress < 2 MB; entry appears on timeline & map.
* *US‑12:* **Share trip** – As a user I can share a public URL; recipient sees web‑optimized map & gallery.

  * **AC:** Link opens in web viewer; no login required; analytics event `share_trip` fired.

(Full user‑story list attached in Appendix A.)

## 7 • UX Flows

1. **Onboarding** → Permissions (Location, Photos) → Home Map → “+” → Entry Editor.
2. **Long‑press Map** → “Add new pin” → Select Trip or Create New Trip → Entry Editor.
3. **Profile** → Trips List → Pick Trip → Share / Export / Delete.

## 8 • Information Architecture & Data Model

### 8.1 Postgres Schema (Supabase)

```sql
-- Enable PostGIS for geo features
create extension if not exists postgis;

-- Users (managed by Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Trips (journals)
create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  description text,
  cover_photo text,
  start_date date,
  end_date date,
  visibility text check (visibility in ('public','unlisted','private')) default 'public',
  created_at timestamptz default now(),
  constraint trip_user_unique unique (user_id, title)
);

-- Entries
create table public.entries (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references public.trips(id) on delete cascade,
  day_index int,
  content markdown,
  location geography(Point,4326),
  address text,
  weather jsonb,
  created_at timestamptz default now()
);

-- Media Assets
create table public.media (
  id uuid primary key default uuid_generate_v4(),
  entry_id uuid references public.entries(id) on delete cascade,
  url text,
  thumbnail_url text,
  width int,
  height int,
  created_at timestamptz default now()
);
```

*Row‑level security (RLS) policies enforce ownership & visibility.*

### 8.2 Storage

* **supabase.storage** › `trip-media/{user}/{trip}/{uuid}.jpg` (original & thumb)
* Edge Function `generate-thumb.ts` runs on upload trigger (Sharp lib) to create 640px thumbnail.

### 8.3 Geo Queries

* PostGIS functions (`ST_DWithin`, `ST_Distance`) enable nearby‑pin filters, clusterin[g (](https://supabase.com/docs/guides/database/extensions/postgis?utm_source=chatgpt.com)[supabase.com](https://supabase.com/docs/guides/database/extensions/postgis?utm_source=chatgpt.com)).

## 9 • Technical Architecture

| Layer        | Tech / Library                                                  | Rationale                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | React Native 0.74, Expo SDK 50, TypeScript                      | Rapid dev, OTA updates                                                                                                                                                                                  |
| Navigation   | React Navigation 6 + Expo Router                                | Nested stacks, deep links                                                                                                                                                                               |
| Maps         | Mapbox RN SDK (maps & clustering)                               | High‑detail vector tiles, custom styling; free tier up to 25k maploads [† (](https://www.mapbox.com/pricing?utm_source=chatgpt.com)[mapbox.com](https://www.mapbox.com/pricing?utm_source=chatgpt.com)) |
| State Mgmt   | TanStack Query; Zustand                                         | Server cache + local UI state                                                                                                                                                                           |
| Images       | Expo‑Image + blurhash; react‑native-fast‑image                  | Fast progressive loading                                                                                                                                                                                |
| Offline      | Expo SQLite / MMKV; Background Tasks                            | Draft storage & sync                                                                                                                                                                                    |
| **Backend**  | Supabase (Postgres 16 + PostGIS, Storage, Auth, Edge Functions) | OSS, first‑class RN SDK, generous free tier                                                                                                                                                             |
| Deployment   | Supabase Cloud (prod) + local Docker (dev)                      | CI via GitHub Actions                                                                                                                                                                                   |

## 10 • Non‑Functional Requirements

* **Performance:** first meaningful paint ≤ 2 s on iPhone 12; smooth 60 fps map zoom.
* **Reliability:** 99.5 % monthly API uptime; retries & exponential back‑off on uploads.
* **Security:** RLS, least‑privilege service roles, at‑rest encryption (storage + DB).
* **Privacy/GDPR:** Data export & delete; cookieless analytics.
* **Accessibility:** WCAG 2.1 AA; VoiceOver labels for pins/photos.
* **Internationalization:** i18n hooks; RTL layouts.

## 11 • Analytics & Observability

* Supabase Analytics for DB‑level events.
* Amplitude (expo‑amplitude) for funnel tracking.
* Sentry / Supabase Edge logging for error monitoring.

## 12 • Development Workflow

1. **IDE:** Cursor + Copilot for code suggestions.
2. **Branch Strategy:** trunk‑based, feature flags.
3. **CI/CD:** GitHub Actions → EAS Build → TestFlight / Play Beta.
4. **Testing:** Jest + Testing Library RN; Detox (E2E); Supabase unit tests via pgTap.
5. **Code Quality:** ESLint, Prettier, TypeScript strict.

## 13 • Release Plan (MVP)

| Phase      | Duration | Deliverables                                 |
| ---------- | -------- | -------------------------------------------- |
| Sprint 0   | 1 wk     | Finalize PRD, low‑fi wireframes, tech‑spikes |
| Sprint 1‑2 | 2 wks    | Auth, base navigation, map POC               |
| Sprint 3‑4 | 2 wks    | Trip & Entry CRUD, storage uploads           |
| Sprint 5‑6 | 2 wks    | Offline sync, sharing links, polish          |
| Sprint 7   | 1 wk     | Beta QA, crash fix, App Store assets         |
| 🚀 Launch  | —        | v1.0 to App Store & Play Store               |

## 14 • Risks & Mitigations

| Risk                         | Mitigation                                                |
| ---------------------------- | --------------------------------------------------------- |
| Mapbox overage costs         | Monitor MAU; fallback to open‑source tiles if > free tier |
| Supabase storage cost growth | Thumbnail compression; user quotas                        |
| Poor offline UX              | Aggressive caching & conflict resolution tests            |

## 15 • Future Roadmap Ideas

* AI search ("show me sunsets in Bali")
* GPT‑powered auto‑caption suggestions
* Photo‑book print API integration
* Trip “Highlights” auto‑video generator

---

**Appendices:**
A. Full user‑story backlog ▸ *link to separate sheet*
B. API endpoint draft (REST & RPC)
C. Detailed wireframes (Figma)
D. Supabase RLS policy snippets.

*† See Mapbox Pay‑as‑you‑go pricing; free tier presently 25k map loads per month per app.*
