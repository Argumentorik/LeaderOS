# Leader-OS · Produkt, Pakete & Preise — die eine Quelle der Wahrheit

_Stand: 07.09.2026 (Iter 162). Technische Quelle: `backend/services_tier.py` → `TIER_CONFIG` und `backend/routes/payments.py` → `PACKAGES`. Wer Namen oder Preise ändert, ändert sie DORT — Doku, llms.txt und die öffentlichen SEO-Seiten (`backend/scripts_seo_pages.py`) lesen daraus bzw. werden daraus generiert._

## Namen (öffentlich) ↔ interne Tier-Keys

| Öffentlicher Name | Interner Key (`users.tier`) | Stripe-Package-ID | Preis |
|---|---|---|---|
| **Kostenlos** | `free` | — | 0 € |
| **Leadership OS** | `standard` | `leadership_os` (+ `leadership_os_2x`, `leadership_os_12x` Raten) | **997 € / Jahr** |
| **Leadership OS PLUS** | `accelerator` | `leadership_os_plus` (Buchung per Beratungsgespräch / Cal.com) | **4.797 € / Jahr** |
| **Leadership OS Enterprise** | `enterprise` | Lead-Formular `/api/payments/enterprise/lead` | auf Anfrage, Basis 997 €/Platz, Mengenrabatt 5–50 % |

Veraltete Namen, die **nirgends mehr** auftauchen sollen: „Starter“ (199 €), „Accelerator“ als Produktname, „Leadership System“, „6.970 €“, „4.447 €“. Die internen Keys `standard`/`accelerator` bleiben aus Kompatibilität (Webhooks, DB) bestehen — nur die Anzeige-Labels sind kanonisch.

## Paketinhalte

**Kostenlos**: KI-Coach mit Credit-Budget, Folge 1 jedes Kurses, Kurs-Bibliothek sichtbar (gesperrte Folgen als Upsell), Interaktiver Wlad 3 Gesprächsrunden, Tages-Check-in, Leader-Diagnose.

**Leadership OS (997 €/Jahr)**: Alles aus Kostenlos + unbegrenzter KI-Coach, Video-Missionen mit KI-Analyse, komplette Kurs-Bibliothek (Standard-Kurse), Playbooks, Simulationen, 30-Tage-Challenge, Events, Interaktiver Wlad unbegrenzt, Video-Guide. 30-Tage-Geld-zurück-Garantie, Ratenzahlung (2×/12×).

**Leadership OS PLUS (4.797 €/Jahr)**: Alles aus OS + PLUS-Kurse (Executive Presence & Charisma, Boardroom-Strategie, Change Management Master, KI-First Leadership) + 12 Einzelcoachings mit Argumentorik-Coaches + persönliche Strategie-Session + Quartals-Reviews.

**Enterprise**: Team-Lizenzen ab 5 Plätzen, Lizenz-Keys, Onboarding, Reporting, Custom-Wissen (RAG) möglich.

## Kurs-Bibliothek (Quelle: `backend/course_content.py`)

10 Kurse / 72 Folgen. Standard: Rhetorik-Grundlagen · Schwierige Gespräche meistern · Delegation wie ein Profi · Feedback-Formate (SBI & WWW) · Storytelling im Boardroom · Meeting-Rhetorik. PLUS: KI-First Leadership · Change Management Master · Executive Presence & Charisma · Boardroom-Strategie. Öffentliche Übersicht: `/kurse-uebersicht/`.

## Funktionsumfang (Stand Iter 162)

- **WladBot KI-Coach** — GPT-5.2, Streaming (SSE), Session-Memory, Persona-Prefill aus Profil
- **Lokales Hybrid-RAG** — MiniLM 384 dim + Keyword-RRF, 7.400+ Chunks (Bücher, Kurse, Live-Calls, Wlad-Canon), Admin-Upload .txt/.md/.pdf/.docx bis 2 MB je Datei, Bulk-Import mit Fortschritt je Datei, Konsistenz-Check `GET /api/rag-status`
- **Video-Missionen** — Whisper-Transkription + SEXIER-Analyse, Archiv, Sharing
- **Kurs-Bibliothek** — 10 Kurse / 72 Folgen, Folge 1 frei, Video-Upload per Admin
- **Video-Guide** — KI-generierte Wlad-Clips (Fal.ai OmniHuman/Kling, asynchrone Queue-Abholung), Best-Practice-Videos für Playbooks, Missionen, Video-Analyse, Coaching
- **Interaktiver Wlad (Beta)** — Sprach-Coaching mit Klonstimme (ElevenLabs), 3 Runden frei / unbegrenzt bezahlt
- **Playbooks, Simulationen, Tools, Tages-Challenge (auch per Stimme), 30-Tage-Challenge, Events (cal.com), Community, Referral, Credits-Transparenz**
- **Zugriffsmodell** — JWT + httpOnly-Cookie, Google-OAuth, Magic-Link, Admin nur per DB-Flag `is_admin`
- **Öffentliche SEO/AEO-Seiten** — `/fragen/`, `/wlad-jachtchenko/`, `/kurse-uebersicht/`, `llms.txt`, Sitemap mit hreflang de-DE/de-AT/de-CH

## Öffentliche Domain & Indexierung

Kanonische Domain: **https://leaderos.de**. Vorschau-/Staging-Hosts setzen per Skript `noindex`. Search-Console-Token: `REACT_APP_GSC_VERIFICATION` (frontend/.env). Seiten neu generieren nach Kurs-/Preisänderung: `cd backend && python3 scripts_seo_pages.py`.
