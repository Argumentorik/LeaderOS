# Tool-Zugänge — wer hat wo Zugriff, und was fehlt für `mert@argumentorik.com`

> Stand 24.09.2026. Ziel: jedes Werkzeug, das LeaderOS/Leader-Check am
> Laufen hält, hat **mindestens zwei** Admins, und die neue Team-Adresse
> `mert@argumentorik.com` ist überall eingetragen. Was hier mit ✅ steht,
> wurde direkt gegen die Plattform geprüft (API); alles mit ❓ konnte von
> hier aus nicht gelesen werden und muss im jeweiligen Dashboard nachgesehen
> werden. Dieses Dokument ersetzt die Tabelle in `ONBOARDING.md` §12.

**Team-Adressen:** `start@aiporate.com` (Mert, bisheriger Owner überall) ·
`mert@argumentorik.com` (Mert, neu — Postfach über Eduard `ek@argumentorik.com`) ·
`wj@argumentorik.com` (Wlad) · `stefan@argumentorik.com` (Stefan) ·
`ek@argumentorik.com` (Eduard).

---

## 1. Ist-Stand (geprüft)

| Tool | Wofür | Owner / Admin | Weitere Mitglieder | `mert@argumentorik.com` | Geprüft |
| --- | --- | --- | --- | --- | --- |
| **GitHub** `aiporator/shipos` | Code, CI, Deploy-Trigger | `aiporator` (start@aiporate.com) · admin | `sbcodes` (Stefan) · write | ❌ fehlt | ✅ API |
| **Vercel** Team `aiporators-projects` (INHALE), Projekt `leaderos` | Hosting leader-os.de, Env-Vars, Domains | start@aiporate.com · OWNER | stefan@argumentorik.com · MEMBER · mighani@skillbyte.de · DEVELOPER | ❌ fehlt | ✅ API |
| ↳ Einladung `wj@argumentorik.com` | — | — | **Einladung vom 19.05. ist abgelaufen, nie angenommen** | — | ✅ API |
| **Supabase** Projekt `srujvjjncrszhaaxepxf` (Org `skawjzvddehhmkwiltui`) | Postgres, Auth, Storage, RAG, pg_cron, Edge Functions | start@aiporate.com | ❓ | ❓ | ❌ nur Projekt lesbar, Mitglieder nicht |

Auffällig: außer `start@aiporate.com` hat **niemand** Owner-Rechte auf
irgendetwas. Fällt dieser Account aus (Passwort, 2FA-Gerät, Google-Konto),
steht das Projekt. Das ist der eigentliche Grund für diese Liste.

## 2. Nicht von hier prüfbar — im Dashboard nachsehen

| Tool | Wofür | Bekannter Login | Wo Mitglieder verwalten | `mert@argumentorik.com` |
| --- | --- | --- | --- | --- |
| **Emergent** (`command-center-229`) | App-Backend (FastAPI), MongoDB, leaderos.de-App-Tier, Object-Store | start@aiporate.com | Emergent → Project → Settings → Team | ❓ |
| **MongoDB Atlas** (hinter Emergent) | Nutzer, Sessions, Leads, Zahlungen | ❓ — evtl. nur über Emergent | Atlas → Organization → Access Manager | ❓ |
| **Resend** | Alle Transaktions- und Nurture-Mails | start@aiporate.com | Resend → Settings → Team | ❓ |
| **Stripe** | Zahlungen, Webhooks, Raten | start@aiporate.com | Stripe → Settings → Team and security | ❓ |
| **PostHog EU** Projekt `181271` | Produkt-Analytics, Session Replays, Identity-Stitching | start@aiporate.com | PostHog → Organization settings → Members | ❓ |
| **Sentry** Org `aiporate` (EU) | Error-Monitoring, Projekte `leader-os` + `leader-check` | start@aiporate.com | Sentry → Settings → Members | ❓ |
| **Cal.com** (`cal.com/leaderos/beratung`, `/demo`) | Beratungs-/Demo-Buchung | ❓ | Cal.com → Settings → Teams | ❓ |
| **ElevenLabs** | Sprachausgabe WladBot, Audio-Modus | ❓ (API-Key in Emergent) | ElevenLabs → Workspace → Members | ❓ |
| **Voyage AI** | Embeddings fürs RAG | ❓ (API-Key in Emergent) | Voyage Dashboard | ❓ |
| **OpenAI / Anthropic** | LLM-Keys (nur nötig, wenn `llm_provider` vom Emergent-Wrapper weg soll) | ❓ | Platform → Members | ❓ |
| **AWS CloudFront** `d8j0ntlcm91z4` | Hero-/Sektions-Videos | ❓ — Bucket-Name deutet auf Higgsfield-Export | AWS IAM | ❓ |
| **Higgsfield** | Video-/Bild-Generierung (CloudFront-Bucket) | ❓ | Higgsfield → Workspace | ❓ |
| **Vimeo** (Intro-Video `1197728183`) | Video-Hosting | ❓ | Vimeo → Team | ❓ |
| **Domain-Registrar** (`leader-os.de`, `leaderos.de`, `leadercheck.de`, `leader-check.de`) | DNS; laut ONBOARDING GoDaddy, laut RUNBOOK_DOMAINS evtl. inwx/hetzner — **klären** | start@aiporate.com | Registrar → Account → Delegierte | ❓ |
| **Google Search Console** (beide Hosts) | Indexierung, Sitemaps | start@aiporate.com | GSC → Settings → Users and permissions | ❓ |
| **Google Ads** | Suchkampagnen (Setup vorbereitet, Tag inaktiv) | ❓ | Google Ads → Tools → Access and security | ❓ |
| **Meta Business** (Pixel + Conversions API) | Meta/Instagram Ads | ❓ | Meta Business Suite → Users | ❓ |
| **LinkedIn Campaign Manager** (Insight Tag) | LinkedIn Ads | ❓ | Campaign Manager → Account settings → Manage access | ❓ |
| **Microsoft Clarity** | Heatmaps (im CSP freigegeben) | ❓ | Clarity → Settings → Team | ❓ |
| **Google Drive** „LeaderOS Wiki" | Team-Wiki | start@aiporate.com | Drive → Freigeben | ❓ |
| **Trustpilot** (`argumentorik.com`) · **Greator** (Coach-Profil) | Bewertungsplattformen | vermutlich Argumentorik | Plattform-Profil | ❓ |
| **Zoom / Webinar-Tool** | Live-Webinar 29.10. | ❓ — nicht im Repo hinterlegt | — | ❓ |

## 3. Reihenfolge, in der Zugänge erteilt werden sollten

Nach Ausfallrisiko sortiert — die ersten drei blockieren im Ernstfall
Deploys, Datenbank und Mails, alles andere ist Komfort.

1. **GitHub** — `mert@argumentorik.com` als zweiten Account anlegen (oder
   bestehendes GitHub-Konto von Mert mit der Adresse verknüpfen) und als
   **admin** auf `aiporator/shipos` eintragen: Repo → Settings →
   Collaborators → Add people. Danach `wj@argumentorik.com` mindestens
   **read**, damit Wlad PRs und Historie sehen kann.
2. **Vercel** — Team `aiporators-projects` → Settings → Members → Invite:
   `mert@argumentorik.com` als **Owner** (zweiter Owner!), `wj@argumentorik.com`
   neu einladen (alte Einladung ist abgelaufen) als Member. Prüfen, wer
   `mighani@skillbyte.de` ist — DEVELOPER-Rolle seit 06.08. über GitHub-
   Auto-Approve; wenn unbekannt, entfernen.
3. **Supabase** — Org `skawjzvddehhmkwiltui` → Team → Invite:
   `mert@argumentorik.com` als **Owner**, Stefan als Developer (er
   diagnostiziert dort ohnehin, siehe Incident vom 16.09.).
4. **Emergent** — zweiten Admin eintragen; ohne Emergent-Zugang ist das
   App-Backend nicht deploybar.
5. **Resend, Stripe** — je einen zweiten Admin; Stripe zusätzlich
   Wlad/Argumentorik als Buchhaltungs-Zugang (Rolle „Analyst" reicht).
6. **PostHog, Sentry** — Members; Stefan dazu.
7. **Domain-Registrar** — Delegierten-Zugang statt Passwort-Teilen.
8. Rest (Cal.com, ElevenLabs, Voyage, Higgsfield, Vimeo, GSC, Ads-Konten,
   Clarity, Drive) — nach Bedarf, aber jeweils eintragen, sobald das
   Passwort bekannt ist.

## 4. Was nach dem Eintragen zu tun ist

- In jedem Tool nach dem Invite **einmal mit `mert@argumentorik.com`
  einloggen** und den Zugang in Spalte 5 dieser Tabelle auf ✅ setzen.
- 2FA für die neue Adresse überall aktivieren — ein zweiter Owner ohne 2FA
  ist ein zweites Risiko, kein Backup.
- Secrets **nicht** per Mail schicken. Wenn jemand einen API-Key braucht,
  im Tool einen eigenen Key mit eigenem Namen anlegen (Resend, Stripe,
  ElevenLabs, Voyage erlauben das alle).
- `ONBOARDING.md` §12 verweist ab jetzt hierher; die Tabelle dort nicht
  parallel pflegen.

## 5. Offene Fragen (bitte beantworten, dann Tabelle ergänzen)

- Wer ist `mighani@skillbyte.de` (Vercel DEVELOPER)?
- Welcher Registrar hält die vier Domains wirklich — GoDaddy oder inwx/hetzner?
- Läuft MongoDB in Emergent oder in einem eigenen Atlas-Konto?
- Gibt es für das Webinar am 29.10. ein Zoom-/Streaming-Konto, und wer ist Host?
- Ist `stefan@argumentorik.com` auf Supabase, Sentry und PostHog bereits drin?
