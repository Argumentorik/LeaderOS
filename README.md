# Leader-OS

**Leader-OS** (leaderos.de) — die KI-native Leadership-Plattform von Wladislaw Jachtchenko / Argumentorik.
React-Frontend + FastAPI-Backend + MongoDB, mit lokalem RAG über Wlads komplettes Kurswissen (7.400+ Chunks).

| Surface          | URL             | Zweck                                            |
| ---------------- | --------------- | ------------------------------------------------ |
| **leader-check** | leader-check.de | Anonymer Diagnose-Funnel (extern, Vercel)        |
| **leader-os**    | leaderos.de     | Authentifizierte Coaching-App (dieses Repo)      |

## Repo-Struktur

```
frontend/    React (CRA) — Tailwind, Shadcn/UI, Framer Motion, React Router
backend/     FastAPI — Auth, Payments, Chat, RAG, Voice, Simulationen
  routes/    Ein Router pro Domäne (auth, chat, simulations, voice_tts, …)
  tests/     pytest-Suiten (Login-Rate-Limit beachten: Suiten isoliert fahren)
docs/        Architektur, Runbooks, Schema, Integrationen
memory/      PRD, Changelog, Test-Credentials (Agent-Arbeitsdateien)
```

## Kern-Features

- **WladBot Chat** — GPT-5.2 + lokales Hybrid-RAG (Vektor + Keyword RRF, 0 externe Embedding-Keys)
- **Video-Studio** — Missions mit SEXIER-Analyse (Whisper STT + GPT-Feedback)
- **Voice Sparring** — ChatGPT-Level Echtzeit-Sparring (Auto-VAD, iOS-Style Interruption, Multi-Persona, ElevenLabs TTS)
- **SEXIER Argumentations-Prep** — Wizard mit Voice-Input, Templates, PDF-Export (reportlab), Coaching Memory
- **Tier-System** — Free / Standard (€997) / Accelerator (€6.970), Stripe Live + Lizenz-Keys für Sales
- **Events, Playbooks, 30-Tage-Challenge, Tasks, Community (prelaunch-gesperrt)**

## Lokale Entwicklung

```bash
# Backend (Port 8001, via supervisor)
cd backend && pip install -r requirements.txt
sudo supervisorctl restart backend

# Frontend (Port 3000, hot reload)
cd frontend && yarn install && yarn start
```

Env-Dateien: `backend/.env` (MONGO_URL, EMERGENT_LLM_KEY, STRIPE_API_KEY, …) und
`frontend/.env` (`REACT_APP_BACKEND_URL`). Vollständige Liste: siehe `DEPLOY.md`.

Test-Accounts: `memory/test_credentials.md` (Seed: `python backend/seed_test_users.py`).

## Deployment

Produktion läuft über **Emergent Deploy** auf `leaderos.de`.
Kompletter Guide inkl. Env-Matrix, Post-Deploy-Checks und Rollback: **[DEPLOY.md](DEPLOY.md)**.

## Wichtige Admin-Punkte

- Admin-Panel: `/wlad-control-x7k9q2` (non-guessable Route)
- RAG Control Center: Reingest + Golden-Check (21 Fragen) per Button
- RAG heilt sich nach Deploy selbst (`ensure_rag_ready`), Notschalter: `RAG_EMBEDDINGS_DISABLED=1`
