# MY OS — Class 12 Personal Operating System

A complete, local-first personal operating system for a Class 12 student. It generates
realistic board-exam papers, runs a strict 3-hour exam simulator, plans study, drives
spaced revision, drills spoken English, tracks a freelance pipeline, and keeps tasks,
habits, goals and analytics in one place — all backed by your own data.

Everything runs on your machine. There is no account, no cloud, no multi-user surface.

---

## Feature overview

| Area | What it does |
| --- | --- |
| **AI Exam Studio** | Generates CBSE Class 12 papers on demand — objective (MCQ, True/False, Assertion–Reason, Matching) and subjective (Short, Long, Case, Numerical, Derivation) — with answer keys, worked solutions and marking schemes. |
| **Exam simulator** | Full-screen, timer-locked board exam. 180-minute default, warnings at 30/15/5 minutes, auto-submit at zero, strict vs practice mode, question palette, mark-for-review, ambience audio, and a paper-snatch invigilation animation. |
| **Study planner** | Builds a rolling 7-day plan from your syllabus gaps, confidence ratings and test scores. Complete, skip or reschedule items; log real sessions against planned time. |
| **Revision center** | Spaced-repetition cards auto-generated from weak activities plus manual cards, with flag-and-review scheduling. |
| **Mistake notebook** | Every wrong answer captured at submit time with correct reasoning, category and a spaced review date. |
| **English lab** | Record speech (Web Speech API), get scored on grammar, vocabulary, fluency, clarity and confidence, with sentence corrections and practice drills. |
| **Freelance CRM** | Pipeline board and list view, stage tracking, next-action and follow-up scheduling, funnel conversion metrics, and AI-drafted outreach / follow-up / proposal messages. |
| **Tasks & goals** | Tasks with priorities, categories, due dates and recurring rules; goals with measurable targets and deadlines. |
| **Habits** | Daily habit grid with streaks, weekly targets and 14-day heat map. |
| **Analytics** | Study time, mock-score trends, objective accuracy, chapter mastery, mistake breakdown, English trend and freelance funnel — all from your own data. |
| **AI assistant** | A grounded assistant that answers using your real syllabus, scores, mistakes and pipeline. Voice input and optional read-aloud. |
| **Onboarding & settings** | Guided first-run setup (subjects, chapters, habits) and full profile / exam / ambience / data controls. |

---

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** with a monochrome design-token system (`design.md`)
- **Prisma** + **SQLite** (local database)
- **Recharts** for charts, **lucide-react** for icons, **zod** for validation
- **Web Speech API** (browser) for the English lab and assistant voice input
- **YouTube IFrame / HTML5 audio** for exam ambience

---

## Getting started

Requirements: **Node.js 18+** (developed on Node 24), npm, and Python is not required.

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
#    Copy .env.example to .env and adjust if needed
#    (At minimum, DATABASE_URL must be set for SQLite.)
cp .env.example .env

# 3. Generate the Prisma client and create the database
npm run setup

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to
**onboarding** on first run.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Run the production build |
| `npm run setup` | `prisma generate` + `prisma db push` (creates the SQLite DB) |
| `npm run db:push` | Sync schema to the database |
| `npm run db:studio` | Open Prisma Studio to browse your data |
| `npm test` | Run the test suite |
| `npm run lint` | Lint (interactive on first run) |

---

## AI engine: live vs demo

The app is fully functional **without any API key**.

- **Demo mode (default):** papers, feedback and assistant replies are produced by a
  built-in offline engine grounded in the CBSE Class 12 curriculum and concept fact
  bank. All AI output is clearly labelled **DEMO** so you always know what is synthetic.
- **Live mode:** set `AI_API_KEY` in `.env` to route generation and evaluation through
  any OpenAI-compatible chat-completions endpoint.

```env
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
```

Keys are read **server-side only** and are never exposed to the browser.

---

## Environment variables

See `.env.example`. Summary:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite path, e.g. `file:../data/myos.db`. Prisma reads `.env`, not `.env.local`. |
| `AI_API_KEY` | No | Enables live AI. Absent ⇒ demo mode. |
| `AI_MODEL` | No | Model name (default `gpt-4o-mini`). |
| `AI_BASE_URL` | No | OpenAI-compatible base URL. |
| `AI_PROVIDER` | No | Provider label. |
| `AI_BOARD` | No | Board name used in prompts (default `CBSE`). |

---

## Project structure

```
prisma/
  schema.prisma          # Full data model (profile, subjects, chapters, papers,
                         # attempts, planner, tasks, habits, goals, mistakes,
                         # revision, english, leads, journal, assistant)
src/
  app/
    (pages)              # dashboard, onboarding, exam-studio, exam/*, syllabus,
                         # planner, revision, mistakes, english, freelance,
                         # tasks, habits, analytics, assistant, settings
    api/                 # Route handlers for every feature
  components/
    ui.tsx               # Reusable primitives (Button, Card, Modal, Toast, …)
    layout/shell.tsx     # App shell: sidebar, top bar, mobile nav, quick-add
    exam/ambience.tsx    # Honest exam-audio playback with autoplay fallback
  lib/
    curriculum.ts        # CBSE Class 12 subjects, chapters and topics
    factbank.ts          # Concept facts used by the offline generator
    ai/                  # Provider routing + offline demo engine
    types.ts, utils.ts, db.ts
tests/                   # Node test-runner suites
design.md                # The monochrome design system (source of truth)
```

---

## Testing

```bash
npm test
```

The suite covers the pure, high-risk logic:

- Time and date helpers, streak calculation, percentage and formatting
- YouTube / media URL validation for ambience
- Objective grading (MCQ, True/False, Assertion–Reason, Matching)
- Scoring aggregation across objective and subjective questions
- Exam timer maths: countdown, refresh persistence, warning windows, auto-submit
- Curriculum and fact-bank integrity (drives the demo generator)

---

## Privacy & data

- Single-user, local-only. The database lives in `data/myos.db`.
- No telemetry, no accounts, no third-party data sharing.
- Export everything as JSON from **Settings → Your data**.
- `.env` and the database are git-ignored.

---

## Design system

`design.md` is the single source of truth for the visual language — ink/canvas
monochrome palette, radii, typography (Inter via Google Fonts) and spacing. UI
components in `src/components/ui.tsx` implement these tokens; do not modify
`design.md`.

---

## License

Private project. All rights reserved.
