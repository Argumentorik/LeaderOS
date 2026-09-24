# Tool-Zugänge — wer hat wo Zugriff, und was fehlt für `stefan@argumentorik.com`

> Stand 24.09.2026. Ziel: **Stefan (`stefan@argumentorik.com`) bekommt
> Zugang zu jedem Werkzeug, das er als Entwickler braucht**, und jedes Tool
> hat mindestens zwei Admins. `mert@argumentorik.com` folgt, sobald Eduard
> das Postfach freigeschaltet hat. Was hier mit ✅ steht,
> wurde direkt gegen die Plattform geprüft (API); alles mit ❓ konnte von
> hier aus nicht gelesen werden und muss im jeweiligen Dashboard nachgesehen
> werden. Dieses Dokument ersetzt die Tabelle in `ONBOARDING.md` §12.

**Team-Adressen:** `start@aiporate.com` (Mert, bisheriger Owner überall) ·
`mert@argumentorik.com` (Mert, neu — Postfach über Eduard `ek@argumentorik.com`) ·
`wj@argumentorik.com` (Wlad) · `stefan@argumentorik.com` (Stefan) ·
`ek@argumentorik.com` (Eduard).

---

## 1. Ist-Stand (geprüft)

| Tool | Wofür | Owner / Admin | Weitere Mitglieder | `stefan@argumentorik.com` | Geprüft |
| --- | --- | --- | --- | --- | --- |
| **GitHub** `aiporator/shipos` | Code, CI, Deploy-Trigger | `aiporator` (start@aiporate.com) · admin | `sbcodes` (Stefan) · write | ✅ write (GitHub-Login `sbcodes`) — für Merges/Settings auf **maintain** anheben | ✅ API |
| **Vercel** Team `aiporators-projects` (INHALE), Projekt `leaderos` | Hosting leader-os.de, Env-Vars, Domains | start@aiporate.com · OWNER | stefan@argumentorik.com · MEMBER · mighani@skillbyte.de · DEVELOPER | ✅ MEMBER — reicht für Deploys, Logs, Env-Vars | ✅ API |
| ↳ Einladung `wj@argumentorik.com` | — | — | **Einladung vom 19.05. ist abgelaufen, nie angenommen** | — | ✅ API |
| **Supabase** Projekt `srujvjjncrszhaaxepxf` (Org `skawjzvddehhmkwiltui`) | Postgres, Auth, Storage, RAG, pg_cron, Edge Functions | start@aiporate.com | ❓ | ❓ | ❌ nur Projekt lesbar, Mitglieder nicht |

Auffällig: außer `start@aiporate.com` hat **niemand** Owner-Rechte auf
irgendetwas. Fällt dieser Account aus (Passwort, 2FA-Gerät, Google-Konto),
steht das Projekt. Das ist der eigentliche Grund für diese Liste.

## 2. Nicht von hier prüfbar — im Dashboard nachsehen

| Tool | Wofür | Bekannter Login | Wo Mitglieder verwalten | `stefan@argumentorik.com` |
| --- | --- | --- | --- | --- |
| **Emergent** (`command-center-229`) | App-Backend (FastAPI), MongoDB, leaderos.de-App-Tier, Object-Store | start@aiporate.com | Emergent → Project → Settings → Team | ✅ Admin seit 24.09. — Onboarding: [`EMERGENT_ADMIN_ONBOARDING.md`](./EMERGENT_ADMIN_ONBOARDING.md) |
| **MongoDB** — läuft **in Emergent** (kein eigenes Atlas-Konto) | Nutzer, Sessions, Leads, Zahlungen, `login_attempts`, `webinar_leads` | über Emergent | Zugang = Emergent-Team-Mitgliedschaft | → Emergent |
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

## 3. Stefans Zugänge — Klickliste für den Owner (`start@aiporate.com`)

Stefan ist der Entwickler, der Emergent, Supabase und das Backend
diagnostiziert (siehe Incident 16.09.). Er hat heute nur GitHub + Vercel.
In dieser Reihenfolge freischalten — jede Zeile ist ein Invite an
`stefan@argumentorik.com`:

| # | Tool | Klickpfad | Rolle für Stefan | Warum |
| --- | --- | --- | --- | --- |
| 1 | **Emergent** (inkl. MongoDB) — ✅ **erledigt 24.09., Admin** | Emergent → Projekt `command-center-229` → Settings → Team → Invite | Admin | App-Backend deployen, Env-Vars, **Mongo**; ohne das kann er Login-/Mail-Incidents nicht beheben |
| 2 | **Supabase** | supabase.com/dashboard → Org `skawjzvddehhmkwiltui` → Team → Invite member | **Developer** (Owner nur, wenn er auch Billing sehen soll) | Postgres, pg_cron (die Jobs mit Timeouts am 16.09.), Auth, Storage |
| 3 | **GitHub** | github.com/aiporator/shipos → Settings → Collaborators → `sbcodes` → Role | write → **maintain** | PRs mergen, Labels/Branches verwalten, ohne Repo löschen zu dürfen |
| 4 | **Sentry** | sentry.io → Org `aiporate` → Settings → Members → Invite | Member (Team `leader-os` + `leader-check`) | Fehler aus Frontend/Backend sehen |
| 5 | **PostHog EU** | eu.posthog.com → Organization settings → Members → Invite | Member | Funnels, Session Replays für Bug-Reports |
| 6 | **Resend** | resend.com → Settings → Team → Invite | Member | Mail-Logs — Magic-Link-/Reminder-Zustellung prüfen |
| 7 | **Stripe** | dashboard.stripe.com → Settings → Team and security → Invite | **Developer** (sieht API-Logs + Webhooks, keine Auszahlungen) | Webhook-Fehler debuggen |
| 8 | **ElevenLabs**, **Voyage AI** | jeweils Workspace → Members | Member | Sprach-Modus und RAG-Embeddings |
| 9 | **Vercel** | — | bleibt MEMBER | reicht bereits |

Nicht nötig für Stefan: Ads-Konten (Meta, LinkedIn, Google), Search Console,
Cal.com, Drive-Wiki, Registrar — das ist Marketing bzw. Owner-Hoheit.

**Zweiter Owner überall:** parallel `mert@argumentorik.com` als Owner in
denselben Tools eintragen, sobald das Postfach steht — heute ist
`start@aiporate.com` auf allem der einzige Owner.

## 4. Was nach dem Eintragen zu tun ist

- Stefan loggt sich nach jedem Invite einmal ein und bestätigt — dann
  Spalte 5 der Tabellen auf ✅ setzen.
- 2FA für die neue Adresse überall aktivieren — ein zweiter Owner ohne 2FA
  ist ein zweites Risiko, kein Backup.
- Secrets **nicht** per Mail schicken. Wenn jemand einen API-Key braucht,
  im Tool einen eigenen Key mit eigenem Namen anlegen (Resend, Stripe,
  ElevenLabs, Voyage erlauben das alle).
- `ONBOARDING.md` §12 verweist ab jetzt hierher; die Tabelle dort nicht
  parallel pflegen.

## 5. Offene Fragen (bitte beantworten, dann Tabelle ergänzen)

- `mighani@skillbyte.de` (Vercel DEVELOPER seit 06.08.) — Skillbyte-Kollege? Wenn er nicht mehr mitarbeitet: entfernen.
- Welcher Registrar hält die vier Domains wirklich — GoDaddy oder inwx/hetzner?
- Gibt es für das Webinar am 29.10. ein Zoom-/Streaming-Konto, und wer ist Host?
- Ist `stefan@argumentorik.com` auf Supabase, Sentry und PostHog bereits drin?
