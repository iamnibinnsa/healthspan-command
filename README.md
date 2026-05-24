# LIFE

### Be the CEO of your own health.

An interpretable, AI-powered healthspan platform that turns your lab reports and lifestyle data into a personalized 90-day longevity plan — built at the **Caltech Longevity Hackathon 2026**.

---

## What it does

LIFE gives you a living digital twin of your six core body systems — metabolic, cardiovascular, inflammation, muscle, cognition, and sleep. Upload a blood panel PDF, fill in your lifestyle context, and instantly get:

- A **personalized healthspan score** (0–100) with a transparent per-domain breakdown
- A **biological age proxy** calibrated to your real biomarkers, not demo defaults
- An interactive **Try Changes** simulator to explore how habits shift your bio-age
- A **90-day quest roadmap** with phased actions, weekly targets, and clinician notes
- A print-ready **Clinician Visit Brief** to bring to your next appointment

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TanStack Router, TanStack Start, Vite 7, Tailwind CSS v4 |
| Backend | FastAPI (Python), Anthropic Claude, pypdf |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| Charts | Recharts |
| Deployment target | Cloudflare Workers |

---

## Prerequisites

- **Node.js** ≥ 20
- **Python** ≥ 3.11
- A [Supabase](https://supabase.com) project (URL + anon key)
- An [Anthropic](https://console.anthropic.com) API key

---

## Setup

### 1. Install frontend dependencies

```bash
cd healthspan-command
npm install
```

### 2. Configure environment variables

Create **`.env.local`** in `healthspan-command/`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_AI_API_BASE=http://127.0.0.1:8000
```

Create **`.env`** in the same directory for the Python backend:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Install Python dependencies

Create and activate a virtual environment (recommended; only create `.venv` once):

```bash
cd healthspan-command
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

On macOS, if `pip` is not found before activating the venv, use `python3 -m venv .venv` as above, or run `pip3 install -r requirements.txt` without a venv.

### 4. Run database migrations

In the **Supabase SQL Editor**, run these files in order:

1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_lab_reports.sql`

---

## Running locally

Open **two terminals** side by side.

**Terminal 1 — Frontend**

```bash
npm run dev
```

Runs at `http://localhost:5173`

**Terminal 2 — Backend**

```bash
source .venv/bin/activate   # Windows: .venv\Scripts\activate
uvicorn main:app --reload
```

Runs at `http://127.0.0.1:8000` · API docs at `http://127.0.0.1:8000/docs`

---

## Sharing or testing from a zip

Do **not** bundle `node_modules/`, `.venv/`, `.env`, or `.env.local` in the archive. Native Node binaries (e.g. Rollup) break when copied between machines, and macOS may block them with a security dialog.

After extracting, each person should run setup locally:

```bash
cd healthspan-command
npm install
npm run dev

# second terminal
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

They still need their own `.env.local`, `.env`, and Supabase migrations (steps 2 and 4 above).

---

## Pages

| Route | Page | Description |
| --- | --- | --- |
| `/` | Landing | Profile overview and entry point |
| `/login` | Sign In / Up | Supabase email auth |
| `/intake` | Health Profile | Age, sleep, exercise, stress, goals |
| `/upload` | Lab Upload | PDF blood panel → Claude extracts biomarkers |
| `/dashboard` | Mission Control | Healthspan score, bio-age, domain snapshot |
| `/twin` | My Twin | Six-system orbit map with per-domain insights |
| `/simulator` | Try Changes | Habit simulator with live bio-age projection |
| `/plan` | 90-Day Plan | Phased quest roadmap + clinician discussion pack |
| `/clock` | Bio Age Clock | Blood-marker biological age estimator |
| `/report` | Clinician Brief | Printable summary for your physician |

---

## Project structure

```
healthspan-command/
├── src/
│   ├── routes/              # One file per page (TanStack Router)
│   ├── lib/
│   │   ├── scoringEngine.ts     # Interpretable 6-domain healthspan model
│   │   ├── bioAgeProjection.ts  # Bio-age gap + band logic
│   │   ├── twin-context.tsx     # Global React context (auth, intake, labs)
│   │   ├── mockData.ts          # Intervention table + demo constants
│   │   └── supabase.ts          # Supabase client singleton
│   └── components/          # Shared UI components
├── main.py                  # FastAPI backend — PDF parsing + plan generation
├── requirements.txt         # Python dependencies
├── supabase/
│   └── migrations/          # SQL schema for profiles and lab_reports
└── public/
    └── LIFE_logo.png
```

---

## How scoring works

The healthspan score is a **transparent weighted sum** across six domains. Every sub-score is a piecewise-linear function of a real biomarker or lifestyle input — no black-box ML. Every number is auditable.

| Domain | Weight | Inputs |
| --- | --- | --- |
| Metabolic Resilience | 20% | HbA1c, glucose, triglycerides, exercise, sleep |
| Cardiovascular Longevity | 20% | ApoB, LDL-C, HDL-C, triglycerides, resting HR |
| Inflammation / Immune Age | 15% | hs-CRP, Vitamin D, sleep, stress |
| Muscle & Mobility Reserve | 15% | VO2 max, exercise, strength training, protein |
| Cognitive Resilience | 15% | Sleep, stress, exercise, metabolic score |
| Sleep & Recovery | 15% | Sleep duration, HRV, resting HR, stress |

**Bio-age gap formula:** `gap (years) = (100 − healthspan_score) × 0.14`

---

> **Disclaimer:** All scores, projections, and bio-age estimates are directional educational prototypes — not clinical predictions, diagnoses, or prescriptions. Always discuss medical decisions with a licensed clinician.
