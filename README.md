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

- **WladBot Chat** — GPT-5.2 + lokales Hybrid-RAG (Vektor MiniLM 384 dim + Keyword-RRF). Ein einziger Embedding-Weg, kein externer Anbieter, kein Embedding-Key. Konsistenz-Check: `GET /api/rag-status` (provider, model, dim, chunks, store_dim, consistent)
- **Video-Studio** — Missions mit SEXIER-Analyse (Whisper STT + GPT-Feedback)
- **Voice Sparring** — ChatGPT-Level Echtzeit-Sparring (Auto-VAD, iOS-Style Interruption, Multi-Persona, ElevenLabs TTS)
- **SEXIER Argumentations-Prep** — Wizard mit Voice-Input, Templates, PDF-Export (reportlab), Coaching Memory
- **Tier-System** — Kostenlos / Leadership OS (997 €/Jahr) / Leadership OS PLUS (4.797 €/Jahr) / Enterprise — Stripe Live + Lizenz-Keys für Sales. Quelle der Wahrheit: [docs/PRODUKT_UND_PREISE.md](docs/PRODUKT_UND_PREISE.md)
- **Kurs-Bibliothek** — 10 Kurse / 72 Folgen (Folge 1 frei), Video-Guide mit KI-generierten Wlad-Clips (Fal.ai), **Interaktiver Wlad (Beta)** Sprach-Coaching (ElevenLabs)
- **Wissens-Upload (Admin)** — .txt/.md/.pdf/.docx bis 2 MB je Datei, Bulk-Import per Drag & Drop mit Fortschritt je Datei, sofort live im RAG. Einstieg für Entwickler: [docs/DEV_HANDBUCH_RAG.md](docs/DEV_HANDBUCH_RAG.md) (RAG-Ablauf + Wissenspflege in 5 Minuten)
- **Öffentliche SEO/AEO-Seiten** — `/fragen/`, `/wlad-jachtchenko/`, `/kurse-uebersicht/` (statisches HTML, ohne JS lesbar), `llms.txt`, Sitemap mit hreflang de-DE/de-AT/de-CH; Generator: `python3 backend/scripts_seo_pages.py`
- **Events, Playbooks, 30-Tage-Challenge, Tasks, Community**

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
- RAG Control Center: Reingest + Golden-Check (21 Fragen) per Button; Wissens-Quellen: Bulk-Upload, Ansehen, Entfernen
- RAG heilt sich nach Deploy selbst (`ensure_rag_ready`), Notschalter: `RAG_EMBEDDINGS_DISABLED=1`

## SEO / AEO (DACH)

- Öffentliche, ohne Login lesbare Seiten liegen als statisches HTML in `frontend/public/` (Antwort-Crawler wie GPTBot/ClaudeBot/PerplexityBot rendern kein JS): `/fragen/` (FAQPage), `/wlad-jachtchenko/` (Person/ProfilePage), `/kurse-uebersicht/` (Course/ItemList). Sichtbarer Text und JSON-LD kommen aus denselben Daten → `python3 backend/scripts_seo_pages.py` nach Kurs-/Preisänderungen ausführen (schreibt auch `sitemap.xml`).
- `index.html` trägt nur den Entity-Graph (Organization, Person, WebSite, SoftwareApplication) — seitenspezifisches Schema gehört NICHT in die SPA-Shell.
- Nicht-Produktions-Hosts setzen sich per Inline-Skript auf `noindex`. Search Console: Token in `REACT_APP_GSC_VERIFICATION` eintragen, dann `sitemap.xml` einreichen.
- CTA-Klicks aus Suchergebnissen: Links tragen `utm_source=seo`; `lib/attribution.js` feuert das PostHog-Event `seo_cta_click` und speichert die Attribution am User (Signup).
