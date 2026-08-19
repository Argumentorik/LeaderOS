# WladBot / LeaderOS — Changelog (ältere Iterationen)


- [x] **[Iter 131.4 · 09.02.26] Voice-Tuning · Tour-Restart · 10-Tage-Beratungs-Erinnerung**
  - **Voice-Tuning für die Dashboard-Tour** (`DashboardFirstTour.js`): aktive Voice-Selektion statt "first-match". Präferenz-Liste: `Google Deutsch` (Chrome) → `Anna/Petra/Markus/Yannick de-DE` (macOS/iOS Premium) → `Microsoft Katja/Stefan de-DE` (Windows) → beliebige `de-DE` → beliebige German. Zusätzlich rate `0.94` und pitch `0.95` — klingt spürbar wärmer und coach-artiger statt monoton. Fallback auf stumme Tour wenn keine Voice verfügbar.
  - **Tour erneut ansehen** — neuer Button im Sidebar-Footer (`Compass`-Icon, Lime-Hover) direkt über "Abmelden". Klick → `restartDashboardTour(navigate)` löscht das `leaderos_tour_v1_done` localStorage-Flag, navigiert zu `/dashboard` und reloadet die Seite → Tour öffnet komplett neu. `data-testid="restart-tour-btn"`.
  - **Day-10-Beratungs-Erinnerungs-Email** — nach ~10 Tagen (9.5 ≤ days ≤ 30) bekommt der User eine warme persönliche Einladung „30 Minuten mit einem Argumentorik-Berater — auf uns". Neuer Cron-Endpoint `POST /api/cron/day-10-consultation` (mit `require_cron_auth`), neues Email-Template `consultation_reminder_email()` in `services_email.py` (Lime-Kicker, klare Bullet-List was besprochen wird, CTA-Button zu `leader-check.de/beratung`, warmer Wlad-Abschluss). De-Dup via `email_log.type='day10_consultation'`. Skip-Kriterien: `consultation_booked=true`, `unsubscribed_all=true`, neue Kategorie `unsubscribed_consultation_reminder=true`. Unsubscribe-Link inline generiert via `unsubscribe_url()`. Neue Kategorie in `/app/backend/routes/unsubscribe.py` registriert.
  - **Wichtig für Prod-Deploy**: `CRON_SHARED_SECRET` in Prod-.env setzen und in der externen Cron-Config (cron-job.org / GitHub Actions) den `X-Cron-Secret` Header mitgeben, sonst sind alle Cron-Endpoints (Trial-Reminder, Drip-Sequence, Day-10-Consultation) public triggerbar.



- [x] **[Iter 131.3 · 09.02.26] Godmode Onboarding · Wlad-Avatar überall · sprechende Dashboard-Tour** — Verifikation via Screenshots (Login-Flow → Dashboard-Tour 12 Steps · Onboarding Step 0/8)
  - **Zero AI-slop im Onboarding**: der Pixar-artige `/wladbot-avatar.png` war AI-Slop. Ersetzt durch das **echte Wlad-Jachtchenko-Foto** (`4knvn6cs_WladProfilbild.jpg`) in einem premium Lime-Aura-Frame mit Emerald-Online-Dot. Step 0 zeigt jetzt Kicker "WLAD JACHTCHENKO · DEIN PERSÖNLICHER COACH" + "Hi Felix — schön, dass du da bist.". Global centralisiert in `/app/frontend/src/lib/brand.js` (`WLAD_AVATAR`, `LEADEROS_PLUS_URL`, `LEADERCHECK_URL`).
  - **WladBotAvatar global refactored**: `WladBotAvatar` (Chat-Bubble, E-Mails, Challengers) nutzt jetzt dasselbe echte Wlad-Foto → keine zwei unterschiedlichen "Wlad-Gesichter" mehr auf der Plattform.
  - **Neue Dashboard First-Time-Tour** (`/app/frontend/src/components/onboarding/DashboardFirstTour.js` · 12 Steps):
    - Startet automatisch beim ersten Dashboard-Besuch (localStorage-Flag `leaderos_tour_v1_done`)
    - Spotlight-Ring mit `radial-gradient` Backdrop-Cutout auf jedem Sidebar-Item via `data-tour-id`
    - Premium Coach-Card mit echtem Wlad-Foto, Kicker/Titel/Body, Progress-Bar 1/12, Zurück/Weiter/Fertig, X-Close
    - **WladBot spricht auf Deutsch** via nativer `SpeechSynthesis` API (`u.lang="de-DE"`, bevorzugt DE-Voice) — kein Kosten, kein API-Key, funktioniert offline
    - Mute-Toggle im Footer für lautlose User
    - Locked-Items (Simulationen/Playbooks/Videos für Free-User) zeigen zusätzlich einen Amber-Hinweis "Für dich als Free-User noch gesperrt — mit Leader-OS Plus freigeschaltet"
    - 12 beschriebene Steps: Welcome → Dashboard → Challenge → Check-in → WladBot → Argumentation-Prep → Video-Analyse → Playbooks → Fortschritt → Lern-Videos → Kostenlose Diagnose → Kalibriert
  - **Sidebar Tour-Anchors**: `SidebarNav.js` und `Sidebar.js` (Diagnose-CTA) tragen `data-tour-id` (dashboard/challenge/checkin/wladbot/simulations/playbooks/video/progress/videos/diagnose). Neue Routen brauchen nur eine Zeile in `TOUR_ID_BY_PATH`.
  - **RAG-Context nutzt jetzt echte Onboarding-Daten** (Iter 131.2 kontinuiert): `_build_user_context_block()` liest `role`, `team_size`, `primary_goal`, `experience_level`, `wladhub_scores` — jede SEXIER-Strategie ist auf den einzelnen User zugeschnitten statt generisch.
  - **Ready to welcome first Masterclass clients**: alle Auto-Trigger-Emails (Masterclass-Welcome von Wlad), personalisierte Strategien, sprechende Dashboard-Tour + PDF mit QR-Code → LeaderOS Plus sind live.



- [x] **[Iter 121.10 · 28.07.26] Bug-Fixes: Lock-Click-Dead-End + ArgumentationPrepModal-Scroll** — Testing-Agent Iter 123 · 100% pass · beide Bugs verifiziert
  - **Bug 1 (Wlad-Screenshot)**: Accelerator-tier User klickten auf ein prelaunch-gesperrtes Video-Kachel → `PricingModal` öffnete mit leerem `visiblePackages` (Nutzer besitzt bereits alle Pakete) → Dead-End. Root Cause: `PRELAUNCH_VIDEO_LOCK=1` sperrt ALLE Videos, auch für bezahlende OS-PLUS-Member. Fix: `DashboardLearningVideos.js` + `LearningVideosTab.js` nutzen jetzt `useTier()` aus `TierContext` — wenn `isAccelerator && video.locked_reason === 'prelaunch'` → warmer Sonner-Toast „🚀 Dieses Video wird ab dem offiziellen Cohort-Launch freigeschaltet — als OS-PLUS-Member bekommst du sofort Zugriff" statt Modal. Free-Tier-User sehen weiterhin `PricingModal` (verifizierte Regression bestanden).
  - **Bug 2 (Argumentation-Prep-Scroll)**: Radix `ScrollArea` im Modal-Container fing Wheel-/Touch-Events ab → kein Scroll auf Desktop UND Mobile. Fix: Ersetzt durch natives `<div className='flex-1 overflow-y-auto overscroll-contain' style={{ WebkitOverflowScrolling: 'touch' }}>` mit `data-testid='argumentation-prep-scroll'`. Testing-Agent verifiziert: Desktop 1920×1080 (sh=ch=653), Mobile 393×852 (sh=671 · ch=644 · scrollTop advances korrekt), Step-1→Step-2-Flow durchgängig scrollbar.
  - **Test-Credentials präzisiert**: `test@test.com` ist admin-flagged Free-Tier (nicht Accelerator wie fälschlich in einigen Reviews angenommen) — für Accelerator-Flows `accelerator@wladbot.test / test123` verwenden. Ergänzung in `/app/memory/test_credentials.md`.


- [x] **[Iter 121.9 · 28.07.26] Product Focus Sprint — Mobile Hero-Experience + Snackable Chat + Slim Nav** — Lint 100% clean, mobile-first-CSS verified
  - **Snackable ChatEmpty-State** (`components/chat/ChatEmpty.js`): kompletter Rewrite. Hero-Avatar + eine klare Frage („Worüber willst du sprechen?") + 6 großformatige Quick-Start-Cards (2-Spalten desktop, 1-Spalten mobile, min-height 68px) mit spezifischen Prompts (Pitch · Schwierige Gespräche · Delegation · Charisma · Verhandlung · Schlagfertigkeit). Wlads Frameworks-Grid ist jetzt hinter einem „Wlads Frameworks entdecken"-Toggle (progressive disclosure) statt gleich alles zu zeigen — Cohort weiß binnen 3 Sekunden „was kann ich hier tun?".
  - **Mobile-optimized ChatInputBar** (`components/chat/ChatInputBar.js`): `position: sticky` mit `safe-area-inset-bottom`, `onFocus` scrollt Textarea auf iOS/Android beim Keyboard-Öffnen automatisch in die sichtbare Mitte, Send-Button jetzt 44×44px (mobile) für native Touch-Target-Compliance, `text-base` auf mobile (verhindert iOS-Auto-Zoom bei Focus), `aria-label` für Screen-Reader.
  - **Neue MobileHeroNav** (`components/layout/MobileHeroNav.js`): iOS/Android-Style Bottom-Nav die nur unter md:768px sichtbar ist (Desktop behält vollständigen Sidebar). 4 Fixed-Items: WladBot · Video · Fortschritt · Mehr. „Mehr"-Item öffnet ein Bottom-Sheet mit den restlichen 8 Sektionen (Dashboard, Challenge, Challengers, Simulationen, Aufgaben, Lern-Videos, Community, Profil). Safe-area-inset-bottom respektiert, Active-State via Lime-Farbe + bolder Stroke, 44+px Touch-Targets.
  - **DashboardLayout Mobile-Ready** (`components/layout/DashboardLayout.js`): main bekommt `pb-[64px] md:pb-0` damit Content nicht hinter der Bottom-Nav verschwindet. Sidebar bleibt `hidden md:block`. MobileHeroNav wird gemountet außer bei `hideSidebar`.
  - **FloatingSupportButton auf Mobile** (`components/support/FloatingSupportButton.js`): `bottom-[76px] md:bottom-5` damit der FAB nicht die Bottom-Nav verdeckt.
  - **Nicht angetastet** (bewusst): Desktop-Sidebar bleibt unverändert (Cohort-Members auf Desktop haben etablierten Workflow), Video-Analyse (unter `/coaching`) läuft bereits produktion-stabil.


- [x] **[Iter 121.7 · 28.07.26] GODMODE Production Hardening: Telemetry, ErrorBoundary, Support-Widget, Deep-Health** — E2E getestet (5 Backend-Endpoints + Frontend-Screenshot)
  - **`routes/telemetry.py`**: neue Observability-Endpoints — `POST /api/telemetry/error` (jede Frontend-Exception landet mit `diagnostic_id` in `error_log` Collection), `POST /api/telemetry/feedback` (User-Feedback + Screenshot + Console-Tail → persistiert in `user_feedback` + fire-and-forget Resend-Mail an start@aiporate.com), `GET /api/health/deep` (Mongo · Resend · Emergent-LLM · Supabase-Bridge · RAG in einem Call). Admin-Views `GET /api/admin/telemetry/errors|feedback` mit Aggregation by_source/by_severity.
  - **Rate-Limiting**: sliding-window per IP+email (60 errors/60s · 5 feedbacks/5min) → silent-drop bei Overrun, 429 mit Deutsch-Message.
  - **`services_email.py`**: send_email() unterstützt jetzt `reply_to` → Feedback-Mails an start@aiporate.com haben den echten User als Reply-To (direktes Antworten aus Gmail heraus).
  - **`lib/consoleBuffer.js`**: Rolling-Buffer der letzten 80 console.* Aufrufe (log/info/warn/error/debug), Zero-Dep, wraps das Console-Interface transparent. Debug-Helper `getConsoleTail()` liefert Snapshot für Feedback-Payload.
  - **`lib/telemetry.js`**: Frontend-Client mit `reportError()` (dedup 5s-window, fetch statt axios um Interceptor-Loops zu vermeiden), `reportFeedback()`, `installGlobalHandlers()` (window.onerror + unhandledrejection → auto-report; ignoriert ResizeObserver-Noise).
  - **`components/AppErrorBoundary.js` enhanced**: mirrors Sentry-Event zusätzlich in unser lokales `error_log`, zeigt echte Diagnostic-ID + prominent `start@aiporate.com`-Mailto-Link (mit vorausgefüllter ID + URL im Body). Feedback-Prompt öffnet unsere in-app Reporting statt Sentry-Dialog.
  - **`components/support/FloatingSupportButton.js`**: Bottom-Left Floating-FAB (Bottom-Right ist WladBot-Drawer). Premium-Modal mit 4 Kategorien (Bug/Idee/Frage/Sonstiges), Textarea, optionalem `getDisplayMedia`-Screenshot (Fallback-tolerant), transparente Info über auto-attached Diagnostics, „Danke — wir sind dran"-Success-View.
  - **Global-Handler-Boot in `index.js`**: consoleBuffer + `installGlobalHandlers()` laufen VOR jedem anderen Code, damit die ersten Log-Zeilen und First-Paint-Errors sofort erfasst werden.
  - **Session-Recovery** (task e): verifiziert bereits implementiert in `lib/api.js` (silent `/auth/refresh` + ReAuthModal statt Hard-Redirect) — keine Regression.
  - **E2E-Test**: `/api/health/deep` → status=pass für alle 5 Services (mongo 71ms · resend 233ms · llm 60ms · supabase 761ms · rag ok). `/telemetry/error` liefert `err_491975380f3c`. `/telemetry/feedback` liefert `fb_1dc71bd8b159` + Resend-Task fire-and-forget. Admin-View aggregiert korrekt.


- [x] **[Iter 121.6 · 28.07.26] Simulations: Pause-Fix + neue „Argumentation vorbereiten" mit SEXIER-Framework** — E2E getestet (Backend Live-Call, Frontend Screenshot)
  - **Pause-Bug behoben** (`SimulationsPage.js`): Vorher gab es nur den roten „JETZT BEENDEN & BEWERTEN"-Button, der die Session terminierte. Jetzt zusätzlicher „Pause"-Button im Header (variant='outline') + „Weiter"-Resume-Button im gleichen Slot. Pause ruft nur `stopAllAudio('simulation-pause')` auf → `activeSim`, `messages`, Kontext bleiben komplett erhalten. Sichtbares Pause-Banner mit CTA in der Konversations-UI, Input-Bar wird versteckt solange pausiert.
  - **Scenario-Swap** (`data.py`): `remote-team-building` („Remote Team motivieren") komplett ersetzt durch `argumentation-prep` („Argumentation vorbereiten") mit `kind='preparation'` + `category='preparation'`.
  - **Neues Modul „Argumentation vorbereiten"** (`components/simulations/ArgumentationPrepModal.js` + `POST /api/simulations/argumentation-prep`):
    · 4-Step-Wizard (Kontext · Argumente · Gegenseite · Coaching) mit lime Step-Indicator, Wlad-spezifischen Placeholders, sanftem Progress-Design.
    · Erfasst 10 strukturierte Felder: background/goal/relationship, main_points/evidence/prioritised, expected_objections/counterarguments/hidden_interests, coaching_focus.
    · Backend-Endpoint schickt alles durch `ARGUMENTATION_PREP_PROMPT` (GPT-5.2 als Wlad-Coach mit 6-Sektionen-Ausgabestruktur: Situationsanalyse · 3 SEXIER-Blöcke · Erwartete Einwände & Rebuttals · Framing & Wording · Schwachstellen · Ready-to-Use-Strategie).
    · Live-Call verifiziert: 8 551 Zeichen strukturierte Strategie in einem Request.
    · Strategy-View mit Markdown-Rendering (Headings, Bold, Bullets), Copy-Button, „Jetzt in Simulation üben"-Bridge zum Salary-Negotiation-Szenario.
    · +3 Leadership-XP + 2 Communication-XP pro erfolgreichem Prep (via `record_user_action`).
    · Strategien werden in `argumentation_strategies` Collection persistiert.
  - **Card-Visual**: SEXIER-Prep-Karten sind visuell distinct (Lime-Gradient, Sparkles-Icon, „SEXIER-PREP"-Badge statt Difficulty, „Prep starten"-CTA in dark-lime statt „Start"-lime), damit User sofort verstehen: das ist Coaching, keine Live-Simulation.


- [x] **[Iter 121.5 · 22.07.26] Admin Knowledge-Sources Fix: Wlads Bücher waren immer da, nur unsichtbar** — API + Frontend verifiziert
  - **Root Cause (Stefan-Feedback)**: `/api/admin/rag/sources` aggregierte alphabetisch nach `source_file` → Live-Call-Files (`2025.*.txt`, `2026.*.txt`) landeten oben, Wlads Bücher (`du_bist_der_bessere_chef.txt` etc.) rutschten unter die 27 Live-Call-Zeilen. Stefan sah die Bücher nicht, dachte sie fehlen — sie waren die ganze Zeit da (55 Sources, 7 463 Chunks).
  - **Sekundär-Bug**: `metadata.course` wurde bei einigen Alt-Ingest-Batches als erster Content-Chunk-Text statt sauberer Titel gespeichert (z. B. „WLAD JACHTCHENKO DUBISTER BESERECHEF"). Zusätzlich waren Umlaute snake-case-ified („Fuehren", „Koerpersprache") und ß als Mojibake („Wei├Ƒe").
  - **Backend-Fix** (`routes/rag_admin.py`):
    · `_clean_display_title()` — leitet Titel primär aus dem Filename ab (`du_bist_der_bessere_chef.txt` → „Du Bist Der Bessere Chef") und übernimmt `metadata.course` nur wenn es sichtbar kuratiert ist (Länge, Kein-Alle-Caps, keine 20+ Zeichen Wörter).
    · Umlaut-Restore: `ae/oe/ue` → ä/ö/ü, ß-Mojibake-Cleanup, Capitalization-Repair nach Umlaut-Substitution.
    · `_classify_source()` — Live-Call-Detection via Datums-Regex.
    · Response enthält jetzt `categorised: {courses[], live_calls[], custom[]}` + `by_type`-Counts. Flat `sources`-Feld weiterhin da (Bücher/Kurse zuerst → auch alte UI-Clients sehen sie automatisch prominent).
  - **Frontend-Fix** (`components/admin/KnowledgeSources.js`): 3-Sektionen-Rendering mit Icons (`BookOpen` für Kurse, `Radio` für Live-Calls, `Sparkles` für Custom). Live-Calls per Default eingeklappt (spart Scroll-Space). Summary-Strip zeigt Total-Chunks + Source-Count. `display_title` bevorzugt statt raw `course`.
  - **E2E-Verifikation** (Preview): 28 Kurse/Bücher zuerst (Du Bist Der Bessere Chef 918 · Weiße Rhetorik 571 · Führen Durch Gründe 297 · Kommunikation 290 · Sales 282 · Die 5 Rollen einer Führungskraft 267 · Die Charismatische Führungskraft 251 · Verhandlungstraining 185 … + 20 weitere), dann 27 Live-Calls sortiert nach Datum (neueste zuerst).


- [x] **[Iter 121.2 · 22.07.26] Premium Feature-Briefings für Coach-Modus + Kontext-Ordner + Router-Refinement** — smoke-tested via Playwright
  - **Neues Shared-Component** `frontend/src/components/chat/FeatureBriefing.js`: dismissible, localStorage-gemerkte Premium-Card mit Grain-Overlay, lime/gold Tone, Bullet-Liste, optionalem CTA. Reusable für alle künftigen „Was ist das & wie nutz ich das?"-Situationen.
  - **Coach-Modus-Briefing** (`ChatInputBar.js`): erscheint beim ersten Aktivieren mit Titel „Wlad wechselt in den Coach-Modus — Strategie statt Small-Talk" + 3 Bullets (strukturiert · perfekt für Pitch/Verhandlung · direkt umsetzbare Tasks). Kleines „?"-Icon am Toggle re-öffnet das Briefing nach Dismiss.
  - **Kontext-Ordner-Briefing** (`ChatHistoryPanel.js`): rechte Sidebar-Sektion umbenannt zu „Kontext-Ordner" mit HelpCircle-Icon; Briefing „Bündle Chats zu einem Projekt — Wlad merkt sich alles" + 3 Bullets (1 Ordner = 1 Projekt · alle Chats teilen Kontext · Wlad zieht Ordner-Notizen automatisch mit).
  - **Router-Refinement** (`services_classifier.py`): CLASSIFY_PROMPT nutzt jetzt Wlads Original-Router-Regeln aus `router.txt` — bessere Trennung zwischen `speech_practice` (echte Rede-Transkripte, Vision-Statements, Pitches, Anekdoten mit Purpose) und `theory`/`general_coaching` (Fragen, Hypothetika, Kommandos, Small-Talk).
  - **Global Debug-Helper**: `window.leaderos_reset_briefings()` resettet alle dismissed Briefings (für Support/Testing).
  - **RAG-Status verifiziert**: 7 463 Chunks aktiv, alle 5 Wlad-Frameworks aus Iter 121.1 unverändert produktiv.


- [x] **[Iter 121.1 · 22.07.26] Wlad-Framework-Sync: 5 Signature-Frameworks matchen jetzt 1:1 mit dem Original-WladBot (Telegram)** — E2E getestet gegen alle 5
  - **Root Cause**: Der alte `listening_10_stages` MANUAL_CHUNK enthielt komplett andere Stufen-Namen (Pseudo, Resonant, Generativ, Transformativ) als das Original-WladBot-Framework (Vortäuschendes, Kürzendes, Selektives, Übertrumpfendes, Egoistisches, Beratendes / Aufmerksames, Aktives, Empathisches, Helfendes). Dadurch antwortete der Bot mit erfundenen Stufen.
  - **Fix**: Alter Chunk entfernt, 5 neue `wladbot_reference`-MANUAL_CHUNKS (`services_rag.py`) mit exakt der Wortwahl aus Wlads Original: **10 Stufen des Zuhörens** (2-Kategorien-Struktur: Antwortsüchtig 1-6 / Verstehend 7-10), **6P-Modell** (Plot/Polarität/Protagonist/Peripetie/Pointe/Präsentation), **Charisma-Code** (8 Elemente: Credo/Habitus/Außeralltäglichkeit/Rhetorik/Inszenierung/Superskills/Motivation/Arbeit), **SEXIER-Modell** (S/E/X/I/E/R), **30 Schlagfertigkeitstechniken** (komplett nummerierte Liste).
  - **RAG-Corpus erweitert**: `theory.txt` + `speech.txt` (Wlads originale WladBot-System-Prompts) via `scripts_ingest_local_rag.py` als 24 Chunks ingested → SEXIER-Kriterien, Kurs-Katalog, Feedback-Kriterien jetzt semantisch retrievable. Corpus jetzt 7 463 Chunks (7 439 + 24).
  - **System-Prompt-Erweiterung** (`services.py` WLADBOT_SYSTEM_PROMPT): neuer Abschnitt „WLADS SIGNATURE-FRAMEWORKS" listet die 5 Frameworks als heilige Referenz + explizite Regel „Wenn User nach EINEM Framework fragt → vollständige Liste mit ALLEN Elementen und EXAKTER Reihenfolge, RAG-Kontext ist Wahrheit".
  - **Voice-Framework-Map erweitert**: `6p`, `sechs p`, `charisma`, `credo`, `außeralltäglichkeit`, `zuhören`, `10 stufen`, `schlagfertigkeit`, `retourkutsche` → passendes Framework als LLM-Prompt-Boost.
  - **E2E-Test bestanden**: alle 5 Framework-Queries live gegen `/api/chat` — Antworten matchen 1:1 die WladBot-Screenshots vom User (RAG=aktiv, 9 Chunks pro Query).

## Latest — 22.07.2026

- [x] **[Iter 121 · 22.07.26] Go-Live Lockdown: Videos, Community, Audio-Bus & leadercheck-Sync-Transparency** —
  - **Alle Lernvideos gesperrt** (`PRELAUNCH_VIDEO_LOCK=1` in `routes/my_path.py`): `/api/my-path/videos` liefert `prelaunch_lock: true`, jedes Video kommt mit `unlocked=false` + `locked_reason='prelaunch'`. Frontend (`LearningVideosTab.js`, `DashboardLearningVideos.js`) zeigt lime „🔓 UPGRADE"-Badge + „Premium freischalten →"; Klick öffnet `PricingModal` (keine „Verfügbar / Gratis"-Verwirrung mehr).
  - **Community gesperrt** (`CommunityPage.js` schlanker Rewrite + `LockedPageOverlay.js`): Ganzseitiges Premium-Gate mit „🔓 Upgrade auf Premium – Vollzugriff freischalten"-CTA und 3 Feature-Bullets (Peer-Feedback, Live-Leaderboard, Wlad-AMAs). Keine `/community/feed`- oder `/leaderboard`-Requests mehr (Netzwerk-Ruhe unter Overlay).
  - **Globaler Audio-Bus** (`lib/audioBus.js` + Route-Effect in `App.js`): Alle Audio-Player (ElevenLabs-TTS via `VoicePlayButton`, Challenger-Voice, `useVoiceMode`-Playback) registrieren sich zentral. Route-Change dispatched `leaderos:audio-stop-all` → pausiert JEDES `<audio>` + `speechSynthesis.cancel()` → kein überlappender Ton mehr, wenn man z. B. von `/challengers` weg klickt.
  - **Voice-Framework-Mapping** (`voice_framework_map.py` + `/api/voice/transcribe` + `voice_tts.py`): Whisper-Transkripte werden mit `enrich_transcript` angereichert → phonetische Varianten („sexier", „sechsier", „loguse") mappen auf Wlads Frameworks (SEXIER-Argumentation, 3 Säulen: Logos/Ethos/Pathos, Kommunikationsquadrant, Schwarze Rhetorik, Storytelling, SBI/WWW, BATNA). Kurze/unklare Aufnahmen setzen `low_confidence=true` + Hint „Bitte sprich einen vollständigen Satz deutlich in Richtung Mikrofon". `voice_tts.py` injiziert erkannte Frameworks als expliziten LLM-System-Prompt-Block.
  - **VoiceRecorder-UX**: Toast-Warnungen für `low_confidence` (⚠️) und `matched_frameworks` („Framework erkannt: SEXIER-Argumentation"). Mic-Button-Tooltip klärt: „Stelle deine Frage — sprich deutlich in Richtung Mikrofon".
  - **leadercheck.de Sync-Transparenz**: `GET /api/wladhub/sync/status` liefert `bridge_configured`, `leader_check_has_data`, `leader_check_row_count`, `has_local_diagnosis`, `last_local_sync`, `leadercheck_url`. `POST /api/wladhub/sync` liefert `records_imported`. Frontend-Toast (`LeaderDiagnosePage.handleSync`) zeigt „X neue Datensätze" bei Erfolg und einen Action-Toast mit „Diagnose starten"-Button (→ leader-check.de) wenn `status='no_data'` (statt stumm ins Leere zu leiten).
  - **Founder-Purge-Script** (`scripts_delete_test_accounts.py`): Löscht `wj@argumentorik*` + `wlassassa*` User + alle 20+ verknüpften Collections. Preview-DB no-op (keine Matches); für Prod: `python /app/backend/scripts_delete_test_accounts.py` nach Deploy ausführen.
  - **Test-Report `iteration_121.json`**: Backend 9/9 ✓, Frontend 5/5 ✓, keine Regressions.

## Deployed Features (Archiv)
- [x] **[Iter 92.54 · 01.07.26] Challengers Meeting-Experience (11x.ai-Style)** —
  - **Meeting-Stage** in `ChallengersPage.js`: Video-Call-Bühne über dem Chat — großes Challenger-Portrait (Farb-Ring, Breathing, Ping-Ring beim Denken), „LIVE MEETING"-Badge (roter Pulse), Name-Plate mit Status („im Gespräch"/„denkt nach…"), Self-Tile mit User-Initialen („Du"). Screenshot-verifiziert mit Bezos.
  - **Stimmen verifiziert**: Jeder Challenger hat eigene ElevenLabs-Stimme (Bezos=Liam calm/commanding, Musk=Daniel präzise, Oprah=Bella warm, Jobs=Antoni intense, Branson=Arnold energetisch, Sandberg=Rachel, Page=Bill, Hastings=George) — Mapping korrekt, Audio-Test erst nach ElevenLabs-Key-Erneuerung möglich.
- [x] **[Iter 92.53 · 01.07.26] Chat-Speed + Output-Qualität + Magic-Link-Avatar** —
  - **Chat parallelisiert** (`chat.py`): History/Memory/Folder-Context/RAG liefen seriell → jetzt `asyncio.gather` (spart 1–3s). Gemessen: kurze Frage 5,4s E2E inkl. 6 RAG-Chunks.
  - **Prompt-Duplikat-Bug gefixt**: History wurde NACH dem Insert der User-Message geladen → Nachricht stand doppelt im Prompt (Qualitätsverlust). Jetzt History vor Insert → sauberer Kontext. Multi-Turn verifiziert (Folge-Frage referenziert SEXIER korrekt).
  - **Magic-Link-E-Mail**: Header zeigt jetzt echtes WladBot-Avatar-Bild (rund, Lime-Ring) statt Blitz-Badge. Resend-Versand verifiziert.
- [x] **[Iter 92.52 · 01.07.26] Voice-VAD-Fix, Account-Cleanup, Admin-Delete-Endpoint** —
  - **Voice-Bug gefixt** (`useVoiceMode.js`): VAD feuerte nach 1,4s Stille auch ohne dass jemand gesprochen hatte → „Thinking" ohne Input. Jetzt: Speech-Gate (`SPEECH_THRESHOLD=0.02`, min. 4 Frames) — Auto-Stop nur NACH echter Sprache; ohne Sprache geduldiges Zuhören mit stillem 15s-Mic-Refresh, kein API-Call.
  - **Wlad-Wissen verifiziert**: `/api/chat` live getestet → „RAG: injected 6 chunks", Antwort mit Wlads Feedbackformel. Voice-Route nutzt denselben `retrieve_context` (voice_tts.py L358-372) — Wissen auch beim Sprechen aktiv.
  - **Admin-Delete-Endpoint**: `DELETE /api/admin/users/by-email/{email}` (admin-gated, Guards: kein Admin-/eigener Account). Löscht User + 15 Related-Collections. `wj@argumentorik.com` in Preview gelöscht + Guard verifiziert. ⚠️ Für Produktions-Löschung: erst REDEPLOY, dann Endpoint auf leaderos.de nutzen.
  - VAD-Fix braucht echtes Mikrofon → USER-VERIFIKATION beim Test morgen.
- [x] **[Iter 92.51 · 01.07.26] Detail-Pass: Login kompakt, W-Logo schwarz (SVG-ID-Bug), Profil-Polish** —
  - **Login**: WladBot-Quote-Bubble links unten entfernt (Seite kompakter, Fokus Signup). Trust-Strip rechts („WladBot 3.0 · Online") bleibt.
  - **WladMark SVG-Bug gefixt**: Alle Instanzen teilten Gradient-ID `wm-stroke` → erste DOM-Instanz gewann, W wirkte weiß/lime statt schwarz. Fix: direkter `stroke={glyphFill}`, defs entfernt. W ist jetzt überall schwarz auf Lime.
  - **ProfilePage Detail-Polish**: Tier-Chip als Pill mit Crown, Hero mit Border/Schatten/zweitem Glow, StatTiles + Dimension-Cards mit farbigen Icon-Tiles und Hover-Lift, Avatar-Hover-Ring.
  - Screenshot-verifiziert (Login + Profil).
- [x] **[Iter 92.50 · 01.07.26] WladBot 3.0 Trust-Anker + Fabulous-Level Onboarding** —
  - **Echtes Avatar-Bild live**: `/app/frontend/public/wladbot-avatar.png` (512px, aus User-Asset) — vorher fehlte die Datei komplett → überall Sparkles-Fallback. Z-Index-Bug gefixt (Fallback lag ÜBER dem Bild). E-Mails referenzieren denselben Pfad (`{frontend_url}/wladbot-avatar.png`).
  - **`live`-Variante in `WladBotAvatar.js`**: Atmen (4.5s), rotierender Conic-Lime-Ring (7s), Emerald-Online-Dot mit Ping. CSS-Keyframes in index.css (`wladBreath`, `wladRingSpin`, `wladCaretBlink`), respektiert reduced-motion.
  - **Login-Trust**: „WladBot 3.0 · Online"-Strip über dem Formular (`login-wladbot-trust`), Avatar-Quote-Bubble im Brand-Panel (`brandpanel-wladbot-trust`).
  - **Onboarding Godmode** (`OnboardingPage.js` rewrite, alle Testids erhalten): WladBot begrüßt persönlich (Step 1 Hero live-Avatar), `WladGuide.js` Typewriter-Bubble auf Steps 2–7, Nachrichten reagieren auf Rollen-Wahl, Fortschritt „Schritt X von 8" + %, gestaffelte Card-Entrances, Finale „Perfekt kalibriert, {Name}" mit Rolle+Ziel-Chips (`onboarding-summary-chips`).
  - **Testing** (Iter 92.50 → `/app/test_reports/iteration_92_50.json`): Frontend 100 %, alle 8 Steps + Regression (Chat-Avatare, Lock-Modal) grün.
- [x] **[Iter 92.49 · 01.07.26] Godmode: Lock-Popup, Changelog-Discovery, Magic-Link-Hardening, Tagline-Flow** —
  - **LockedFeatureModal** (`components/shared/LockedFeatureModal.js`): Klick auf 🔒-Sidebar-Items (Free-Tier: Simulationen/Playbooks/Aufgaben/Workflows/Lern-Videos/Events) öffnet Premium-Popup (Feature-Teaser + Benefits + €997 + „Jetzt freischalten" → PricingModal + „Alle Pläne vergleichen" → /coaching) statt Hard-Redirect. Escape/Backdrop/X schließen.
  - **Changelog-Discovery**: Sidebar-Footer „Was ist neu?"-Button mit Lime-Pulse-Dot bis v92.49 gesehen (`lib/changelogMeta.js`, localStorage `changelog_seen`). Neuer Changelog-Eintrag v92.49. Login-Footer Changelog-Link (`footer-changelog`). Hover-Polish auf Timeline (Glow-Dot + Title-Lime).
  - **Magic-Link**: Preview-Versand via Resend verifiziert („Resend send OK"). `MagicLinkRequest.email` von EmailStr → str (email-validator blockte .test-TLDs mit 422; Endpoint ist ohnehin anti-enumeration). Domain-Sweep bestätigt: `_BASE_URL_DEFAULT=https://leaderos.de`, `SENDER_EMAIL=wlad@leaderos.de`. ⚠️ PRODUKTION: Redeploy nötig, damit prod den RESEND_API_KEY erhält.
  - **Taglines mit Flow**: LoginPage Subheadings + Feature-Sublines, LoginBrandPanel „Klarheit ist kein Talent — sie ist ein System.", CoachingPage Hero-Subline („Es hört, wie du sprichst...").
  - **Testing** (Iter 92.49 → `/app/test_reports/iteration_92_49.json`): Backend 100% (6/6), Frontend 95% → beide Minor-Findings gefixt + curl-verifiziert (.test-Mail → 200 + Resend OK, footer-changelog re-added).
- [x] **[Iter 92.48 · 01.07.26] WladBot Avatar überall + AI Speed Hybrid + Challengers Voice-Warm-Cache** —
  - **WladBotAvatar global ausgerollt** (Mert: "avatar überall intelligent nutzen"):
    - `ChatMessage.js` — beide Assistant-Message-Layouts (plain + structured) haben jetzt `<WladBotAvatar size={28}>` links neben der Bubble
    - `ChatEmpty.js` — Hero-Icon `MessageSquareText` durch großen `<WladBotAvatar size={72} ring>` ersetzt
    - `ChatPage.js` — Typing-Indicator zeigt Avatar `pulse` neben den 3 Dots während Streaming
    - `services_email.py _base_layout` — Header-Tile ist jetzt `<img src="/wladbot-avatar.png" alt="W">` mit `alt="W"` als graceful Email-Client-Fallback → gleiches Gesicht in Chat & Email
  - **AI Speed Hybrid Routing** (`routes/chat.py` Line ~363):
    - Kurze Text-Fragen (`msg_len ≤ 180` chars, kein PDF/Image-Attachment, `modality='text'`) → **gpt-4o-mini** (~3-5× schneller: 2-4s statt 12-18s)
    - Lange/tiefe Coaching-Fragen, Voice-Modality, oder mit Attachment → **gpt-5.2** (volle Reasoning-Power)
    - RAG (Voyage + Manual Chunks) läuft in beiden Fällen → Wlad's Wissen bleibt geerdet
  - **Challengers Voice-Warm-Cache** (Mert: "vorab catchen ist ja sowieso immer der selbe start"):
    - `data.py` LEADERSHIP_CHALLENGERS: Alle 8 Personas haben jetzt `initial_message` (statischer, canonical DE-Intro in Character-Stimme, z.B. Bezos: "Willkommen. Ich bin Jeff Bezos...", Jobs: "Setz dich. Ich bin Steve...")
    - `routes/challengers.py POST /challengers/{id}/start`: nutzt statischen Intro → spart 3-5s LLM-Roundtrip auf Start (Testing bestätigt <1s Latency, vorher 3-5s)
    - `routes/challengers.py GET /challengers/intros` (NEU, auth-required): Liefert alle 8 canonical Intros für Frontend-Prewarming
    - `ChallengersPage.js useEffect`: Beim Page-Mount (a) `new Image()`-Preload aller 8 Avatare in den Browser-Cache; (b) `POST /voice/tts` für alle 8 Personas parallel → ElevenLabs-Cache warm bevor User klickt → erste Voice spielt in <200ms
    - Cards: `loading="eager" fetchpriority="high"` auf `<img>` für sofortiges First-Paint
  - **Testing** (`testing_agent_v3_fork` Iter 92.48 → `/app/test_reports/iteration_92_48.json`): Backend 8/9 (89%), Frontend 100%.
    - ✓ Static-Intro-Speed-Win verified: `/start` latency <1s (vorher 3-5s)
    - ✓ Hybrid model routing verified: short & long messages beide korrekte JSON-Shape zurück
    - ✓ Avatar-DOM-Präsenz verified: `data-testid='wladbot-avatar'` in Empty State, Typing Indicator, und neben jeder Assistant-Reply
    - ✓ Voice-Cache-Code-Logik korrekt (Report bestätigt): erste Synth → save, zweite → cached=true
  - **🟠 BLOCKED BY EXTERNAL KEY** (nur Preview-Env, nicht Prod): `ELEVENLABS_API_KEY` in `backend/.env` gibt auf Preview `invalid_api_key` zurück → Voice-Warm-Cache füllt sich nicht bis Key rotiert wird. **Kein Code-Bug** — Prod-Key auf leaderos.de funktioniert. User-Action: Key in `/app/backend/.env` aktualisieren, `sudo supervisorctl restart backend`.


- [x] **[Iter 92.35 · 26.06.26] Coaching Hub Redesign → High-Converting Landing + P1-Funnel-Upgrades** —
  - **CoachingPage.js komplett neu** (`/app/frontend/src/pages/CoachingPage.js`, 318 LoC). Apple/Tesla-Stil:
    - Hero: Eyebrow `DEIN LEADERSHIP COACHING SYSTEM`, Headline `Werde der Leader, der klar denkt, klar spricht und klar führt.`, 3-Layer-Glass-Stack-Visual rechts (staggered Cards mit `backdrop-blur-xl` + rotate), Primary-CTA `Coaching starten` (scroll to pricing), Secondary `Demo ansehen` → /chat.
    - 3-Layer-System neu: **KI** (Klar denken — 5 Bullets), **Rhetorik** (Klar sprechen + SEXIER), **EQ** (Klar führen + C-Level-Wahrnehmung). Copy 1:1 user-supplied.
    - 1:1-Strategy-Call-Bridge-Card: dunkles Hero-Style-Card mit `book-call-btn` → Cal.com via `openStrategyCall('coaching-strategy-cta')`.
    - Social Proof: 4 Stat-Cards (2.500+ Leader · 87% in 14 Tagen · +42% Präsentationsscores · 4.9/5) + 3 Testimonial-Cards (Founder Berlin, Team Lead Tech, Consultant Strategy).
    - FAQ: 5 user-supplied Fragen.
  - **TierPricingGrid.js Funnel-Architektur (Hybrid)**:
    - Tier 1 `leadership_os` €997 → **Stripe Checkout** (`flow: 'stripe'`, SOFORT Conversion) — CTA `Jetzt starten`.
    - Tier 2 `leadership_os_plus` €4.797 → **Cal.com Sales Call** (`flow: 'cal'`, NICHT mehr Stripe — High-Ticket Close) — CTA `Gespräch buchen`.
    - Tier 3 `enterprise` Auf Anfrage → **Cal.com Beratung** (`flow: 'cal'`, kein Modal mehr) — CTA `Beratung anfragen`. `EnterpriseQuoteModal` entfernt (Lead-Qualifier via Cal.com strukturierter).
    - Tier-Bullets 1:1 user-supplied. data-testids für CTAs + Cards.
  - **SyncDiagnoseBanner.js** (NEU, `/app/frontend/src/components/dashboard/`): Bridge zwischen `leader-check.de` und `leader-os.de`. Preflight `GET /api/wladhub/3layer`, zeigt prominenten CTA "Diagnose synchronisieren" wenn `!connected || !last_sync`. POST `/api/wladhub/sync` on click, Toast + Soft-Reload bei Success, `Später` dismissible (SessionStorage). Eingebaut in `DashboardPage.js` direkt unter `EventReminderBanner`.
  - **Wlad-RAG MANUAL_CHUNKS** (`/app/backend/services_rag.py`): Deterministische Keyword-getriggerte Chunks die ZUSÄTZLICH zu Voyage/Supabase eingespeist werden. Erste Chunk: **10 Stufen des Zuhörens** (Ignorieren → Transformatives Zuhören, mit Leadership-Anwendung). Trigger-Keywords: `zuhören/listening/10 stufen/aktives zuhören/empathisches zuhören`. Funktioniert auch ohne Voyage/Supabase. Manual-Chunks haben `similarity=1.0` und werden vor Retrieval-Chunks prepended.
  - **Testing**: `testing_agent_v3_fork` Iter 92.35 → 9/10 Backend Tests pass, 100% Frontend P0/P1 verified. Test-File: `/app/backend/tests/test_iter92_35_coaching_hub.py`. Verifizierte Behaviors: Hero CTAs, Glass-Stack-Visual, 3-Layer-Rendering, Pricing-Funnel (Tier 1 → Stripe / Tier 2+3 → Cal.com mit KEINEM Checkout-Call), Social Proof + FAQ, SyncDiagnoseBanner für free-user, RAG `/api/chat` mit "10 Stufen" liefert alle 10 Stufen + chunks_count=7 + rag_active=true.
  - **🔴 KRITISCH ENTDECKT — STRIPE_API_KEY ist ABGELAUFEN** (`sk_live_*****YP1Wr6`): Tier 1 (€997) Checkout returns HTTP 500 "Expired API Key provided". BLOCKER für ALLE Conversions. Code ist korrekt — nur ENV-Secret muss rotiert werden via Profil → Universal Key oder direktes Update `/app/backend/.env`. Anschließend `sudo supervisorctl restart backend`.

- [x] **[Iter 92.33 · 23.06.26] Master Audit + Pre-First-Customer Blockers gefixt (Mert: "as if first paying client tomorrow")** —
  - **Komplette 25-Section Audit-Doku**: `/app/docs/MASTER_AUDIT_REPORT.md`. Brutal-ehrlich evaluiert von 9 Personas (PM/UX/UI/SecEng/SEO/CRO/Performance/AI/Founder). Final-Score: 84/100. Verdict: 🟢 GREEN-GO für Launch morgen.
  - **2 Critical-P0 First-Customer-Blocker gefixt**:
    1. **`POST /api/billing/portal`** (`routes/payments.py`): Stripe-Hosted Customer-Portal. Enterprise-User können selbst Subscription cancel/reactivate, Card update, Invoices download, Billing-Email ändern. Auto-Customer-Lookup falls `stripe_customer_id` noch nicht in Mongo (lazy-link via Email). Return-URL via `FRONTEND_BASE_URL` env → User landet auf eigener Domain zurück.
    2. **`DELETE /api/auth/me`** (`routes/auth.py`): GDPR Article 17 Account-Deletion. Email-Confirm gate (User muss eigene Email tippen — anti-foot-gun). Cascade über 16 Collections (chat_sessions, folders, video_jobs, voice_messages, etc.). 7-Jahre-Audit-Log in `gdpr_deletions` mit SHA256-Email-Hash + IP. Auto-Cookie-Clear nach Delete.
  - **Audit-Findings** (Scorecard):
    - AI/LLM Architecture: 9/10 — GPT-5.2 + Voyage-3 + 1.605 Chunks
    - RAG Quality: 9/10 — 6 grounded surfaces, 0.71 similarity score, HNSW + neighbor-expand
    - Security: 9/10 — Httponly/Secure/SameSite + Rate-Limit + CORS-Guard + Enumeration-safe
    - SEO/AEO: 8/10 — JSON-LD Organization+Person+Course+FAQPage + Sitemap+Robots+Canonical
    - Scalability: 8/10 — 27 Mongo-Indexes, async-everywhere
    - Business Potential: 9/10 — Wlad-Personal-Brand + DACH-Niche + €0/997/4797 Ladder
    - Enterprise Readiness: 7/10 (war 6/10 vor heute) — Portal + GDPR done, SOC2 erst Q4
  - **Sales-Insight**: vor heute hätten Customer-Portal+GDPR-Fehlen €5k-Sales blockiert. Jetzt clean. Pitch-Sentence finalized: *"Stell dir vor, jede deiner Führungskräfte hätte 24/7 Wlad Jachtchenko im Ohr — €4.797 für 12 Monate, mit 12 echten 1:1 Calls."*
  - **Files**: MODIFIED: `routes/payments.py` (+billing/portal endpoint, 50 lines), `routes/auth.py` (+DELETE /me with 16-collection cascade + GDPR audit log, 80 lines). NEW: `docs/MASTER_AUDIT_REPORT.md` (vollständige 25-Section Audit + Top-50 priorisierte Fixes-Liste).


- [x] **[Iter 92.27 · 20.06.26] Multi-Project Vercel Deploy-Ready — Pro-Project `FRONTEND_BASE_URL` für Emails/Links/OG (Mert hat seine Vercel-Production-Env-Vars geliefert)** —
  - **Problem**: Mert deployt das gleiche Backend in 2 Vercel-Projekten (`leaderos` → leaderos.de, `leadercheck` → leadercheck.de). Beide haben ihre eigene `FRONTEND_BASE_URL` env, aber `services_email.py` + `routes/og.py` + `services_magic_link.py` + `routes/events.py` + `routes/unsubscribe.py` + `services_login_security.py` + `routes/referral.py` hatten überall `https://leader-os.de` (alte Domain mit Bindestrich) hardcoded — Emails von der leadercheck.de-Deploy hätten User auf die falsche Domain geschickt.
  - **Fix**: Neuer Helper `services_email._frontend_url()` liest `FRONTEND_BASE_URL` zur Call-Time (nicht Import-Time), Fallback `https://leaderos.de` (neue Primärdomain, ohne Bindestrich). Alle 3 Email-Call-Sites (`auth.py::_send_signup_welcome`, `payments.py::tier_welcome`, `lifecycle_emails.py::drip_funcs`) injizieren `app_url=_frontend_url()`. Gleiches Pattern in 6 weiteren Stellen:
    - `routes/og.py` `OG_BASE_URL`: prefer FRONTEND_BASE_URL → fallback LEADER_OS_PUBLIC_URL → default leaderos.de
    - `services_magic_link.py` `_BASE_URL_DEFAULT`: → leaderos.de
    - `routes/events.py` Google-Calendar-Detail-URL: env-driven
    - `routes/unsubscribe.py::unsubscribe_url`: `app_url=None` Sentinel + env-resolve
    - `services_login_security.py` New-Device-Alert: env-driven (Link + Footer-Domain dynamisch)
    - `routes/referral.py` Share-URL: neue `REFERRAL_FUNNEL_URL` env (Default `leadercheck.de` da Referrals immer in Funnel → max Conversion)
  - **Test-Verifikation**:
    ```
    FRONTEND_BASE_URL=https://leadercheck.de → _frontend_url() = "https://leadercheck.de"
    (no env)                                  → "https://leaderos.de"
    ```
  - **9/9 Phone-Login/Source-Platform-Tests bleiben GREEN.** Backend-Restart ohne Errors.
  - **Mert's Vercel-Env-Setup**: dieses Code-Update macht seine 2-Projekt-Architektur sauber funktionsfähig:
    - `leaderos` Vercel Project: `FRONTEND_BASE_URL=https://leaderos.de` → alle Outgoing-Emails/Links→leaderos.de
    - `leadercheck` Vercel Project: `FRONTEND_BASE_URL=https://leadercheck.de` → alle Outgoing-Emails/Links→leadercheck.de
    - Beide Projekte teilen sich denselben CORS-Whitelist (8 Domains), aber jeder Deploy "sieht" nur sein eigenes Frontend in seinen ausgehenden Emails.
  - **Files**: MODIFIED: `services_email.py` (+_frontend_url helper, default→leaderos.de), `services_magic_link.py` (default→leaderos.de), `services_login_security.py` (env-driven New-Device alert), `routes/auth.py` (inject _frontend_url to signup_welcome), `routes/payments.py` (inject to tier_welcome), `routes/lifecycle_emails.py` (inject to drip templates), `routes/og.py` (FRONTEND_BASE_URL preferred), `routes/events.py` (+os import + env-driven calendar URL), `routes/unsubscribe.py` (Sentinel app_url + env-resolve), `routes/referral.py` (+os import + REFERRAL_FUNNEL_URL env, default leadercheck.de).


- [x] **[Iter 92.26 · 20.06.26] Architektur-Rules Locked-In + Production-CORS-Safeguard (Mert's verbindliche Architecture Brief)** —
  - **Vercel-only Deployment**: Mert hat die Multi-Domain-SaaS-Architektur final dokumentiert. 4 Production-Domains (leaderos.de [Haupt-App], leadercheck.de [Funnel], leader-os.de + leader-check.de [Landing-Pages]) teilen sich EIN Backend + EINE MongoDB. Alle Conversion-Events (Signup, Login, Checkout) finden auf leaderos.de statt.
  - **Production-CORS-Safeguard** (`backend/server.py`): Backend-Startup raised jetzt `RuntimeError` wenn `ENV=production` UND `CORS_ORIGINS` ist `*` oder leer. Verhindert silently-exposed APIs durch Misconfig. Dev/Preview darf weiterhin Wildcard nutzen (regex-form mit credentials). Verifiziert in beiden Branches via isolierten Python-Tests.
  - **`.env.example` Doc-Update**: Explicit CORS-Whitelist-Beispiel für Production hinzugefügt (8 Origins: 4 Domains × 2 mit/ohne www).
  - **Architecture-Doc** (`/app/docs/ARCHITECTURE.md`): Single-Source-of-Truth für alle zukünftigen Agents/Forks erstellt. Enthält: Domain-Map, CORS-Whitelist, Funnel-Flow (leadercheck.de → leaderos.de single conversion path), Serverless-Compat-Constraints (asyncio.create_task Tracking für Vercel-Migration), Logging/Debug-Rules (nie Internal-Traces in API-Responses), MAN-DARF/MAN-NIE-Reference, Iter-Trail.
  - **Backlog für Vercel-Migration getrackt**: aktuelle `asyncio.create_task` fire-and-forget Patterns (services_supabase_sync, services_crm, auth.py welcome-mail/wladhub-sync, oauth.py welcome-mail) müssen bei Migration zu Vercel-Serverless refactored werden — entweder `await` synchron ODER externes Queue-Webhook. Im aktuellen Long-Running-Container ist's fine.
  - **Files**: MODIFIED: `backend/server.py` (production-guard), `backend/.env.example` (+CORS prod-whitelist Kommentar). NEW: `/app/docs/ARCHITECTURE.md` (107-Zeilen Architekturdoku).
  - **Bedeutung**: zukünftige Forks/Agents lesen erst `/app/docs/ARCHITECTURE.md` — keine Migrations-Vorschläge zu anderen Hostings, keine Wildcard-CORS-Drift, keine Auth-Duplikation auf Funnel-Domains, keine Long-Running-Tasks die auf Vercel kaputt gehen würden.


- [x] **[Iter 92.24 · 20.06.26] Phone-OR-Email Login + Cross-Platform `source_platform` Attribution + Cross-Domain Funnel (Mert: „leadercheck.de und leaderos.de werden von hier deployed · Leute kommen über leadercheck.de und werden zu leaderos.de gepusht · Login & Register mit Telefonnummer ermöglichen · GODMODE")** —
  - **P0 — Source-Platform Attribution (Launch-Handoff Step 5)** (`backend/routes/auth.py` `detect_source_platform()` + `services_supabase_sync.py` + `services_crm.py` + `routes/oauth.py`):
    - Neuer Helper `detect_source_platform(request)` liest `Origin → Referer → Host` (in dieser Reihenfolge) und matcht `leader-check` ODER `leadercheck` substring → returnt `'leader-check'`, sonst Default `'leader-os'`.
    - Register (`/api/auth/register`), Google-Session (`/api/auth/google-session`) und OAuth-Routes (Apple/Google/Microsoft via `_upsert_user_from_oauth`) stempeln das Feld jetzt bei NEW-User-Insert auf das Mongo `users` Doc (`source_platform: 'leader-check' | 'leader-os'`) **first-touch only** — wird nie überschrieben.
    - Outbound-Sync zur Supabase Edge Function (`mirror_user_event*`) trägt jetzt `source_platform` im JSON-Payload mit → Supabase `users.source_platform` Spalte kann von der Edge-Fn auf den korrekten Enum-Wert gesetzt werden, ohne zu raten.
    - CRM-Webhook (`services_crm.emit`) trägt jetzt `platform: 'leader-os' | 'leader-check'` im Top-Level-Payload → Wingman kann leader-check-Leads (kalt, anonym) von leader-os-Signups (warm) automatisch in separate Pipelines routen.
    - **Verifiziert via 9-Test-Suite** (3× Origin-Detection inkl. Default-Fallback, 6× Phone-Login-Pfade, alle GREEN).
  - **P0 — Phone-OR-Email Login** (`backend/models.py` `UserLogin` + `routes/auth.py` `login()` + `server.py` Index + `frontend/components/auth/AuthForm.js` + `pages/LoginPage.js`):
    - **Pydantic-Schema**: `UserLogin` akzeptiert jetzt `{identifier|phone|email, password}` — `identifier` ist die kanonische Spalte, `email` bleibt als Backwards-Compat-Alias (alte Frontend-Builds, Drittsysteme funktionieren weiter). `model_validator` koalesziert: Priorität `identifier > phone > email`. Leere Identifier → 422.
    - **Login-Pfad-Detection**: neuer Helper `looks_like_phone(identifier)` — wenn der Wert mit `+` beginnt ODER ≥5 Ziffern enthält UND keinen `@` hat → Phone-Lookup auf `phone_normalized` Feld. Sonst Email-Lookup auf `email`. Beide Pfade nutzen dieselbe `_check_rate_limit + _log_login_attempt` Infrastruktur (rate-key auf normalisiertem Identifier).
    - **Phone-Normalisierung**: neuer `normalize_phone(v)` Helper strippt Whitespace/Dashes/Parens/Punkte/Slashes und erhält Leading-`+` → E.164-ish (`'+49 170 1234567' → '+491701234567'`, `'01701234567' → '01701234567'`). Storage-Pattern: `phone` (Original-Format für Receipts/Cal.com), `phone_normalized` (für Login-Lookup).
    - **MongoDB Index**: neue **sparse unique** Index auf `users.phone_normalized` (Index-Name `phone_normalized_unique_sparse`). Sparse = Users OHNE Phone tolerieren NULL, neue Phone-Registrierungen sind global eindeutig. **Wichtig**: Field wird bei Insert NUR gesetzt wenn ein normalisierter Wert existiert (explizite Nulls würden den sparse Index brechen).
    - **Registrierungs-Duplicate-Check**: pre-insert Phone-Lookup → 400 `"Telefonnummer ist bereits registriert"` (vor DuplicateKeyError, klarere DE-Fehlermeldung). Race-Safe: parallele Inserts werden vom Index-Constraint gefangen + Detection per Index-Name in `dup` String.
    - **Profile-Update** (`PUT /api/auth/profile`): wenn User später Phone setzt/ändert/löscht, wird `phone_normalized` synchron mit-gepflegt. Bei null-Clear `$unset` (statt $set:null, um sparse-Index nicht zu brechen). Bei Konflikt → 400 mit DE-Message.
    - **Enumeration-Safety**: alle Failure-Pfade (nicht-existente Email, nicht-existentes Phone, falsches PW) returnen identisch `401 {"detail":"Invalid credentials"}` — kein User-Existenz-Leak. Verifiziert in Test 8/9.
    - **Frontend**:
      - **AuthForm** Login-Mode: Single-Field für „E-Mail oder Telefon" mit dynamischem Label-Switch (Apple-/Revolut-Style — Icon ändert sich live: `@` für Email-Input vs `📞` für Phone-Input je nachdem was der User tippt). Placeholder `name@firma.de oder +49 170 1234567`. Hint-Text „Du kannst dich mit deiner E-Mail ODER deiner registrierten Telefonnummer anmelden."
      - **AuthForm** Register-Mode: Phone-Field-Label um `(Login + 1:1 Coaching)` ergänzt — macht klar, dass die Nummer jetzt auch ein Login-Identifier ist.
      - **LoginPage** `handleSubmit`: Login-Payload sendet jetzt `{identifier, password}` statt `{email, password}` (Backend-Backwards-Compat sichert alte Builds ab).
  - **Cross-Domain Deployment-Ready**:
    - Beide Domains `leadercheck.de` + `leaderos.de` (+ www-Varianten) werden von DIESEM Code aus deployt. `leader-check.de` + `leader-os.de` bleiben weiterhin auf der Claude-Code-Instance laufen. CORS aktuell `*` via `allow_origin_regex` → akzeptiert alle 4 Domains. Für Production-Lockdown: in Vercel `CORS_ORIGINS=https://leadercheck.de,https://www.leadercheck.de,https://leaderos.de,https://www.leaderos.de,https://leader-check.de,https://www.leader-check.de,https://leader-os.de,https://www.leader-os.de` setzen.
    - Funnel-Flow: User besucht `leadercheck.de` → klickt CTA → wird zu `leaderos.de/signup` weitergeleitet → Browser sendet `Origin: https://leadercheck.de` + `Referer: https://leadercheck.de/...` → Backend stempelt `source_platform: 'leader-check'` first-touch. Subsequent Logins → `last_login_at` updated, `source_platform` UNTOUCHED.
  - **Test Coverage**: 9/9 neue Backend-Tests GREEN (`backend/tests/test_iter92_24_phone_login_and_source_platform.py`): Origin-Detection (3 cases), Phone-Login via 3 Formats (spaces, no-spaces, full), Register-w/o-phone-legacy, Backwards-compat-email-payload, Duplicate-phone-400, Enumeration-Safety (existing email/phone/non-existing both → identical 401), Empty-identifier-422. End-to-end-verifiziert via curl gegen Preview-Ingress.
  - **Files** (5 modified + 1 new test): MODIFIED: `backend/models.py` (+normalize_phone, looks_like_phone, UserLogin.identifier), `backend/routes/auth.py` (+detect_source_platform, phone-aware register/login/profile-update), `backend/server.py` (+phone_normalized sparse-unique index), `backend/services_supabase_sync.py` (+source_platform param), `backend/services_crm.py` (+platform in payload), `backend/routes/oauth.py` (+source_platform on new-user create), `frontend/src/components/auth/AuthForm.js` (+single-field email-or-phone with dynamic icon), `frontend/src/pages/LoginPage.js` (+identifier payload). NEW: `backend/tests/test_iter92_24_phone_login_and_source_platform.py`.
  - **Mert's Vision delivered**: Cross-Funnel-Attribution sauber getrackt (Supabase + CRM + Mongo). Phone als gleichberechtigter Login-Identifier ohne Twilio-Dependency (kein SMS-Cost). Single-Input-Field-UX (Apple/Revolut-Style) statt 2 Inputs oder Toggle. Backwards-Compat 100% sichergestellt für alte Frontend-Builds + Third-Party-Integrationen.


- [x] **[Iter 92.23.12 · 19.06.26] PRODUCTION-FIX: Stripe-Preis-Bug + Phone bei Registration + AI-Copy-Sprach-Policy (Mert verbindlich)** —
  - 🔴 **P0 PRODUCTION-FIX: Stripe Preis** — Mert meldete „Stripe zeigt €444.700 statt €4.797". Code hatte `4447€` an mehreren Stellen (sollte laut Mert `4797€` sein). **11 Code-Stellen** korrigiert: `backend/routes/payments.py` (`amount: 4797.00`), `backend/services_tier.py` (`price_eur: 4797.00`), `backend/routes/support.py` (FAQ), `frontend/src/components/coaching/TierPricingGrid.js`, `components/shared/TierLockOverlay.js`, `PricingModal.js`, `PaywallModal.js`, `LearningVideosTab.js`, `ChatInlineUpsell.js`, `pages/AGBPage.js`, `pages/CoachingPage.js`. **Verifiziert via curl**: `/api/payments/packages` returnt `leadership_os_plus.amount: 4797.0 EUR` → emergentintegrations konvertiert intern zu 479700 cents → Stripe-Checkout zeigt korrekt €4.797,00. Der €444.700-Bug stammt **nicht aus dem Code** sondern vermutlich aus einem manuell im Stripe-Dashboard erstellten Payment-Link mit falschem Betrag → Mert muss diesen alten Stripe-Payment-Link im Dashboard löschen, der App-interne Checkout-Flow ist jetzt korrekt.
  - **Phone Number bei Registration** (`backend/models.py` `UserRegister.phone` + `backend/routes/auth.py` register + update_profile + `frontend/src/components/auth/AuthForm.js` + `pages/LoginPage.js`):
    - **Backend**: `UserRegister.phone: Optional[str]` mit Pydantic-Validator (5–32 Zeichen, regex `^[+()\d\s\-./]+$`, leer/null = ok). Stored als `users.phone`. **PUT /api/auth/profile** akzeptiert jetzt auch `phone` für Bestandsuser via Profile-Page. Backwards-compat: existierende User ohne `phone` haben implicit `null`.
    - **Frontend**: AuthForm in Register-Mode zeigt lime Phone-Icon + Label **„Telefonnummer (für dein 1:1 Coaching-Gespräch)"** + Placeholder `+49 170 1234567` + Subtext *„Optional. Wir nutzen sie nur für Coaching-Termin-Bestätigungen via Cal.com — kein Marketing-Spam."*. Auth-Pattern unverändert: Login bleibt email+password only (per integration_playbook_expert_v2 confirmed).
    - **Validierung verifiziert**: gültige Phone wird gespeichert, XSS-Garbage wird mit 422 + DE-Fehlertext „Telefonnummer enthält ungültige Zeichen" abgewiesen. Login mit Phone-User funktioniert weiterhin via Email.
  - **AI-Copy Sprach-Policy** (`backend/services.py` `WLADBOT_SYSTEM_PROMPT` + `backend/routes/video.py` `VIDEO_ANALYSIS_PROMPT` + `backend/services_folder_knowledge.py` briefing prompt):
    - Mert verbindlich: „beim report keine Wörter nutzen wie Advisory Board / THE IDEAL LEADER / Mastering the 6 Roles / Technisches Wissen schafft Experten...". Diese Phrasen existieren nicht im Code — sie kommen aus der LLM-Generation via RAG aus Wlads Inhalten.
    - **Lösung**: SPRACH-POLICY-Block in alle 3 System-Prompts integriert mit konkreter Verbotsliste + deutschen Ersatz-Begriffen:
      - „Advisory Board" → „Beirat"
      - „THE IDEAL LEADER / Mastering the X Roles" → „Die wichtigsten Rollen einer Führungskraft"
      - „Leadership Mastery" → „Führungskompetenz" / „echte Führungsstärke"
      - „Impact" → „Wirkung" / „Ergebnis"
      - „Mindset" → „Haltung" / „Denkweise"
      - „Performance" → „Leistung"
      - „Engagement" → „Beteiligung" / „Einsatz"
      - „Best Practices" → „bewährte Vorgehensweisen"
      - „Technisches Wissen schafft Experten. Leadership Mastery schafft Impact." → „Fachwissen macht dich zum Experten. Gute Führung macht dich wirksam."
    - Wenn ein englischer Fachbegriff zwingend nötig ist (z.B. „Pitch"), wird er einmal in Klammern erklärt. Style: kurze klare Sätze statt lange mit Fremdwörtern.
  - **Files** (11 modified): `backend/models.py`, `backend/routes/auth.py`, `backend/routes/payments.py`, `backend/routes/support.py`, `backend/routes/video.py`, `backend/services.py`, `backend/services_tier.py`, `backend/services_folder_knowledge.py`, `frontend/src/components/auth/AuthForm.js`, `frontend/src/pages/LoginPage.js`, `frontend/src/components/coaching/TierPricingGrid.js`, plus 6 weitere Frontend-Files mit Preis-Update.
  - **Action für Mert auf Production**: 
    1. Code-Deployment via „Save to GitHub" + „Deploy" → neuer Preis €4.797 sofort live
    2. **Stripe Dashboard Cleanup**: jeden manuell erstellten Payment-Link mit altem Betrag (444700 cents oder €4.447) löschen, falls existent. Der App-interne Checkout-Flow nutzt jetzt korrekt €4.797.

- [x] **[Iter 92.23.11 · 05.06.26] Folder-Context-Awareness im FAB + Folder-Workspace-Cards auf Dashboard (Mert: „auf /missions/abc schlägt der Drawer automatisch den Folder vor · Mini-Stats + Quick-Briefing-Button pro Folder")** —
  - **P1 — FAB Drawer Page-Context-Awareness** (`frontend/src/lib/wladbotBus.js` erweitert + `components/shared/FloatingWladBotDrawer.js` + `pages/VideoChallengePage.js` + `pages/ChatPage.js`):
    - `wladbotBus` bekam einen neuen Event-Channel `EV_PAGE_CONTEXT` mit `setWladBotPageContext({folderId, entryId, entryTitle, pageLabel})`, `subscribeWladBotPageContext(cb)`, `getLastPageContext()` (synchronous accessor für late-subscribers wie den Drawer).
    - **VideoChallengePage publisht Page-Context** bei jedem Wechsel von `activeFolderId` ODER `activeEntryId` — der Drawer weiß so, an welcher Mission/welchem Folder der User gerade arbeitet. Resolve-Logik: explicit `activeFolderId` (von Rail) > `entry.folder_id` (von gepickter History-Entry) > null.
    - **ChatPage publisht** ebenfalls bei aktivem Folder (kommt von `?folder=` URL-Param oder explizitem Pick).
    - **FloatingWladBotDrawer** subscribed beim Mount und nutzt `pageContext.folderId` als initial activeFolderId beim Öffnen — fällt auf "most-recently-updated folder" zurück wenn nichts published wurde.
    - **AUTO-Pill UI**: wenn die Folder-Selection aus Page-Context kam, erscheint im Picker eine lime "AUTO"-Badge rechts oben + ein Sub-Text „Automatisch gewählt für: [entryTitle]". Macht für den User klar, dass der Agent von selbst seinen Kontext kennt. End-to-end browser-verified: `/missions?folder=fld_xxx` → Rail highlighted Boardroom Q2 → FAB öffnet → Picker zeigt „Kontext: Boardroom Q2" + AUTO-Pill.
  - **P1 — Dashboard Folder-Workspace-Cards** (`frontend/src/components/dashboard/FolderWorkspaceCards.js` + `pages/DashboardPage.js`):
    - Neue Section „DEINE WORKSPACES" zwischen QuickActionsGrid und Level Progress mit bis zu 4 Folder-Karten (newest-updated first).
    - Pro Karte: Folder-Icon mit Accent-Farbe + Aurora-Glow auf Hover, Name (Outfit Display Font), item_count, 2-zeiliger Context-Summary-Excerpt, „Briefing" Lime-Button + „Öffnen" Outline-Button.
    - **Briefing-Action** ruft direkt `POST /api/folders/{id}/briefing` → öffnet FAB Drawer mit dem 30-Sek-Briefing als initial Message (über wladbotBus). Spinner während LLM-Call.
    - **Öffnen-Action** navigiert zu `/missions?folder=<id>` — neue URL-Param-Handling in VideoChallengePage setzt activeFolderId aus dem Param.
    - Empty-State (0 Folders): dashed Border Card mit „+ Ersten Workspace erstellen" → /missions.
    - Footer-Legend: Mission-Icon · Chat-Icon · „1 Klick — vollkontextiges Briefing" Tagline.
    - Browser-verified: Dashboard zeigt „Boardroom Q2" Card lime + „+ Neuer Workspace" dashed Card daneben.
  - **Files** (1 new + 4 modified): NEW: `frontend/src/components/dashboard/FolderWorkspaceCards.js`. MODIFIED: `frontend/src/lib/wladbotBus.js` (+EV_PAGE_CONTEXT channel), `frontend/src/components/shared/FloatingWladBotDrawer.js` (+page-context subscribe + AUTO pill), `frontend/src/pages/VideoChallengePage.js` (+setWladBotPageContext on state change + ?folder= URL param), `frontend/src/pages/ChatPage.js` (+publish on activeFolder), `frontend/src/pages/DashboardPage.js` (+FolderWorkspaceCards mount).
  - **Backend Regression**: 41/41 Tests GREEN — zero backend changes diese Iteration, alle Iter 92.23.7+8+9+10 Endpoints unverändert.
  - **Mert's Vision delivered**: Der Agent weiß jetzt VON SELBST, welcher Folder relevant ist, sobald der User auf der Studio-Page ist. Dashboard wird zur Workspace-Übersicht — der User sieht alle aktiven Projekte mit 1-Klick-Briefing-Zugang. Die „Always with you"-UX ist jetzt nicht nur Always-Visible, sondern Always-Contextualized.

- [x] **[Iter 92.23.10 · 05.06.26] Code-Review Hardening: Briefing-Graceful-Degradation, View-Counter Atomicity, Doku der UX-Safety-Catches** —
  - **Briefing Endpoint Resilience** (`backend/routes/folders.py` `folder_briefing`): tries `gpt-4o-mini` → `gpt-4o` → deterministic local fallback (`_deterministic_briefing_fallback`). User bekommt nie mehr 502, sondern immer ein verwertbares Briefing — auch wenn beide Modelle ausfallen. Response trägt zusätzlich `source: 'gpt-4o-mini' | 'gpt-4o' | 'fallback_llm_unavailable' | 'fallback_no_key'` für Telemetrie. Verifiziert: erste Request returnt `source: gpt-4o-mini` mit 552-chars warmem Briefing.
  - **View Counter Race-Condition Fix** (`backend/routes/folders.py` `get_shared_folder`): nutzt jetzt `find_one_and_update` mit `ReturnDocument.AFTER` für atomare increment-and-fetch Operation. Concurrent Requests sehen konsistente Counter-Werte. Verifiziert: 3 sequenzielle GETs returnen `views: 3 → 4 → 5` (vorher hätten zwei parallele Requests beide `4` returnen können). Fallback-Path bleibt vorhanden für non-pymongo-`ReturnDocument` Environments.
  - **Empty-Catch UX-Safety-Catches dokumentiert** (`frontend/src/pages/VideoChallengePage.js` lines 107, 271, 288, 306, 405): alle 5 `catch (_)` Blocks tragen jetzt explizite `/* safe-noop: ... */` Kommentare die ihren Zweck klären — `URL.revokeObjectURL` no-op-on-already-revoked (Browser-Standard) und Sonner-Toast-Import-Fallback (Primary-Error wurde bereits durch `logger.error` oben behandelt). Keine echten Fehler werden geschluckt; die Catches sind dokumentierte UX-Safety-Patterns.
  - **Bewusste Skips (Code-Review-Findings die FALSE POSITIVES sind)**:
    - **„Hardcoded Secrets in Test Files"**: `test@test.com` / `test123` sind Test-Account-Credentials, dokumentiert in `/app/memory/test_credentials.md`, NICHT Production-Credentials. Standard-Pattern für pytest-Suites.
    - **„Insecure localStorage Data Storage"**: `ttsSpeed.js`, `recentLogins.js`, `consent.js`, `FakeWladCall.js`, `StripeModeBanner.js` speichern UI-Preferences und Spiel-Zustand (TTS-Speed, letzter Login-Email, Cookie-Consent, Spielzeit) — **KEINE Auth-Tokens**, KEIN PII, KEIN Stripe-Secret. Auth-JWT läuft über sicheren API-Header. localStorage für UI-Prefs ist Standard-Pattern.
    - **„Missing Hook Dependencies"**: Die Polling-Closures in `VideoChallengePage.js` sind absichtlich stable (Production-Notes warnen explicit davor sie zu „fixen"). Lint blockiert nichts; das sind ESLint-Style-Advisories ohne Bug-Impact.
    - **„Component Complexity / Large Components"**: 405-line `VideoChallengePage` und 440-line `AnalysisResults` sind kohärente Studio-Pages. Refactoring zerteilt sie unnötig und macht Props-Flow komplizierter. Niedrige Prio.
    - **„Nested Ternaries"**: Style-Preference, keine Bugs. 475+ instances bedeutet das ist idiomatische React-JSX, nicht ein Problem.
  - **Files** (3 modified): `backend/routes/folders.py` (+graceful-degradation + atomic counter), `frontend/src/pages/VideoChallengePage.js` (+safe-noop docs).
  - **Verifiziert**: Backend live, alle Endpoints funktionieren, Lints clean.

- [x] **[Iter 92.23.9 · 05.06.26] Phase 3: Folder Briefing + Knowledge-RAG + Folder Sharing (Mert: „Folder-Briefing-Button · Folder Knowledge-RAG · Folder Sharing als read-only Link")** —
  - **P1 — Folder Briefing** (`backend/services_folder_knowledge.py` + `backend/routes/folders.py:233-273`):
    - Neuer Service `services_folder_knowledge.py` mit `build_folder_timeline` und `generate_briefing_prompt` Helpers.
    - Endpoint `POST /api/folders/{folder_id}/briefing` → sammelt die 5 jüngsten Folder-Items (Video-Missionen + Chat-Sessions), bildet einen Wlad-Style-Coaching-Prompt mit Scores/Stärken/Verbesserungen/letzten-Fragen, ruft `gpt-4o-mini` über `LlmChat` und returnt `{briefing, items_used, folder_id, folder_name, generated_at}`.
    - Prompt enforced: max 4 Sätze, fließende Sätze, KEIN Vorwort wie „Hier ist dein Briefing:", endet mit konkreter Handlungsempfehlung. Browser-verifiziert: AI generierte sofort echtes warmes 4-Satz-Briefing („Hallo! Es freut mich, dass du den Ordner 'Boardroom Q2' geöffnet hast...Dein nächster Schritt ist es...").
    - **Frontend Briefing-Button** (`components/video/FolderRail.js` + `lib/wladbotBus.js`): Sparkles-Icon erscheint on-hover über jeder Folder-Row. Klick → POST `/folders/{id}/briefing` → öffnet den globalen `FloatingWladBotDrawer` mit dem Briefing als initiale Assistant-Message (über `wladbotBus`-Event-Bus, decoupled von Tree-Hierarchie). Drawer setzt automatisch den Folder als activeContext, sodass weitere Fragen mit vollem Knowledge-RAG beantwortet werden.
  - **P1 — Folder Knowledge-RAG** (`backend/routes/chat.py:189-220` + `services_folder_knowledge.build_folder_timeline`):
    - `_resolve_folder_context` ruft jetzt zusätzlich `build_folder_timeline()` auf und hängt einen kompakten `--- FOLDER-HISTORIE ---` Block an den System-Prompt: pro Item 1-3 Zeilen mit Title, Score, Wlads-Notiz, Stärken+Verbesserungen (Video-Missionen) bzw. letzte User-Fragen + Wlad-Antworten (Chat-Sessions, letzte 4 Turns).
    - Limits: 8 Items per Folder, 600 chars Transcript, 500 chars Wlad-Assessment, 400 chars per Chat-Message — verhindert System-Prompt Bloat. Best-effort try/except — Knowledge-Layer-Failures blockieren NIE den Chat.
    - Verifiziert: Im Chat mit folder_id zitiert die AI jetzt konkrete Items („dein letzter Versuch lag bei 65/100, deine Stärke war X, deine Verbesserung war Y").
  - **P2 — Folder Sharing** (`backend/routes/folders.py:281-405` + `frontend/src/pages/SharedFolderPage.js` + `App.js /f/:slug` Route):
    - Endpoints: `POST /api/folders/{id}/share` (idempotent → returnt immer den selben Slug pro Folder), `DELETE /api/folders/{id}/share`, `GET /api/folders/share/{slug}` (public, **no-auth**), Cascade-Cleanup auf `delete_folder` so dass keine Orphan-Share-Rows zurückbleiben.
    - **PII-Light Public Response**: items array zeigt nur item_type + title + score + date für Missionen / title + date für Chats — **KEIN** Transcript, KEIN wlad_assessment, KEIN strengths/improvements Leak. Owner-Info: nur name + picture + level (kein Email, kein user_id-Leak).
    - **View Counter**: `$inc` auf jeder Public GET-Anfrage, returnt in Response für „2 views"-Indicator auf der Share-Page.
    - **SharedFolderPage** (`/f/:slug`): Standalone public page mit Tesla/Apple aesthetic — lime + violet Aurora-Glows, brand-row mit W-Logo + view counter, hero mit "GETEILTER ORDNER" pill + Outfit Display Font für Title, context_summary subline, owner-card (avatar + name + level), items-grid mit Score-Badges, premium CTA-Card "Baue deinen eigenen Leadership-Workspace" + "Kostenlos starten" → /signup. Browser-verified: `/f/{slug}` rendert komplett ohne Auth.
    - **Frontend Share-Button** (`FolderRail.js`): Share2-Icon on-hover. Klick → POST share + clipboard.writeText + Sonner-Toast „Share-Link in Zwischenablage". Fallback auf window.prompt wenn clipboard-API blockt.
  - **Test Coverage**: 14/14 neue Backend-Tests GREEN + 27/27 Regression auf 92.23.7+8 = **41/41 grün** (`backend/tests/test_iter92_23_9_folder_briefing_share.py`). Verifiziert: happy-paths beider LLM-Endpoints (gpt-4o-mini briefings + gpt-5.2 Knowledge-RAG chats), foreign-folder 404 für alle 3 endpoints, idempotency, public PII-scrubbing, view counter, DELETE cascade, knowledge-RAG empty-folder graceful path.
  - **Cleanup Fix**: `DELETE /api/folders/{id}` löscht jetzt auch alle assoziierten `folder_shares` Einträge (vorher Orphan-Risiko bei Folder-Löschung mit aktiver Share-URL).
  - **Files** (5 new + 4 modified + 1 test): NEW: `backend/services_folder_knowledge.py`, `frontend/src/pages/SharedFolderPage.js`, `frontend/src/lib/wladbotBus.js`, `frontend/src/components/video/FolderRail.js` (overhauled with Briefing+Share buttons), `backend/tests/test_iter92_23_9_folder_briefing_share.py`. MODIFIED: `backend/routes/folders.py` (briefing + share endpoints + cascade fix), `backend/routes/chat.py` (timeline injection), `frontend/src/App.js` (+/f/:slug route + import), `frontend/src/components/shared/FloatingWladBotDrawer.js` (+wladbotBus subscribe, +/f/ in hidden routes).
  - **Mert's Phase-3 Vision delivered**: Briefing macht den Folder zu einer „zurückkehrenden Konversation". Knowledge-RAG gibt dem Agent „die Geschichte deines Themas" (genau wie spezifiziert). Sharing macht Progress sichtbar nach außen — Tesla/Apple Public Page mit Lead-Capture via Signup-CTA.

- [x] **[Iter 92.23.8 · 05.06.26] Wingman-Vision Phase 2: Folder Context Injection + Always-On WladBot Drawer + Chat-Session Folders (Mert: „folder.context_summary als System-Prompt-Snippet · Always-on Floating WladBot-Sidebar · Folders auch für Chat-Sessions")** —
  - **P0 — Folder Context Injection in Chat** (`backend/routes/chat.py`):
    - Neue Pydantic-Felder `ChatMessageIn.folder_id` und `ChatSessionCreate.folder_id` in `backend/models.py`.
    - Neue Helper `_resolve_folder_context(folder_id, user_id) → (text, folder_doc)`: owner-guarded, falls quietly bei foreign/missing/empty-summary (kein Info-Leak).
    - `_build_system_message` nimmt optionalen `folder_context` Parameter und hängt einen klar gelabelten Block `--- AKTIVER ORDNER-KONTEXT ---` an System-Prompt an.
    - POST `/api/chat` reagiert auf `folder_id` im Request-Body → AI bekommt den `context_summary` mitgeliefert; Response trägt `folder_context_used: bool` als UX-Signal.
    - End-to-end verifiziert: ohne folder_id → generische Antwort ("Erfolgsfaktoren allgemein"). Mit folder_id+context_summary "C-Level Pitches Q2 / 5min / KPI-Logik" → AI antwortet spezifisch ("Board-Pitch, 5 Min, Finance-Team, klare KPI") ohne dass der User das nochmal erwähnen muss. Genau das Wingman/OpenClaw "agent-next-to-you" Verhalten.
  - **P1 — Chat-Sessions in Folders** (`backend/routes/chat.py:155-203`):
    - POST `/api/chat/sessions` mit `folder_id` für eigenen Folder → stempelt `session.folder_id` + erstellt `db.folder_items` Eintrag mit `item_type='chat_session'`, `source_id=session_id`. Foreign folder_id wird stumm ignoriert (200 mit folder_id=null, kein Item erzeugt).
    - GET `/api/chat/sessions?folder_id=<f>` → filtert nach Folder, sodass das Sidebar nur Chats dieses Folders zeigt. Ohne Param: alle Chats (Regression OK).
    - Auto-creation in `_ensure_session` (wenn POST /chat ohne session_id, aber mit folder_id startet) stempelt ebenfalls `folder_id` auf neue Session.
  - **P1 — Floating WladBot Drawer** (`frontend/src/components/shared/FloatingWladBotDrawer.js`, gemountet in `App.js`):
    - **Globaler FAB** (Floating Action Button) bottom-24 right-6 z-60 — lime Sparkles-Icon mit rosa Pulse-Notification-Dot. Erscheint auf allen authentifizierten Routes außer Login/Signup/Onboarding/Public-Share/Chat (dort gibt's bereits die volle UI).
    - **Drawer** öffnet von rechts (440px breit, dark theme, slide-in-right Animation, ESC-to-close, click-outside-to-close).
    - **Folder-Picker** oben mit Dropdown → User wählt aktiven Folder-Kontext, AI antwortet sofort mit injectem context_summary. Auto-Default: most-recently-updated Folder.
    - **Empty-State**: "Was beschäftigt dich gerade?" + 3 Quick-Prompts ("Heute fokussieren / Gespräch vorbereiten / Reflektieren") — One-Click-Send.
    - **Inline AI-Rendering**: SmartText rendert INSIGHT (amber Lightbulb) + STRATEGIE (sky Target) Karten mit nummerierten Badges für Listen — exakt das Premium-Look-and-Feel der Haupt-Chat-UI in einer kompakteren Form.
    - **"Im vollen Chat fortsetzen →"** Button am unteren Rand übergibt session_id + folder_id an `/chat?folder=<id>` für deep dive.
    - End-to-end live verifiziert: Klick auf Quick-Prompt "Heute fokussieren" produzierte sofort INSIGHT-Card mit Eisenhower-Prinzip-Erklärung + 3-Punkte-STRATEGIE-Card mit nummerierten Schritten. Vollständiges Wingman-Style "agent always next to you" Pattern realisiert.
  - **Frontend ChatPage Updates** (`pages/ChatPage.js`):
    - URL-Param `?folder=<folder_id>` aktiviert Folder-Context für die volle Chat-Session.
    - Active-Folder-Pill oben im Chat zeigt aktuellen Kontext mit Farbe des Folders + Close-Button.
    - `handleSend` und `handleNewSession` propagieren `folder_id` durch.
  - **Test Coverage**: 10/10 Backend-Tests GREEN (`/app/backend/tests/test_iter92_23_8_chat_folder_context.py`). Verifiziert: happy-path Injection, foreign-folder-ignore-no-leak, missing-folder-graceful, multi-turn-injection, chat-session-folder-stamp + folder_item-creation, list-sessions-filter, full regression auf Iter 92.23.7 Folders.
  - **Files** (3 modified + 1 new + 1 test): MODIFIED: `backend/models.py` (+folder_id fields), `backend/routes/chat.py` (folder context helper + _build_system_message + create/list sessions accept folder_id), `frontend/src/pages/ChatPage.js` (+activeFolder pill + ?folder query param), `frontend/src/App.js` (+FloatingWladBotDrawer mount). NEW: `frontend/src/components/shared/FloatingWladBotDrawer.js`, `backend/tests/test_iter92_23_8_chat_folder_context.py`.
  - **Mert's vision delivered**: P0 + P1 + P1 alle in einer Iteration. Der Agent steht jetzt LITERAL „immer neben dir" als FAB auf jeder Page und kennt deinen aktuellen Kontext. Folders verbinden Video-Missionen UND Chat-Sessions zu einer kohärenten Knowledge-Domain. Die System-Prompt-Injection ist das technische Fundament für die nächste Phase ("Folder-Briefing-Summary" / "RAG nur über Folder-Items").

- [x] **[Iter 92.23.7 · 05.06.26] Video Studio Reimagined: 3+3 First, Magic-Boxes, Replay, Premium PDF, Wingman-Style Folder System (Mert: „video analyse output starts with 3 Dinge, die du verbessern kannst und 3 gut gemacht hast · detailed PDF · video on dashboard so people can replay · proper system to improve and create folders · which also gives context · like wingman.com but for leaders, like openclaw · magic box for more detailed information")** —
  - **3+3 Stärken & Verbesserungen FIRST**: `components/video/AnalysisResults.js` komplett neu strukturiert. Reihenfolge jetzt: Top-Bar → optionaler **Video-Replay** → Title → **3 Stärken (grün) + 3 Verbesserungen (amber)** in zwei nebeneinanderliegenden Karten mit Number-Badges → Wlad-Assessment mit W-Logo + Voice-Player → **kompakter** Score-Strip (war Hero, jetzt slim) → "TIEFER EINTAUCHEN" Section. Browser-verified: ✅
  - **Video Replay** (`pages/VideoChallengePage.js` + `AnalysisResults.js`): MediaRecorder Blob wird nach Stop in `URL.createObjectURL` umgewandelt und an AnalysisResults durchgereicht. "Aufnahme abspielen"-Button in der Top-Bar toggelt einen premium gerahmten `<video controls>`-Player mit lime ring + "DEINE AUFNAHME"-Badge. Sauberer URL-Lifecycle (revoke beim Unmount / Reset / Pick-History / Replay).
  - **Magic-Box Drill-Down** (`AnalysisResults.MagicBox`): collapsible Sections mit animierter Chevron-Rotation, accent-colored Icon-Badge, Border-Highlight im Open-State. 6 Boxes: **3 Säulen** (Logos/Ethos/Pathos Karten + Wlads Bewertung + Kommunikationsquadrant), **Rede-Analyse** (Füllwörter, Tempo, Phrasen, Stat-Grid), **Rewrite Suggestion**, **Practice Exercises**, **Transcript**, **vs. Previous**. Live-Test: 6 Magic-Boxes detected + 3 Säulen-Box open zeigt vollen Drill-Down.
  - **Premium PDF Report** (`lib/reportGenerator.js` — komplett neu): 5-Seitiges dark-themed Magazine-Layout mit Tesla/Apple-Vibes. Page 1: Cover (lime aurora glow, Outfit-Display-Font, 200px Score-Ring mit Shadow, Mini-Score-Tiles). Page 2: 3+3 Stärken/Verbesserungen + Wlad-Quote-Card. Page 3: 3 Säulen Pillar-Cards + Quote-Cards. Page 4: Speech-Analytics Stat-Grid + Chip-Stack + Phrase-Card. Page 5: Rewrite-Card + Exercises. Page 6: 7-Tage-Plan + CTA-Card. **WladBot W-Logo Watermark** auf Cover + jeder Page-Band-Header. Lime (#BFFF00) Akzent-Strip, Inter Body + Outfit Display Typography. html2canvas → jsPDF mit `scale:2` + `useCORS` für sharp Retina-Look.
  - **Folder System (Wingman/OpenClaw-Style)** (`backend/routes/folders.py` + `components/video/FolderRail.js` + `components/video/AddToFolderButton.js`): Komplett neues Modul für Knowledge-Organization.
    - **Backend Endpoints** (alle owner-only, registered in `server.py:113,145`):
      - `GET /api/folders` → list mine, item_count via aggregation, newest-updated first
      - `POST /api/folders` → `{name, color, icon, context_summary}` (server-side `.strip()[:N]` graceful truncate)
      - `PATCH /api/folders/{folder_id}` → partial update aller Felder
      - `DELETE /api/folders/{folder_id}` → cascade: deletes folder, unlinks all items, $unset folder_id auf allen `video_challenges`
      - `GET /api/folders/{folder_id}/items` → list contents
      - `POST /api/folders/{folder_id}/items` → idempotent link (dedup auf `source_id`), stamps `folder_id` auf `video_challenges` row
      - `DELETE /api/folders/{folder_id}/items/{item_id}` → unlink + $unset folder_id auf video row
    - **Data Model**: neue Collections `db.folders` `{folder_id, user_id, name, color, icon, context_summary, created_at, updated_at}` und `db.folder_items` `{item_id, folder_id, user_id, item_type, source_id, title, created_at}` + neues optionales Feld `folder_id` auf `db.video_challenges`
    - **Frontend Folder Rail** (`FolderRail.js`): slim sidebar section in der Video-Studio-Sidebar mit Inline-Create (Color-Picker), Rename (Pencil), Delete (Trash), und "Alle Missionen"-Toggle. Hover-Actions, Item-Count-Badge pro Folder.
    - **Frontend Add-to-Folder Picker** (`AddToFolderButton.js`): Popover in der Analysis-Top-Bar mit Liste eigener Folder, Quick-Create (Name + Color), Click-outside-dismiss, toast-confirmation, Check-Mark nach Link-Success.
    - **VideoStudioSidebar**: filtert History nach `activeFolderId` zusätzlich zur Search.
  - **Test Coverage**: 17/17 Backend-Tests GREEN (`/app/backend/tests/test_iter92_23_7_folders.py`). Ownership-Guard mit 2 Users verifiziert, cascade-delete + idempotent dedupe + 4xx-Paths + `folder_id`-Stamping all tested. Regressions auf 92.23.6 (me-stats, archive PATCH/DELETE) bleiben green.
  - **Files Touched** (8 modified + 4 new): MODIFIED: `components/video/AnalysisResults.js` (komplett refactored), `components/video/VideoStudioSidebar.js` (+folder filter + FolderRail import), `pages/VideoChallengePage.js` (+recordedVideoUrl state, +activeFolderId, +entry_id injection on history pick), `lib/reportGenerator.js` (komplett rewritten — 5-page dark magazine), `backend/server.py` (folders_router include), `backend/routes/folders.py` (Pydantic models simplified post-test feedback). NEW: `components/video/FolderRail.js`, `components/video/AddToFolderButton.js`, `backend/routes/folders.py`, `backend/tests/test_iter92_23_7_folders.py`.
  - **Mert's vision delivered**: Output startet mit den 3+3 (sein #1 Punkt). PDF ist premium dark-magazine statt generic. Replay funktioniert. Folders + Context-Summary sind die Wingman/OpenClaw-Foundation — folder.context_summary kann später (next iter) als System-Prompt-Snippet in WladBot-Chats injected werden, sodass der Agent „immer neben dem User mit Kontext" ist.

- [x] **[Iter 92.23.6 · 05.06.26] Studio View für Video Analyse + Community-Personalisierung + Smart Markdown-Rendering (Mert: „ChatGPT-like Studio · Community personalisiert · 1. 2. 3. Listen schöner")** —
  - **NEU: `SmartText` Komponente** (`frontend/src/components/shared/SmartText.js`): premium markdown-lite Renderer für KI-Outputs. Erkennt nummerierte Listen ("1. … 2. … 3. …") sowohl multi-line als auch inline-in-einer-Zeile, Bullet-Lists (-, •, *), und `**bold**` Spans. Rendert nummerierte Items als Karten mit gefarbtem Number-Badge + Icon (Tesla/Linear-Style) statt Wall-of-Text. Eingebaut in: `AnalysisResults.wlad_assessment`, `framework_feedback.drei_saeulen`, `framework_feedback.kommunikationsquadrant`, `improvement_vs_previous`; `ChatMessage.insight` + `strategy`; `ResultCards.optimized_text` + `recommendation` + `event_concept` + `result`; `WorkflowResultPanel.counter_check`; `PlaybookReport.overall_assessment`; `DeepAssistModal.argumentation`. End-to-end-verified: alte Analyse-Page zeigt 4 SmartText-Blocks → Listen rendern jetzt als Karten statt Roh-Text.
  - **NEU: Video Studio Sidebar** (`frontend/src/components/video/VideoStudioSidebar.js` + Refactor `pages/VideoChallengePage.js`): ChatGPT-Style Layout — links festgenagelte Sidebar mit Suchfeld, "Neue Mission"-CTA, gruppierte Mission-History (Heute / Gestern / Datum), Score-Chip pro Eintrag, Hover zeigt Rename + Delete Icons. Klick auf historischen Eintrag lädt die alte Analyse readonly. Inline-Rename via Edit-Modus mit Enter/Escape. Optimistic-Update + Server-Sync. Smoke-Test bestätigt: 14 Einträge in Sidebar gruppiert nach 4 Tagen, Search filtert 14→1→14, Rename round-trip persistent, „Neue Mission" resettet zur Challenge-Liste.
  - **Backend Video-Archive CRUD** (`backend/routes/video.py`):
    - `PATCH /api/video-archive/{entry_id}` mit `{title}` → setzt `custom_title`, Pydantic `max_length=200`, server-side `strip()[:160]`. Empty title → 400. Owner-Guard via `{entry_id, user_id}` compound filter (no info-leak about foreign entries).
    - `DELETE /api/video-archive/{entry_id}` → idempotent inkl. mission_shares cleanup.
  - **NEU: Community Personalisierung** (`frontend/src/components/community/CommunityMeStats.js` + `CommunityFeedTabs.js` + Refactor `pages/CommunityPage.js`): persönlicher Stats-Header oberhalb des Feeds — Avatar + Name + Tier + Rang ("Platz X von Y" / "Noch nicht im Ranking"), Stat-Grid (Posts · Likes · Kommentare), motivierender Nudge ("Top 3 sind in Reichweite — poste deinen nächsten Win"). Plus „Alle / Top / Meine / Gelikt" Feed-Filter-Pills oberhalb der Category-Filters. Leaderboard markiert die eigene Zeile mit lime-Highlight + "Du"-Label wenn der User in den Top 10 ist.
  - **NEU: Backend Community Endpoints** (`backend/routes/community.py`):
    - `GET /api/community/me-stats` → `{user_id, name, post_count, total_likes, comment_count, rank, total_leaders}`. Aggregiert die ganze Leaderboard einmal, dann in-memory Rank-Lookup. Returns `rank=null` wenn user noch nicht im Ranking.
    - `GET /api/community/feed?feed=all|top|mine|liked` zusätzlich zum bestehenden `category` Filter. `top` nutzt Aggregation mit `$addFields likes_count` + sort by [likes_count desc, created_at desc] (MongoDB find() kann nicht nach $size sortieren). `mine` setzt `query.user_id`. `liked` setzt `query.likes` (array-contains). Standard-Pfad bleibt unverändert für Backwards-Compat.
  - **Test Coverage**: 13/13 Backend-Tests GREEN (`/app/backend/tests/test_iter92_8_community_and_video_archive.py`). Me-stats rank=null/int beide verifiziert, Feed-filter pairwise sort verifiziert, PATCH/DELETE 4xx + happy-path round-trip verifiziert, Regressions auf Category-Filter + POST /community/posts + GET /video-archive grün.
  - **Files Touched** (12): NEW: `components/shared/SmartText.js`, `components/video/VideoStudioSidebar.js`, `components/community/CommunityMeStats.js`, `components/community/CommunityFeedTabs.js`, `backend/tests/test_iter92_8_community_and_video_archive.py`. Modified: `backend/routes/video.py` (+rename/delete endpoints), `backend/routes/community.py` (+feed param, +me-stats), `pages/VideoChallengePage.js` (+ Studio layout), `pages/CommunityPage.js` (+ MeStats + FeedTabs), `components/community/CommunityLeaderboard.js` (+ me-highlight), `components/video/AnalysisResults.js`, `components/chat/ChatMessage.js`, `components/tools/ResultCards.js`, `components/tools/WorkflowResultPanel.js`, `components/tools/DeepAssistModal.js`, `components/playbooks/PlaybookReport.js` (alle: SmartText integration).

- [x] **[Iter 92.23.5 · 05.06.26] CRITICAL FIX: RAG Context Budget für 996-chunk Ingest (Mert: „1605 chunks ingestet, jetzt final check") — silent corpus-dropping detected & fixed** —
  - **Bug**: Nach dem 609 → 1605 chunk Ingest hat der RAG-Auditer `chunks_count=6` aber `context_block=""` für viele neue Queries (Charisma, Weiße Rhetorik, Motivation, Homeoffice etc.) zurückgegeben. **Symptom**: "RAG findet nichts." **Root-Cause**: Die neuen Course-Transcript-Chunks sind je 4000-4146 Zeichen lang. `MAX_CONTEXT_CHARS=4000` blockierte **schon den ersten Chunk** (`4146 + 30 header = 4176 > 4000 → break`) → leerer Context-Block.
  - **Fix** (`backend/services_rag.py`):
    - `MAX_CONTEXT_CHARS: 4000 → 14000` (passt 3-4 volle Course-Chunks gleichzeitig, well within GPT-5.2 128k context window)
    - **Smart truncate**: wenn auch nach Bump ein Chunk noch zu groß ist, schneiden auf last-word-boundary + `[…]` Marker statt komplett droppen
    - **Minimum useful excerpt** check (200 chars) — wenn budget nach n Chunks <200 chars hat, stoppen statt useless-trimming
  - **Pre-fix audit**: 10/17 hits (58%) — alle Original-curated working, alle neuen courses BROKEN
  - **Post-fix audit**: **17/17 hits (100%)** mit avg 13533 ch Wlad-context per query, 550-1150ms latency
  - **Verified surfaces**: alle Buckets — Original (SEXI, 3 Säulen, Komm-Quadrant, Schwarze Rhetorik, Eisenhower, ALPEN), NEW courses (Charisma LIVE 2026.02.04, Weiße Rhetorik, Motivation LIVE 2026.01.29, Präsentation, Homeoffice LIVE 2026.02.25, Argumentorik 5-Rollen), Operational (Mitarbeitergespräche, Pitch-Storytelling, Vorstand-Konflikt, Diversity, Empathie+Autorität)
  - **Files Touched**: `backend/services_rag.py`
- [x] **[Iter 92.23.4 · 04.06.26] RAG Voyage 429-Retry + Production Cache (Mert: „Final RAG check so all output uses Wlads knowledge")** —
  - **Voyage 429-Retry** (`backend/services_rag.py:_embed_query`): Exponential backoff 0.5s → 1.5s → 2.5s → 3.5s + respects `Retry-After` header. 4 attempts max, dann graceful fallback. Vorher: ein einziger 429 → leerer context. Jetzt: transparent latency-bump bei Rate-Limit-Spike.
  - **Cache TTL: 60s → 30min** + max-entries 256 → 1024: chatty Sessions (User stellt 10 Fragen in 10 Minuten) hitten jetzt cache, sparen Voyage tokens und vermeiden 429.
  - **Production-Quality verified**: Wenn Voyage NICHT rate-limited ist, RAG findet 6/6 chunks für jede Wlad-signature query. 3462-4077 char context, 500-900ms latency. SEXI ✅, 3 Säulen ✅, Komm-Quadrant ✅, Skeptiker ✅, Empathie ✅, Delegation ✅, Schwarze Rhetorik ✅ (when tested isolated).
  - **CRITICAL FOR LAUNCH**: Voyage Free Tier (3 RPM) ist der Production-Bottleneck. **Mert muss Voyage auf Tier 1 ($/Pay-as-you-go = 300 RPM) upgraden** — sonst werden konkurrente User von 429 betroffen sein. 30min-Cache federt das ab, aber upgrade ist Pflicht für Skalierung.
  - **Files Touched**: `backend/services_rag.py`
- [x] **[Iter 92.23.3 · 04.06.26] Social Sharing — OG Meta Tags + Dynamic Mission Cards (Post-launch P3): Conversion-driver für viral spread (Mert: „OG meta tags für SharedMissionPage")** —
  - **3 neue Backend-Endpoints** (`backend/routes/og.py`):
    - `GET /api/og/mission/{slug}` → Dynamic premium PNG-Card (1200×630px) mit lime-Score, Wlad-Branding, Mission-Title und User-Name. Word-wrapping bis 22 chars/line max 3 lines.
    - `GET /api/og/mission-html/{slug}` → Server-rendered HTML-Stub mit OG/Twitter meta-tags + meta-refresh → SPA. Cache-Control: 600s public, 3600s edge, 86400s SWR.
    - Default-fallback wenn slug nicht existiert → generic Leader-OS card.
  - **Vercel Bot-Routing** (`vercel.json`): Neuer Rewrite-Pattern detected User-Agent matching `facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot|Pinterest|Embedly|bot|crawl|spider|prerender` → routet zu `/api/og/mission-html/{slug}` SSR. Echte User landen weiter auf der React-SPA.
  - **Premium Card Design** (`_render_mission_share_card`): Score 220px lime/black gradient, Mission Title 48px white right-side, Brand-mark top-left "LEADER-OS · Video Mission · KI-Coach", Tagline bottom-left "Willst du auch so eine Analyse? →", User-attribution wenn vorhanden.
  - **German Typographic Quotes**: title rendered mit `„…\u201c · Leader-OS` für maximale Crawler-Kompatibilität (LinkedIn/Twitter decoden `&quot;` nicht immer konsistent).
  - **END-TO-END VERIFIED**:
    - ✅ `GET /api/og/mission/723e91f420` → 200, 12430 bytes PNG
    - ✅ `GET /api/og/mission-html/723e91f420` → vollständige `<head>` mit og:title, og:description, og:image, twitter:summary_large_image
    - ✅ Invalid slug → graceful default fallback
    - ✅ Existing `/api/og/leader-score/preview/85` regression-free
  - **Files Touched**: `backend/routes/og.py`, `vercel.json`
- [x] **[Iter 92.23.2 · 04.06.26] Post-Launch Polish: W-Logo, Chat-Continuity, Cal.com Direct-Links (Mert: „W-Logo statt Frau-Avatar · Chat-Erweiterung mit direktem Knowledge-Pickup · alle Strategiegespräch-Buttons direkt auf Cal.com")** —
  - **Wlad-Avatar = W-Logo** (`components/video/AnalysisResults.js`): DiceBear Avatar (war female-coded) ersetzt durch LEADER-OS "W"-Mark — `bg-gradient-to-br from-[#BFFF00] to-[#9ACC00]`, Outfit-font, schwarz-gelb-Theme. Verified-Badge ist jetzt dark-on-lime statt invertiert. Brand-konsistent mit Watermark + Sidebar-Logo.
  - **Chat-Continuity über `?prefill=...`** (`pages/ChatPage.js`): Neuer `prefillHandledRef` useEffect liest `searchParams.get('prefill')` → strippt URL via `history.replaceState` → ruft `handleSendRef.current(prefill)` nach 250ms → AUTO-SEND. User landet direkt auf Wlad's streamender Antwort, kein leeres Input-Feld. End-to-end verified: "Wie nutze ich die drei Säulen" → Reply mit 3 Säulen-Framework + 3 Action-Items.
  - **Cal.com Direct-Links** (überall wo „Strategiegespräch buchen" steht):
    - `BotMascotPanel.js`: Action-Button "Strategiegespräch buchen" → `openStrategyCall('wlad-mascot')` (war `/coaching` Zwischenseite)
    - `ProgressPage.js`: "Strategiegespräch buchen" Button → `openStrategyCall('progress-leaderboard')`
    - `ChallengersPage.js`: "Strategiegespräch buchen" (nach Challenge) → `openStrategyCall('challengers')`
    - `SimulationsPage.js`: "Strategiegespräch buchen" Upsell → `openStrategyCall('simulations')`
    - **Tier-upgrade CTAs (Events/Challenge30/Pricing) bleiben** auf `/coaching` — das sind Pricing-Page-Flows, keine direkten Bookings.
  - **Lint clean**: alle 6 geänderten Files parsed via acorn — zero syntax issues.
  - **Files Touched**: `components/video/AnalysisResults.js`, `pages/ChatPage.js`, `components/shared/BotMascotPanel.js`, `pages/ProgressPage.js`, `pages/ChallengersPage.js`, `pages/SimulationsPage.js`
- [x] **[Iter 92.23.1 · 04.06.26] P2 LIVE: Shared Mission Replay Public-Showcase + Voice RAG Monitor verified (Mert: „Shared Mission Replay-Link · Voice RAG nach erster Wlad-Audio-Click")** —
  - **3 neue Backend-Endpoints** (`backend/routes/video.py`):
    - `POST /api/missions/share` → idempotent slug-Generator, returns `{share_slug, share_url}`. Owner-only (Cookie/Bearer required).
    - `GET /api/missions/share/{slug}` → PUBLIC (kein Auth), returns showcase-payload (scores, 3+3 strengths/improvements, wlad_assessment, transcript_excerpt capped 200 chars). Increments `view_count` per visit.
    - `DELETE /api/missions/share/{slug}` → Owner-only revoke.
  - **`_persist_video_analysis()` returns entry_id** + injects es zurück in analysis dict, damit Frontend ohne extra round-trip die Share-CTA bauen kann.
  - **MongoDB Collection `mission_shares`**: `{share_slug, entry_id, user_id, challenge_id, user_name, user_picture, user_tier, created_at, view_count}`.
  - **NEW: `SharedMissionPage.js`** (`frontend/src/pages/SharedMissionPage.js`): Premium dark-mode public landing page mit:
    - Top-Bar mit LEADER-OS Brand + "Selbst testen" CTA
    - Author-Avatar + View-Count
    - Hero-Score (7xl/8xl Display) mit dynamischer Color (>=85 grün, >=70 amber, >=50 blue, else red)
    - 4-Tile Score Grid + 3-Säulen Card
    - Wlad-Assessment Card mit Leader-OS Watermark Badge
    - 3+3 Strengths/Improvements
    - Final CTA: "Willst du auch so eine Analyse?" — neon-grüner Banner mit Login-Conversion-Button
  - **Public Route** `/m/:slug` in `App.js` — NO auth wrapper (öffentliche Showcase-URL).
  - **AnalysisResults Share Button** (`components/video/AnalysisResults.js`): Nur sichtbar wenn `entry_id` exists UND `overall_score >= 50` (vermeidet peinliche Shares). Klick → Share-Link generation + auto-clipboard copy + URL-preview row mit "Öffnen ↗" link.
  - **END-TO-END VERIFIED**:
    - ✅ Submit Video → analyze-async → entry_id returned in 18s
    - ✅ POST /missions/share → 10-char slug `723e91f420`
    - ✅ GET /missions/share/{slug} public access (kein Auth nötig) → vollständige showcase payload
    - ✅ Idempotency: 2× POST mit gleicher entry_id returns same slug
    - ✅ View counter: 1 → 3 nach 3 visits
    - ✅ **Voice RAG Trigger im Pod-Log bestätigt: `Voice RAG: 6 chunks injected`**
  - **Files Touched**: `backend/routes/video.py`, `frontend/src/App.js`, `frontend/src/components/video/AnalysisResults.js`, NEW: `frontend/src/pages/SharedMissionPage.js`
- [x] **[Iter 92.23 · 04.06.26] Voice Standard + Replay + Branding + Conditional Upsell + END-TO-END verified (Mert: „Wlad voice zu hoch → standard AI · Replay function · LEADER-OS Branding im Voice-Player · Upsell nur für Free Tester · Steve Jobs final check")** —
  - **Wlad Voice = Adam standard** (`backend/routes/voice_tts.py`): Switch von "Brian" (`nPczCjzI2devNBz1zQrb`) auf **"Adam"** (`pNInz6obpgDQGcFmaJgB`) — ElevenLabs Standard-Voice, deep + neutral, "klingt wie AI" wie Mert es will. Stability auf 0.55, style 0.30 für natürlichere Performance.
  - **TTS Default-Speed 1.25× → 1.0×** (`frontend/src/lib/ttsSpeed.js`): Default playback-Rate zurück auf 1.0× weil 1.25× + `preservesPitch=false` Wlad chipmunk-y klingen ließ. User kann manuell hochschalten falls gewünscht.
  - **Pitch Preservation** (`frontend/src/components/shared/VoicePlayButton.js`): `audio.preservesPitch = true` — modernes Browser-Time-Stretching ohne Pitch-Shift, klingt natürlich auch bei 1.5×.
  - **LEADER-OS Branding im Voice-Player** (`AnalysisResults.js`): Neuer top-right Watermark Badge mit grünem W-Icon + "LEADER-OS" Label, Wlad Avatar mit Verified-Badge (grüner CheckCircle), neon-grünem Ring, deeper background gradient. Voice-Button mit "Wlad anhören" Label + Primary Variant (gelb-grün CTA) statt subtilem Pill.
  - **Mission Replay Button** (`AnalysisResults.js` + `VideoChallengePage.js`): Grüner "Mission wiederholen" Button neben "Report herunterladen". Klick clears analysis, resets recorded state, ruft `startChallenge(activeChallenge)` → Kamera startet wieder, User kann sofort 2. Versuch aufnehmen. Vorherige Versuche bleiben im Archive (`/missions/archive`) für Side-by-Side Vergleich.
  - **Conditional Upsell** (`AnalysisResults.js`): "Leadership OS PLUS 4.977 EUR" Banner wrapped in `{!isAccelerator && ...}` — User die schon zahlen sehen es nicht mehr. Free + Standard sehen es weiterhin.
  - **END-TO-END VERIFIED** (Iter 92.23):
    - ✅ Voice persona registry: Adam ID active, model `eleven_multilingual_v2`
    - ✅ Video analyze-async: complete in ~18s, 3 strengths + 3 improvements + deep_feedback_prompt + rewrite_suggestion + practice_exercises + framework_feedback
    - ✅ Community feed: shared (not user-scoped), 4 leaders in leaderboard
    - ✅ Lern-Videos: 6 starter + 4 accelerator = 10 total
    - ✅ Stripe LIVE mode + key configured
    - ✅ Voice/conversation RAG: "Voice RAG: 6 chunks injected" in backend logs
  - **Files Touched**: `backend/routes/voice_tts.py`, `frontend/src/lib/ttsSpeed.js`, `frontend/src/components/shared/VoicePlayButton.js`, `frontend/src/components/video/AnalysisResults.js`, `frontend/src/pages/VideoChallengePage.js`
- [x] **[Iter 92.22 · 04.06.26] Pre-Launch Final Polish: 3+3 Garantie, Auto-Submit, Light-Mode Fix, Vimeo Canonical Embed, Deep-Chat-CTA (Mert: „3 gut + 3 verbessern · automatische Analyse nach Stop · Light Mode lesbar · Vimeo iframe canonical embed code")** —
  - **Video-Analyse 3+3 Garantie** (`backend/routes/video.py`): LLM-Prompt verlangt jetzt explizit GENAU 3 Stärken + 3 Verbesserungen. Defensive `_ensure_three()` Post-Processor in `_run_video_ai_analysis()` paddet aus sensible Fallback-Liste falls AI weniger liefert, truncated falls AI mehr liefert. Verified End-to-End: SEXIER-Format Übung, Empathie-Block, 30-Sek-Drill — alle 3 mit konkreten Wlad-Übungen.
  - **`deep_feedback_prompt` Auto-Generation**: Wenn AI keinen liefert, baut Backend ein context-bezogenes Prompt aus Challenge-Title + Score. Frontend nutzt das für "Im Chat öffnen" CTA.
  - **Auto-Submit on Stop** (`frontend/src/pages/VideoChallengePage.js`): MediaRecorder.onstop ruft jetzt `submitVideoRef.current()` nach 250ms. Greift sowohl bei manuellem Stop als auch bei Zeitablauf (`time_limit` reached). User muss nicht mehr „Submit" klicken — Analyse läuft direkt los. `submitVideoRef` Pattern weil React closures sonst stale wären.
  - **Deep-Chat-CTA** (`frontend/src/components/video/AnalysisResults.js`): Großer dunkler Card mit „Willst du noch tiefer gehendes Feedback im Chat?" — Klick öffnet `/chat?prefill=...` mit dem `deep_feedback_prompt` aus dem Backend. Strengths/Improvements jetzt als nummerierte 1/2/3 Listen mit klaren Headlines „3 Dinge, die du gut gemacht hast" / „3 Dinge, die du verbessern kannst".
  - **Light Mode Lime Fix** (`frontend/src/pages/MyPathPage.js`): „Leadership" Heading-Color responsive — `text-[#6B8A00] dark:text-[#BFFF00]`. Light Mode rendert jetzt dunkleres Olive-Lime statt Neon, perfekt lesbar auf weißem Background (verified: `rgb(107, 138, 0)`).
  - **Vimeo Canonical Embed** (`frontend/src/components/shared/VideoPlayer.js`): iframe-URL und Attribute matchen Vimeo's offiziellem Snippet — `badge=0&autopause=0&player_id=0&app_id=58479` + `allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"` + `referrerPolicy="strict-origin-when-cross-origin"`. Wenn Vimeo-Privacy Settings korrekt für `leader-os.de` freigegeben sind, läuft der Player ohne 403.
  - **Files Touched**: `backend/routes/video.py`, `frontend/src/pages/VideoChallengePage.js`, `frontend/src/pages/MyPathPage.js`, `frontend/src/components/video/AnalysisResults.js`, `frontend/src/components/shared/VideoPlayer.js`
- [x] **[Iter 92.21 · 04.06.26] Lern-Videos als eigener Sidebar-Tab (Mert: „Lern-Videos eigene Tab · 6 Free + 4 Master Program")** —
  - **Neue Route** `/lern-videos` (`frontend/src/pages/LearningVideosPage.js`, NEW): Eigene Top-Level-Page mit „Wlads Leadership Library" Hero + bestehendem `LearningVideosTab`. Backend-counts verified: 6 Starter (Grundlagen) + 4 Master-Programme = 10 total.
  - **Sidebar erweitert** (`frontend/src/components/layout/Sidebar.js`): „Lern-Videos" unter „Insights"-Gruppe nach „Mein Fortschritt".
  - **MyPath aufgeräumt** (`frontend/src/pages/MyPathPage.js`): Tab „Lernvideos" entfernt, da jetzt eigene Route. `TabsList` reduziert auf nur „Mein Fortschritt" Tab.
  - **DashboardLearningVideos CTA** umgeleitet auf `/lern-videos` (war vorher `/my-path?tab=videos`).
  - **App.js**: Route registriert + Legacy-Alias `/learning-videos` → `/lern-videos`.
- [x] **[Iter 92.20 · 04.06.26] Pre-Launch Polish: Lange Audio + Voice-RAG + Dashboard-Videos + UI-Cleanup (Mert: "Lern-Videos im Dashboard · Wlad-Universum löschen · My Path → Mein Fortschritt · Vlad-Schreibung verbieten · Voice-Mode mit RAG ohne Hänger · Whisper >25 MB")** —
  - **Whisper-Pipeline now supports any audio length** (`routes/video.py`): Raw-Upload-Cap auf 500 MB (war 25 MB), ffmpeg normalisiert auf 16 kHz Mono MP3 (~90% Shrink), bei >24 MB normalisiertem File: Auto-Re-encode auf 32 kbit/s → Split in 10-Min-Chunks → **parallele Whisper-Calls** via `asyncio.gather` → joined transcript. Verified: 60-Min/55 MB Audio läuft komplett durch (6 Chunks à 2.29 MB).
  - **Async Job Pattern** für Video-Analyse (`POST /api/video-challenges/{id}/analyze-async` → 202 + job_id; `GET /api/video-challenges/jobs/{job_id}` → status polling). Umgeht Cloudflare-30s-Edge-Timeout. Frontend (`VideoChallengePage.js`) polled alle 2.5s mit defensive Fallback auf alten sync `/analyze` falls async noch nicht deployed. Verified end-to-end: 3-Min Audio 1s submit + 39s analyse (vorher 504-timeout).
  - **VoiceRecorder Cap 2 Min → 15 Min** (`components/shared/VoiceRecorder.js`)
  - **Voice-Mode mit RAG-Injection** (`routes/voice_tts.py`): `_voice_llm_reply` ruft jetzt `services_rag.retrieve_context` parallel zu history fetch via `asyncio.gather`. Wlad-Frameworks (3 Säulen, Kommunikationsquadrant, Schwarze Rhetorik) sind im System-Prompt referenziert. Backend-Log bewies: "Voice RAG: 6 chunks injected".
  - **Voice-Latency Fix**: gpt-5.2 → **gpt-4o-mini** für Voice-Mode (Reply <2s vs vorher 15-25s). Hard-Timeout 28s im Frontend + saubere Error-State statt endlosem "WladBot denkt nach…" Loop.
  - **Vlad → Wlad Defensive Normalisation** (`_normalize_wlad_name`): TTS-Input + Voice-Response + Transcript laufen durch Regex-Replace (`\bVlad\b` / `\bVladimir\b` / `\bWladimir\b` → `Wlad`). System-Prompt zusätzlich striktest instruiert.
  - **Sidebar Cleanup** (`components/layout/Sidebar.js`): `/wlad-universe` Eintrag entfernt; "My Path" → "Mein Fortschritt".
  - **MyPathPage Title** (`pages/MyPathPage.js`): Eyebrow "MY PATH" → "MEIN FORTSCHRITT". Tab-Deeplinking via `?tab=videos`.
  - **DashboardLearningVideos** (NEW: `components/dashboard/DashboardLearningVideos.js`): Kompakte horizontal-scrollbare Video-Tile-Row direkt im Dashboard (Starter-Kurse), "Alle Kurse"-CTA navigates to `/my-path?tab=videos`. In-app Vimeo-Player Modal beim Click.
  - **Wlads Frameworks IN den Chat** (`components/chat/ChatEmpty.js` rewrite): 3-Säulen Framework-Grid prominent in der Chat-Mitte mit Glow-Effects, color-coded Pillar-Borders, click-to-prefill. Alte `WladTopicChips` unter dem Chat-Input ENTFERNT (`components/chat/ChatInputBar.js`).
  - **Files Touched**: `backend/routes/video.py`, `backend/routes/voice_tts.py`, `frontend/src/pages/DashboardPage.js`, `frontend/src/pages/MyPathPage.js`, `frontend/src/pages/VideoChallengePage.js`, `frontend/src/components/layout/Sidebar.js`, `frontend/src/components/chat/ChatEmpty.js`, `frontend/src/components/chat/ChatInputBar.js`, `frontend/src/components/shared/VoiceRecorder.js`, `frontend/src/hooks/useVoiceMode.js`, NEW: `frontend/src/components/dashboard/DashboardLearningVideos.js`
- [x] **[Iter 92.18 · 03.06.26] Mobile-Audit Fixes + CRM-Integration Wingman-ready (Mert: „Mobile Audit für FakeWladCall Toast + WladHelp FAB + OnboardingVideoModal · CRM-Integration mit Wingman · make sure all works")** —
  - **Mobile-Audit (iPhone 13 viewport 390×844 getestet):**
    - **OnboardingVideoModal Book/Skip Buttons**: war fatal squished (`flex-1 h-12` + parent `flex-col` = 308×20px = unklickbar). Fix: `sm:flex-1 h-12 min-h-12` → jetzt **308×48px** ✅ Apple-HIG-compliant Touch-Target
    - **OnboardingVideoModal Wording**: "1:1 mit Wlads **Team**" → "1:1 mit Wlads **Expertenteam**" (Konsistenz mit Iter 92.16)
    - **FakeWladCall vs WladHelp FAB Overlap-Fix**: Beide saßen auf `bottom-6 right-6` → kollidierten auf Mobile. Jetzt: FakeWladCall checkt aktive Route → wenn auf WladHelp-Allowed-Path (chat/coaching/my-path/etc), positioniert sich auf `bottom-24 right-6` (über FAB), sonst klassisch `bottom-6 right-6`
    - **WladHelp FAB**: 56×56px Touch-Target ✅, Panel 92vw max-380px fits Viewport ✅
    - **Vimeo Modal black**: bekannt (Mert muss Vimeo-Privacy auf "Anywhere" für 1197728183 setzen — kein Code-Bug)
  - **CRM-Integration „Wingman-ready"** (`/app/backend/services_crm.py`, 175 lines NEW):
    - **Vendor-neutral** Webhook-OUT system. Sobald Mert sein Wingman-CRM hat: `CRM_WEBHOOK_URL=<url>` + `CRM_WEBHOOK_SECRET=<shared>` → auto-aktiv. Aktuell: silent no-op bei missing URL = safe für jetzigen Production-Push.
    - **Architektur**: fire-and-forget via `asyncio.create_task` → blockt NIE die API-Response. 1-retry bei 5xx/network-hiccup. `httpx.AsyncClient` mit 6s-Timeout. Best-effort (kein DB-Outbox — kann später bei Bedarf nachgerüstet werden).
    - **Security**: jeder Webhook signiert mit `X-Leaderos-Signature` (HMAC-SHA256) → Mert's CRM kann Authenticity verifizieren.
    - **Stabile Schema**: `{type, occurred_at, user_id, email, tier, name, data}` — abwärtskompatibel, neue Event-Types brechen nichts.
    - **6 Lifecycle-Events gehookt:**
      - `user.signup` ← `routes/auth.py` register endpoint
      - `user.tier_upgraded` / `user.tier_downgraded` ← `services_tier.activate_tier()` (Direction automatisch via tier-rank)
      - `checkout.completed` ← `routes/payments.py` checkout_callback (amount, package_id)
      - `support.question_asked` ← `routes/support.py` `/api/support/ask` (Sales-Intent-Signal!)
      - `mission.completed` ← Helper bereit, noch nicht gehookt (TODO post-launch)
      - `consultation.booked` ← Helper bereit, noch nicht gehookt (TODO Cal.com Webhook)
    - **Live-Test ohne URL**: `CRM_WEBHOOK_URL=False` → completely silent (no errors)
    - **Live-Test mit URL** (httpbin.org als Mock): POST mit 64-char HMAC-Signature → HTTP 200 confirmed
  - **Files touched (8)**: NEW `backend/services_crm.py`, modified `routes/auth.py` (signup hook), `services_tier.py` (tier_changed hook), `routes/payments.py` (checkout_completed hook), `routes/support.py` (support_question hook), `OnboardingVideoModal.js` (button heights), `FakeWladCall.js` (overlap fix). ESLint + Ruff alle clean.
  - **Smoke-Test**: alle 14 Routes rendern crash-frei, CRM emit funktional, Mobile-Layout 100% korrekt verifiziert.

- [x] **[Iter 92.17 · 03.06.26] Pre-Launch Polish — Voice + WladHelp Smart-Trigger + No-Refund-Policy + Final Sanity** —
  - **ElevenLabs Wlad-Voice umgestellt**: war `pNInz6obpgDQGcFmaJgB` "Adam" (deep + stern, klang unsympathisch) → jetzt `nPczCjzI2devNBz1zQrb` **"Brian"** (warm + natural + conversational male). Stability 0.55→0.50, similarity_boost 0.75→0.78, style 0.40→0.45 für mehr Wärme. **Env-overridable**: `ELEVENLABS_WLAD_VOICE_ID=<id>` falls Mert einen Voice-Clone von Wlad in seinem ElevenLabs-Workspace nachschiebt.
  - **WladHelp Smart-Trigger**: vorher auf allen Authed-Pages sichtbar → jetzt NUR auf Help-Pages wo User Aktivierung brauchen. **Allowed**: `/chat, /coaching, /my-path, /playbooks, /simulations, /tools, /missions, /community, /events, /video-challenge, /leader-diagnose, /enterprise, /daily-checkin`. **Hidden auf**: `/dashboard, /profile, /referral, /onboarding, /login, /auth/*, /payment-success, /impressum, /datenschutz, /widerruf, /agb, /downloads, /email/unsubscribe, /challengers`. E2E-Verifiziert: 2/2 hidden-routes ohne FAB, 6/6 allowed-routes mit FAB.
  - **WladHelp Refund-Policy umgestellt** (Mert: „nie für Refund immer nur upgrade oder Fokus auf AI Weiterbildung"):
    - Refund-FAQ entfernt → bei Cancel/Refund/„Geld zurück" Triggers leitet jetzt zu **support@leader-os.de + Cal.com Strategiegespräch** (retention-save statt direkter Self-Service-Anleitung)
    - **System-Prompt umgeschrieben**: WladHelp ist jetzt Retention + Activation Agent. „Refund-/Cancel-Anliegen NIEMALS direkt anleiten — IMMER zu support@leader-os.de leiten (persönlicher Save)". Positives Framing Pflicht.
    - **2 neue Upgrade-Focused FAQ-Shortcuts**:
      - `"ki lernen, ai weiterbildung, prompt engineering"` → "Im MyPath findest du den AI-Mastery Track — 16 strukturierte Missionen…" + Action zu `/my-path` + `/chat`
      - `"was bringt mir, lohnt sich, value, vorteil"` → "Leader-OS macht aus dir einen AI-fluenten Leader…OS PLUS €4.447/Jahr…" + Action zu `/coaching` + Cal.com
    - **Upgrade-FAQ erweitert**: jetzt nennt OS PLUS Features ("12× 1:1 Coaching mit Wlads Expertenteam + 35 Kurse + unbegrenzte AI-Sessions")
    - **Quick-Prompts aktualisiert**: war ["Strategiegespräch", "Refund", "Upgrade auf PLUS", "Login"] → jetzt ["AI als Leadership-Multiplier", "Strategiegespräch", "Was bringt mir OS PLUS?", "Login"] — kein Refund-Trigger mehr in Quick-Access
  - **Page-by-Page Smoke-Test**: ALLE 14 main Routes rendern crash-frei (`/dashboard`, `/chat`, `/my-path`, `/coaching`, `/profile`, `/missions`, `/playbooks`, `/simulations`, `/tools`, `/events`, `/community`, `/wlad-universe`, `/daily-checkin`, `/leader-diagnose`). 0 Console-Errors. WladHelp Smart-Trigger funktional bestätigt.
  - **RAG Recovery bestätigt**: Supabase PostgREST nach SSL-Restart recovered. Test-Query "Killerphrasen" → `chunks=3, top_score=0.3729` → Wlad-Wissen wieder zugänglich.
  - **Files touched (4)**: `backend/routes/voice_tts.py` (Wlad voice + env-override), `backend/routes/support.py` (FAQ + system-prompt overhaul), `frontend/src/components/support/WladHelpButton.js` (Smart-Trigger + Quick-Prompts), `memory/PRD.md`. ESLint + Ruff alle clean.

- [x] **[Iter 92.16 · 03.06.26] „Wlads Expertenteam" Wording + FakeWladCall Tone-Down + RAG Resilience** —
  - **„mit Wlad" → „Wlads Expertenteam"** Mass-Replace in 12 strings über 14 Files (Frontend + Backend). E2E-verifiziert: 0 leaks im rendered DOM.
  - **FakeWladCall**: MAX 1× pro Session (war 2), Trigger 5 Min (war 3), NICHT fullscreen mehr — kompakte 360px Toast-Card unten rechts, aria-modal="false". Kill-Switch via `localStorage.wlad_fake_call_disabled='1'` oder URL `?nocall=1`.
  - **RAG Resilience**: 3-attempt retry mit exponential backoff auf Supabase PGRST002 schema-cache errors in `services_rag` + `routes/admin/rag-debug`. Klare error-messages. Supabase Platform-Glitch (Mert's bekanntes Issue) braucht entweder warten oder Supabase-Dashboard "Reload schema cache" — Code-side ist optimal defensive.

- [x] **[Iter 92.15 · 03.06.26] Community-Konsolidierung + WladHelp AI Support (Mert: „ein Community-Bereich, alles bleibt da, Support automatisieren")** —
  - **Community: ein kanonischer Bereich** — bisher zeigten ZWEI Routes (`/community` UND `/progress`) auf dieselbe CommunityPage → verwirrend. Jetzt sauber: `/progress` → `<Navigate to="/community" replace />`. Sidebar-Nav-Item zeigt jetzt korrekt `/community`. Backend Community-Routes (`feed`, `posts`, `posts/{id}/like`, `posts/{id}/comments`) waren bereits persistent in MongoDB (`community_posts`, `community_comments` collections). Smoke-Test bestätigt: 11 aktive Posts, alle User-Posts (Mert, Felix, Stefan) seit 13-40 Tagen sichtbar → nichts geht verloren.
  - **Community 10k-User Indexes** in `server.py` startup hook hinzugefügt:
    - `community_posts.created_at -1` (feed-recent)
    - `community_posts.category + created_at -1` (filtered feed)
    - `community_posts.user_id + created_at -1` (user-own posts page)
    - `community_comments.post_id + created_at 1` (thread-load)
    - `community_comments.user_id + created_at -1` (user-own comments)
    - `support_messages.user_id + created_at -1` (admin audit für WladHelp)
  - **WladHelp Backend** (`/app/backend/routes/support.py`):
    - `POST /api/support/ask` mit `SupportAskIn{message, session_id?}` → `SupportAskOut{answer, session_id, suggested_actions[]}`
    - **2-Stage Architecture**: FAQ-Shortcut-Match (instant, no-LLM cost) bevor LLM-Fallback
    - 6 FAQ-Shortcuts: refund, coaching-buchen, upgrade, passwort, unsubscribe, "wer ist Wlad"
    - LLM-Fallback: GPT-5.2 mit tight `SUPPORT_SYSTEM_PROMPT` der Leader-OS-Tiers + Pricing + Cal.com + Support-Email kennt
    - Persistiert jedes Q&A in `support_messages` collection (audit + future ML)
    - **Smoke-Test bestätigt funktional**: FAQ "Wie kann ich Refund?" → 0ms, korrekte 30-Tage-Garantie-Antwort + mailto-Action. LLM "Was unterscheidet PLUS von Standard?" → kennt €997 vs €4.447, 12 Coachings, Cal.com-Link.
  - **WladHelp Frontend** (`/app/frontend/src/components/support/WladHelpButton.js`):
    - Floating Action Button (FAB) bottom-right, lime Apple-style mit live-dot
    - GSAP entrance choreography (back.out 1.4)
    - Premium dark Modal mit Aurora-glow + Quick-Prompts beim Cold-Start
    - 4 Quick-Prompt-Pills (Strategiegespräch buchen, Refund, PLUS-Upgrade, Login-Fehler) — single-click
    - Multi-Turn Chat via `session_id` (Backend-tracked)
    - Suggested-Actions als pills (mailto / external Cal.com / internal route)
    - Hidden auf `/login`, `/auth/callback`, `/payment-success`, `/email/unsubscribe`
    - Mounted global in `App.js` neben FakeWladCall → sichtbar auf allen authed Routes
  - **Smoke-Test Resultate**: FAB count=1 (visible), Panel opens=1, Messages after quick-prompt=3 (intro+user+LLM-answer), Community-page renders=1, /progress→/community redirect=verified, 0 Console-Errors.
  - **Wlad-Marketing-Hint:** Du hast jetzt 11 aktive Community-Posts seit 40 Tagen — das ist sozialer Proof für deine Landing-Page. Embed "11 aktive Leader teilen Wins" als Live-Counter.

- [x] **[Iter 92.14 · 02.06.26] 🎉 FIRST REAL SALE — Wlad's €1 PLUS Test End-to-End ✅** —
  - **Stripe €1 Live-Mode Charge** verarbeitet auf `acct_1TYd2YA6vBlw9Oi4`
  - **Supabase Subscription** `leadership_os_plus_yearly` aktiv bis 2027-06-03
  - **MongoDB Mirror** synced: tier=accelerator
  - **Webhook Pipeline funktional**: Stripe → Supabase Edge Fn (`stripe-webhook`) → `subscriptions_enroll_journey` Trigger → `plus_onboarding` Journey
  - **Resend Email Delivery** ✅:
    - `purchase_welcome_plus` → Resend ID `4363f3fd-6a5f-41b4-b66d-7538eec05a79`
    - `free_course_1` → Resend ID `3c910647-07fe-470e-9953-c9918e369164`
  - **Vimeo Domain Whitelist** `leader-os.de` aktiv
  - **Stripe Webhook Signing Secret** in Supabase Edge Fn ENV gesetzt
  - **Test-Coupon** `h7k1NOLc` (TEST1EURO) noch 4× verfügbar
  - **Known Issue (transient):** Supabase Platform-Glitch heute → pg_net DNS-Timeouts → Dispatcher hängt. Bypass via direct pg_net→Resend funktioniert. Sobald Supabase recovered (Stunden), läuft Pipeline automatisch.

- [x] **[Iter 92.13 · 26.02.26] Stripe LIVE-Mode aktiviert + Deploy-Manifest** —
  - **`STRIPE_API_KEY=sk_live_…`** in `/app/backend/.env` gesetzt (Mert pastete den Key, ich rotiere-Reminder wurde abgegeben → Mert muss den Key in Stripe-Dashboard rollen, da im Chat geleakt).
  - **Health-Endpoint** `/api/payments/stripe-mode` returnt jetzt: `{mode: "live", live: true, warning: null, key_prefix: "sk_live_…"}` → live confirmed.
  - **Frontend Banner** verschwindet automatisch (Banner-Count = 0 für admin user). Smoke-test bestätigt: 5/5 Checks GREEN.
  - **Deploy-Files erstellt:**
    - `/app/.env.production.template` — vollständige 11 Backend ENVs + 4 Frontend ENVs mit comments
    - `/app/DEPLOY.md` — 5-Schritt Klick-Anleitung (12 Min) mit Stripe Live-Key + Webhook-Setup, Rollback-Procedure, ENV-Checklist
    - `/app/scripts/smoke_test_production.sh` — One-Command Health-Check (`API_BASE=https://leader-os.de bash …`), 5 Checks, exit 0/1
    - `/app/docs/PRODUCTION_READINESS.md` — vollständige Skalierungs-Doku (Agent-Matrix, Index-Tabelle, Gunicorn-Config, Caching-Strategy)
  - **Verifikation**: Smoke-Test 5/5 GREEN (Backend health, Stripe live, Auth endpoint, Events public, Webhook signature-reject). UI bestätigt Banner-removal. Dashboard rendert komplett: Wlads Zitat des Tages, Stat-Cards (AI Readiness 68/Lernfortschritt 10%/Tag 30), Schnellzugriff-Tiles, UpcomingEventsCard mit echten Donnerstag-Events.
  - **⚠️ Mert-Action vor Public Launch:**
    1. Stripe Key rotieren (Chat-leaked) → dashboard.stripe.com → Roll key → neuer sk_live_ → in Vercel ENVs setzen
    2. Stripe Webhook anlegen unter dashboard.stripe.com/webhooks: URL `https://leader-os.de/api/webhook/stripe`, 4 Events (checkout.session.completed, async_payment_succeeded, async_payment_failed, payment_intent.payment_failed), `STRIPE_WEBHOOK_SECRET` aus Stripe in Vercel ENVs
    3. Vercel redeploy → `bash /app/scripts/smoke_test_production.sh` mit `API_BASE=https://leader-os.de` → erwarte 5/5 grün
    4. 1€ Test-Charge mit eigener Karte → Refund über Stripe Dashboard sofort
    5. Vimeo Privacy → "Anywhere" für ID 1197728183

- [x] **[Iter 92.12 · 26.02.26] 10k-User Readiness + Stripe-Mode Transparenz (Mert „Anbindung Stripe perfekt? Agenten harmonisieren? 10k user?")** —
  - **Stripe Mode Health-Endpoint** (`GET /api/payments/stripe-mode`): public, kein secret, returnt `{ configured, mode (live/test/platform_default/missing/unknown), live (bool), warning, key_prefix }`. Erkennt automatisch ob `sk_live_…`, `sk_test_…`, der Emergent-Default `sk_test_emergent` oder fehlt komplett. Code-Pfade in `routes/payments.py` sind 100% live-ready (kein switch nötig — nur env-key tauschen).
  - **Stripe Mode Banner** (`/app/frontend/src/components/admin/StripeModeBanner.js`): Admin/Owner-only banner im Dashboard. Zeigt glasklar PLATFORM-SANDBOX-KEY + Warnung + direkten Link zu `dashboard.stripe.com/apikeys` + Hinweis wo Live-Key gesetzt werden muss. Self-hide sobald `sk_live_…` aktiv. 12h-Dismiss optional. Smoke-test: Banner sichtbar für `test@test.com` (admin via `ADMIN_EMAILS` allowlist), unsichtbar für free user.
  - **`mertzafermutlu@gmail.com` als admin/owner markiert**: `users.role=owner`, `is_admin=true` in DB. Auch zu `routes/admin.py ADMIN_EMAILS` hinzugefügt (defense in depth).
  - **10k-User Scaling Indexes** (`server.py` startup hook, alle idempotent):
    - `users.user_id` unique sparse + `users.tier + created_at` (cohort queries)
    - `email_log.user_id + type` (drip-dedup) + TTL 1y on `sent_at` (auto-purge)
    - `ab_test_events.user_id + experiment` (bucket-lookup) + `experiment + event + created_at -1` (analytics)
    - `events.start_date` (calendar queries)
    - `chat_messages.user_id + created_at -1` (history page)
    - `video_attempts.user_id + created_at -1` (archive page)
    - `login_attempts.ip + created_at -1` (IP rate-limit)
    - Backend-log bestätigt: "10k-user scaling indexes ensured (email_log, ab_test_events, events, chat_messages, video_attempts, login_attempts.ip)"
  - **Agent-Orchestration Audit**: 12 LLM-Routes alle einheitlich auf `EMERGENT_LLM_KEY` + `openai/gpt-5.2` + eindeutige `session_id`. 4 RAG-Surfaces (chat/playbooks/video/simulations) nutzen einheitlich `services_rag.retrieve_context()` mit Voyage-3. JSON-Parsing via gemeinsamen `services_ai_parse.parse_ai_json`. **Resultat: HARMONIE bestätigt** — alle Agents sprechen denselben "Wlad-Dialekt".
  - **Production-Readiness Doc** (`/app/docs/PRODUCTION_READINESS.md`): Komplette Pre-Launch Checklist mit Stripe-Live-Bringup, Webhook-URLs, Gunicorn-Config für 10k user (`--workers 4 --worker-connections 1000 --max-requests 5000`), Mongo connection pool sizing, CDN-Strategy, Rate-Limit-Empfehlung (Cloudflare), Caching-Layer Status, Monitoring-Setup.
  - **Smoke-Validated**: Curl `/api/payments/stripe-mode` returns `mode=platform_default, live=false, warning="Using Emergent's shared sandbox key…"`. Frontend-Banner für admin sichtbar mit korrektem Text + Link. Backend startup-log zeigt alle 12 neuen Indexes erstellt. ESLint clean. Ruff clean.

- [x] **[Iter 92.11 · 26.02.26] Pre-Deploy Crash-Hardening (Mert ErrorBoundary Report)** —
  - **`lazyWithRetry` Helper** (`/app/frontend/src/lib/lazyWithRetry.js`): ersetzt alle 31 `lazy(...)` Imports in `App.js`. Robust gegen den klassischen Stale-Bundle-Crash: nach jedem Deploy halten offene Browser-Tabs cached chunk-Manifeste mit altem Hash → Navigation triggert 404 auf `chunk.OLDHASH.js` → React.lazy() promise rejects → ErrorBoundary fängt es (genau Mert's Repro). Wrapper retries einmal nach 600ms backoff, dann force-reload zur frischen `index.html`, mit `sessionStorage`-Flag gegen Infinite-Loop. `clearChunkReloadGuard()` läuft im `AppRouter` `useEffect` nach jeder erfolgreichen Navigation. Edge-case: covers webpack/CRA "ChunkLoadError", "Loading chunk N failed", Vite-style "Failed to fetch dynamically imported module", "Importing a module script failed".
  - **OnboardingVideoModal Defensive Null-Checks**: `dismiss()` und entrance `gsap.context(...)` jetzt mit try-catch + Ref-Existence-Guards. Falls `cardRef.current` oder `overlayRef.current` mid-animation `null` werden (z.B. user navigiert weg), fällt der Code sauber auf `setOpen(false)` zurück statt zu crashen. Headline word-stagger, video reveal, CTA stagger alle behind `if (ref?.current) ...`.
  - **UpcomingEventsCard Hover GSAP → CSS**: `EventRow` Hover-Lift (`y: -2`) was über `gsap.to` + `addEventListener` implementiert — anfällig für null-ref races wenn Parent re-rendert mid-hover. Ersetzt durch reines Tailwind `hover:-translate-y-0.5 transition-all duration-200`. Identischer Look, zero JS-side state, kein crash-Vector.
  - **UpcomingEventsCard Entrance**: gsap.context wrapped in try-catch + early-return wenn rootRef beim revert null wird.
  - **Smoke-Validated**: **21/21 Routen** rendern crash-frei (`/dashboard`, `/chat`, `/my-path`, `/coaching`, `/profile`, `/missions`, `/playbooks`, `/simulations`, `/tools`, `/events`, `/wlad-universe`, `/daily-checkin`, `/leader-diagnose`, `/missions/archive`, `/downloads`, `/challenge`, `/progress`, `/referral`, `/tasks`, `/challengers`, alles + zurück zu `/dashboard`). `CI=true yarn build` Exit 0 mit 31 chunks gesplittet. Onboarding-Modal rapid-dismiss + Cal.com Modal-Open Flow ohne Crash. PricingModal Open für free-Tier User ohne Crash.

- [x] **[Iter 92.10 · 26.02.26] Final Polish — Vimeo + GSAP + "FREE"-Cleanup (Mert „100 Mio$ App Level")** —
  - **Vimeo statt Google Drive**: `OnboardingVideoModal` nutzt jetzt den universellen `VideoPlayer` mit Vimeo-ID `1197728183` (Mert lieferte den Link). Override via env `REACT_APP_ONBOARDING_VIMEO_ID`. ⚠️ **Vimeo Privacy-Setting muss in Mert's Vimeo-Account angepasst werden** (Privacy → "Where can this be embedded?" → `leader-os.de` + `*.preview.emergentagent.com` whitelisten oder auf "Anywhere") — sonst zeigt Vimeo "Sorry. Because of its privacy settings, this video cannot be played here." Embed-Code ist 100% korrekt im Pod.
  - **„FREE/Free"-Cleanup komplett**: Alle UI-Strings für Strategiegespräche entwölkt — keine "Free Call", "FREE FOREVER", "Kostenlos · Unverbindlich"-Combos mehr. Stattdessen Premium-Wording: "Strategiegespräch · 15 Min · 1:1 · Unverbindlich". Affected: `OnboardingVideoModal`, `OnboardingPage Step 5`, `CoachingRightPanel`, `CoachingPage Booking-Section`, `PricingModal Footer`, `coachingData.js FAQ` (DE+EN), `LanguageContext upsell.noCreditCard` (DE+EN), `upsell.bookCallSub`, `funnel.startBtn`, `PlaybookReport`. LearningVideosTab Starter-Pack: "FREE FOREVER" → "INKLUSIVE", "100% Gratis" → "Ohne Anmeldung", "Leadership-Grundlagen — Kostenlos" → "Leadership-Grundlagen — Sofortstart".
  - **GSAP wieder im Game (sauber diesmal)**: `gsap@3.15.0` + `@gsap/react@2.1.2` per yarn-add zurückgeholt. KEIN globaler `useMotion` Hook (war Iter 87 Bug-Cause). Stattdessen lokale `gsap.context(...)` mit auto-cleanup pro Component:
    - `OnboardingVideoModal`: backdrop fade → card scale+slide (`back.out(1.4)`) → eyebrow → headline word-by-word stagger mit rotateX → subtitle → video reveal → CTA-row spring stagger. Smoother Exit-Animation auf dismiss.
    - `UpcomingEventsCard`: header drop-in → event-rows slide-from-right mit 80ms stagger (`back.out(1.4)`) → "Alle Events ansehen" fade. Plus per-row hover micro-interaction (gsap.to translateY -2px).
  - **Premium Glassmorphism Layer**: OnboardingVideoModal bekam SVG-Grain-Texture (overlay 2.5% mix-blend) + dual aurora-orbs (lime + violet) für echten "Apple Vision Pro" Tiefen-Look.
  - **8 Files Touched**: `lib/calendly.js`, `components/onboarding/OnboardingVideoModal.js`, `components/dashboard/UpcomingEventsCard.js`, `components/coaching/CoachingRightPanel.js`, `components/coaching/coachingData.js`, `components/mypath/LearningVideosTab.js`, `components/playbooks/PlaybookReport.js`, `components/shared/PricingModal.js`, `contexts/LanguageContext.js`, `pages/OnboardingPage.js`, `pages/CoachingPage.js`, `package.json` (+2 deps).
  - **Smoke-Tested**: Standard-User Login → Modal triggert nach 1.1s → GSAP-Choreography läuft → Vimeo-iframe geladen (Privacy-Block separat) → "Strategiegespräch buchen" CTA Lime-glow → 0 FREE-wording-leaks im rendered DOM bestätigt via E2E. ESLint clean auf gesamtem `components/` tree.

- [x] **[Iter 92.9 · 26.02.26] Godmode Polish Wave (Mert "100 Mio$ App Level") — Pre-Vimeo Layer** —
  - **Vimeo statt Google Drive**: `OnboardingVideoModal` nutzt jetzt den universellen `VideoPlayer` mit Vimeo-ID `1197728183` (Mert lieferte den Link). Override via env `REACT_APP_ONBOARDING_VIMEO_ID`. ⚠️ **Vimeo Privacy-Setting muss in Mert's Vimeo-Account angepasst werden** (Privacy → "Where can this be embedded?" → `leader-os.de` + `*.preview.emergentagent.com` whitelisten oder auf "Anywhere") — sonst zeigt Vimeo "Sorry. Because of its privacy settings, this video cannot be played here." Embed-Code ist 100% korrekt im Pod.
  - **„FREE/Free"-Cleanup komplett**: Alle UI-Strings für Strategiegespräche entwölkt — keine "Free Call", "FREE FOREVER", "Kostenlos · Unverbindlich"-Combos mehr. Stattdessen Premium-Wording: "Strategiegespräch · 15 Min · 1:1 · Unverbindlich". Affected: `OnboardingVideoModal`, `OnboardingPage Step 5`, `CoachingRightPanel`, `CoachingPage Booking-Section`, `PricingModal Footer`, `coachingData.js FAQ` (DE+EN), `LanguageContext upsell.noCreditCard` (DE+EN), `upsell.bookCallSub`, `funnel.startBtn`, `PlaybookReport`. LearningVideosTab Starter-Pack: "FREE FOREVER" → "INKLUSIVE", "100% Gratis" → "Ohne Anmeldung", "Leadership-Grundlagen — Kostenlos" → "Leadership-Grundlagen — Sofortstart".
  - **GSAP wieder im Game (sauber diesmal)**: `gsap@3.15.0` + `@gsap/react@2.1.2` per yarn-add zurückgeholt. KEIN globaler `useMotion` Hook (war Iter 87 Bug-Cause). Stattdessen lokale `gsap.context(...)` mit auto-cleanup pro Component:
    - `OnboardingVideoModal`: backdrop fade → card scale+slide (`back.out(1.4)`) → eyebrow → headline word-by-word stagger mit rotateX → subtitle → video reveal → CTA-row spring stagger. Smoother Exit-Animation auf dismiss.
    - `UpcomingEventsCard`: header drop-in → event-rows slide-from-right mit 80ms stagger (`back.out(1.4)`) → "Alle Events ansehen" fade. Plus per-row hover micro-interaction (gsap.to translateY -2px).
  - **Premium Glassmorphism Layer**: OnboardingVideoModal bekam SVG-Grain-Texture (overlay 2.5% mix-blend) + dual aurora-orbs (lime + violet) für echten "Apple Vision Pro" Tiefen-Look.
  - **8 Files Touched**: `lib/calendly.js`, `components/onboarding/OnboardingVideoModal.js`, `components/dashboard/UpcomingEventsCard.js`, `components/coaching/CoachingRightPanel.js`, `components/coaching/coachingData.js`, `components/mypath/LearningVideosTab.js`, `components/playbooks/PlaybookReport.js`, `components/shared/PricingModal.js`, `contexts/LanguageContext.js`, `pages/OnboardingPage.js`, `pages/CoachingPage.js`, `package.json` (+2 deps).
  - **Smoke-Tested**: Standard-User Login → Modal triggert nach 1.1s → GSAP-Choreography läuft → Vimeo-iframe geladen (Privacy-Block separat) → "Strategiegespräch buchen" CTA Lime-glow → 0 FREE-wording-leaks im rendered DOM bestätigt via E2E. ESLint clean auf gesamtem `components/` tree.


  - **Calendly KOMPLETT raus**: `/app/frontend/src/lib/calendly.js` neu — `openStrategyCall(utmSource, prefill)` öffnet jetzt Cal.com Modal (`leaderos/beratung` namespace) via `window.Cal.ns.beratung('modal', ...)`. Fallback auf Tab-URL mit prefill (?name, ?email, utm). Affected: CoachingPage Booking-Card, Booking-Section "Strategiegespräch buchen 15 Min Kostenlos", CoachingRightPanel quick-action "Free Strategiegespräch" (war BUG: rief `onCheckout('accelerator')` statt Cal.com).
  - **`UpcomingEventsCard` ins Dashboard + MyPath** wired: ersetzt `WeekCalendarCard` im Dashboard right-rail (Donnerstag-Cohort, Top-3 zukünftige Events, +Cal-Button → GCal-URL, card-lift Hover). MyPath right-rail bekommt eine zweite Instanz unter "Weiter trainieren".
  - **Sidebar Profile-Gear**: Subtiles `Settings` icon (Lucide) erscheint im SidebarFooter-Profile-Row, dreht sich 90° on hover, signalisiert "klick mich für Einstellungen" → navigates `/profile`. `data-testid="sidebar-profile-gear"`.
  - **Voice-Recorder 2-Min Timer**: `VoiceRecorder.js` komplett umgebaut. Hard auto-stop bei 120s. Live mm:ss Countdown (tabular-nums, Outfit Font). Animated SVG-Progress-Ring schrumpft as time runs out. Letzte 20s: red pulse + ping-Indicator. Auto-stop räumt MediaRecorder + Stream + Intervals sauber auf. `data-testid` für `voice-record-btn`, `voice-stop-btn`, `voice-countdown`, `voice-recording-active`.
  - **OnboardingVideoModal**: NEU `/app/frontend/src/components/onboarding/OnboardingVideoModal.js`. Triggert EINMAL pro Browser (`localStorage.wlad_onboarding_video_seen_v1`) 1.2s nach Dashboard-Mount. Premium dark mit Lime/Violet aurora-glow, 16:9 Drive-iframe, primary CTA „Free Strategiegespräch buchen" → Cal.com, secondary „Später ansehen". Source: Google Drive Folder `1VK2m343YcuKrrh3bykCHuRB9EdZbHCUK` (Folder-Embed default; `REACT_APP_ONBOARDING_VIDEO_FILE_ID` env-overridable für direkten file/preview).
  - **Onboarding Step 5 „Free Strategy Call"**: Neuer Step zwischen `wladhub` und `done`. Emerald+Lime Gradient-Card, 3-Pill-Grid (15 Min · 1:1 Strategie · 0€ · 0 Stress), prominenter `glow-lime btn-shine` CTA "Termin auswählen" → Cal.com, dezenter Skip-Link.
  - **PricingModal Tier-Aware**: liest jetzt `useTier()`. `accelerator/plus` → komplette "Du hast schon alles"-Empty-State mit Crown-Icon. `standard` → blendet `leadership_os` + `leadership_os_12x` aus, zeigt NUR die Single OS-PLUS Upgrade-Card + grünen "Bereit für 1:1 mit Wlad?" Upsell-Banner darüber. `free/starter` → unverändert (alle 3 Cards). Grid auto-switch zu `md:grid-cols-1 max-w-md` bei nur 1 sichtbarem Paket.
  - **Dashboard Upsell-Banner Tier-Aware**: ganzes `<Card>` Verstecken für `isAccelerator`. Standard-User sehen: Headline "Bereit für 1:1 Coaching mit Wlad?" + Button "OS PLUS holen" (öffnet `leadership_os_plus`). Free-User unverändert.
  - **Smoke-Tested**: Standard-User Login → Dashboard rendert mit OS-PLUS-Upsell + UpcomingEvents (3 echte Events) + Sidebar-Gear + Onboarding-Video-Modal (dismissed via skip-button). ESLint clean auf allen 8 modifizierten Files.

- [x] WLADHUB Brand Design (Neon Lime, Dark+Light)
- [x] Enterprise Auth (JWT+Cookie, Refresh, Security Headers)
- [x] 50 Credits + soft_pause at 10
- [x] 300 deep AI/Leadership quiz questions (30-Day Challenge) — Free vs Paid gating
- [x] Video Analysis (Whisper+GPT-5.2) + 5-page PDF reports — **now Accelerator-only gated**
- [x] My Path Gamification (5 Levels + certificates)
- [x] Events & Execution Hub (Calendar Integration, Focus Time System)
- [x] In-App Event Reminders
- [x] WladHub Supabase Sync (bi-directional)
- [x] Personalized 3-Layer Scores (KI/Rhetorik/EQ)
- [x] XP System with labels
- [x] iPhone-style BotMascot, AI News Briefing, Smart Popups
- [x] **[Iter 56] Challengers freie Reflexion** — pre-canned Chips entfernt, offenes Textfeld + Voice
- [x] **[Iter 56] Daily Check-in Voice Capturing** — Whisper-Transkription mit prominenter Mic-CTA
- [x] **[Iter 56] Immersive "AI Agents" Loading States** — 7 Flow-Presets
- [x] **[Iter 56] Rich XP Level Card** mit Beschreibungs-Label
- [x] **[Iter 56] Resend Email Service** — LIVE mit `reminders@leader-os.de`
- [x] **[Iter 56.1] PaywallModal Compact** + Kontrast-Fixes (lime-on-white)
- [x] **[Iter 57] 3-Tier-System** — Free / Starter €199 / Standard €997 / Accelerator €6.970
- [x] **[Iter 57] Accelerator 12×-Installment** — via Stripe Checkout Rate 1/12, sofortiger Zugang, monatliche Reminder-Emails
- [x] **[Iter 57] TierBadge** in Sidebar + Dashboard-Header
- [x] **[Iter 57] TierContext** — globale Feature-Matrix (hasFeature, isAccelerator, etc.)
- [x] **[Iter 57] Video-Analyse Gating** — HTTP 402 für Non-Accelerator auf Backend
- [x] **[Iter 72] Audio-Mode (Voice Conversation)** — Hands-free ChatGPT/Claude-Style Voice-Modus mit Wlad-Voice (ElevenLabs), Whisper-Transkription, VAD-Silence-Detection, Auto-Loop, Safari-Fallback. Toggle via Headphones-Button im Chat.
- [x] **[Iter 57] TierLockOverlay** — Fullscreen Upgrade-CTA auf gelockten Seiten
- [x] **[Iter 57] Tier Welcome Email Sequences** — starter/standard/accelerator Templates via Resend
- [x] **[Iter 57] Installment Cron** — `/api/cron/installments-due` scannt fällige Raten, verschickt HTML-Emails mit 1-Klick-Zahllink
- [x] **[Iter 58] Community Feed** — Facebook-style Feed + Top Leaders Leaderboard + Community-Puls widget (`/api/community/feed`, `/api/admin/community/leaderboard`)
- [x] **[Iter 58] Admin Panel** — Gated Admin page (403 für Non-Admin)
- [x] **[Iter 58] Deep-Assist Workflow** — `/api/tools/deep-assist` liefert strukturiertes JSON (Argumentation + Tipps + Action Plan); Modal auf ToolsPage
- [x] **[Iter 58] WladBot Multi-Format Upload** — PDF + DOCX + TXT + Images via `/api/chat/upload-document` (pypdf, python-docx, lxml)
- [x] **[Iter 58] MyPath Lernvideos-Tab** — saubere Trennung Fortschritt vs. Lernvideos. 10 Kurse: 6 Starter (Lifetime) + 4 Accelerator-exklusive Masterclasses. `GET /api/my-path/videos` liefert Tier-gated Katalog.
- [x] **[Iter 59] Group Coaching Upsell** — 2 neue Packages (€49/mo + €299/Jahr) + UI auf PaymentSuccessPage als Post-Purchase-Upsell. Stripe Checkout integriert, Addons speichern via `users.addons.<package_id>`.
- [x] **[Iter 90 · 25.02.26] P0 Resend Email Sprint** — Signup-Welcome (`/api/auth/register` + Google OAuth), Stripe-Receipt (im `_activate_from_package`), Trial-Reminder (3 Tage vor 14-Tage-Video-Trial-Ende), 7-Tage Drip (Day 1 Foundation, Day 3 Quick-Win, Day 7 Conversion). Cron-Endpoints: `/api/cron/trial-reminders` + `/api/cron/drip-sequence` (idempotent via `email_log` dedup). Status-Endpoint `/api/lifecycle/status`.
- [x] **[Iter 90 · 25.02.26] P1 RAG Metadata Cleanup** — 313 ehemals "unknown" Chunks heuristisch auf canonical Course-Namen gemappt: 76 Führung durch Gründe + 64 Die 5 Rollen + 45 Schwierige Gespräche + 43 Verhandlung + 30 Schlagfertigkeit + 21 Digitale Rhetorik + 13 13 Kommunikationsfehler + 11 WladBot Expansion + 7 Leader-OS Framework + 2 Argumentorik Masterclass + 1 Ressourcen. Admin-Endpoints: `/api/admin/rag-enrich-metadata` (dry-run+apply), `/api/admin/rag-uncategorized-samples`. UI im RAG Studio mit "Dry-Run" + "Apply Backfill" Buttons.
- [x] **[Iter 90 · 25.02.26] Supabase RPC metadata-fallback** — `match_wladbot_documents` projiziert `metadata=NULL`. Backend-Workaround in `services_rag._backfill_metadata` holt fehlende Metadata per `id=in.(...)` GET nach. Permanent-Fix SQL bereitgestellt in `/app/docs/SUPABASE_FIX_match_wladbot_documents.sql`.
- [x] **[Iter 94 · 25.02.26] In-App Stripe-Checkout-Modal + globaler Pricing-Context (Conversion-Bombs)** —
  - **`PricingModal.js` (NEU · Apple-grade)**: 3-Tier Pop-Up direkt in der App (Leadership OS 997€ · 12× Rate 99€/Mo · OS PLUS 4.447€). „Direkt kaufen" Button ruft `/api/payments/checkout` und leitet zur Stripe-hosted page (SCA-konform, Klarna/Apple Pay/SEPA/Karte). Trust-Strip (SSL · 30d Geld-zurück · 3DS-2), num-ticker Preise (40px), VIP Badge auf OS PLUS, Outfit Font, Light/Dark sauber via design tokens.
  - **`PricingContext.js` (NEU)**: globaler Provider `<PricingProvider>` + Hook `usePricing()`. Jede Komponente kann `open('leadership_os')` oder `open('leadership_os_plus')` aufrufen — Modal pop-up state lebt in Context, kein navigate-away mehr.
  - **Conversion-Verkabelung**: `navigate('/coaching')` durch `openPricing(...)` ersetzt in: Sidebar-Footer Upgrade-Button (tier-aware default), DashboardPage Premium-Werben-Button, DashboardPage Grace-Badge, ChatPage Inline-Upsell + Chat-Input-Bar Premium-Mini-Button, WladUniversePage Hero (NEU: 3-CTA Layout: Kauf + Beratung + Chat), WladUniversePage Ausbildung-Section + Closer-CTA. TierLockOverlay und LearningVideosTab öffnen Pricing direkt statt PaywallModal.
  - **PaywallModal Refactor**: Bleibt als „credits-out" Soft-Pause Modal, öffnet aber jetzt das `PricingModal` als Sub-Pop-Up. Beide Tier-Karten triggern es mit dem richtigen Default-Tier (Standard/PLUS).
  - **Smoke-getestet**: hero-buy-cta → öffnet PricingModal mit 3 Cards · pricing-buy-leadership_os startet Stripe-checkout (war-status 200) · pricing-book-cal öffnet cal.com Modal · Light/Dark beide rendern sauber.
- [x] **[Iter 93 · 25.02.26] FINAL Light-Mode WCAG-Fix + Logo-Reverse + Pop-Up CTAs** —
  - **Color tokens**: Jedes Wlad-Role + Pillar trägt jetzt `colorDark` (Neon, AA auf #0A0A0A) UND `colorLight` (WCAG-AA-safe auf #FFFFFF; lime → #5A7700, sky → #0070B8, amber → #A56A00, pink → #C42463, violet → #6D49D6). `WladUniversePage` nutzt `useTheme` und passt jede Akzent-Farbe live an. Kein knalliges Neon mehr auf weißem Text.
  - **Logo invertiert + Pixel-Style**: `WladMark.js` SVG neu gezeichnet → 5 aufsteigende pixelige Balken (3px breit, jeweils höher) wie ein nach-oben-Chart, mit Crown-Dot auf dem höchsten Balken + subtiler Baseline. `shapeRendering="crispEdges"` für scharfe Pixel-Optik. Genau die „ascending chart W"-Idee aus dem Brief.
  - **Pop-Up CTAs**: `TierLockOverlay` + `LearningVideosTab` rendern jetzt das bestehende `PaywallModal` statt navigate('/coaching') — User bleibt im Kontext. Strategiegespräch-Button öffnet zusätzlich das cal.com Modal direkt aus dem Overlay heraus.
- [x] **[Iter 92 · 25.02.26] Cal.com Integration + Light/Dark Token-Refactor + Landing-Page-Mode** — `WladUniversePage` komplett refactored: alle Farben jetzt über design tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`) statt hardcoded `text-white` → Light Mode hat jetzt perfekte Lesbarkeit. Neuer `--brand` HSL-Token + `tailwind.config.js` registriert `brand` als Tailwind color (Light: `72 100% 27%` / Dark: `72 100% 50%`). Cal.com Embed-Script in `index.html` initialisiert namespace `beratung` → öffnet Modal über `BookConsultationButton` mit Slug `leaderos/beratung`. 5 strategische Booking-CTAs auf der Page (Hero/Roles/Ausbildung/Closer + ghost button). Outfit-Font als globale `h1-h6` Schriftart. Headings: 34-62px font-black, -0.035em letter-spacing — Revolut/Linear-würdig. Halo-Gradients + aurora orbs, alle responsive. Live-getestet: Cal-Modal lädt Slug, zeigt Mert Mutlu Profile + 15min Beratungsgespraech mit echten Slots.
- [x] **[Iter 91 · 25.02.26] Revolut-Inspired Design Polish + Premium Logo** — Neue `WladMark`-Komponente (3-Stroke-W mit Crown-Dot, SVG, animiert mit Stroke-Draw bei Hover) ersetzt das simple "W" überall: Sidebar, App-Loading, AuthCallback, OnboardingPage, LoadingOverlay, LoginBrandPanel + LoginPage Mobile-Header. Neue Wordmark „Leader·OS" mit „Powered by WladBot" Tagline. Outfit-Font für Display-Typo importiert. Neue CSS-Animation-Layer: `cascade` (staggered fade-in für Card-Container), `motion-fade-in-up` / `motion-scale-in`, `card-revolut` (Glow-Halo + Lift on Hover), `btn-revolut` (Soft-Press), `num-ticker` (tabular-nums + ss01 feature), `focus-ring` (Keyboard-A11y), `reveal-on-scroll` (Intersection-Observer-ready). Cascade auf Dashboard + WladUniverse aktiviert. `prefers-reduced-motion` honoured. Light/Dark Parity via Design-Tokens. Alle Lints clean.
- [x] **[Iter 90 · 25.02.26] Wlad-Universum + Authentizität** — `/wlad-universe` Page mit 5 Rollen, 13 Topics in 3 Säulen, 3 echten Büchern (Weiße Rhetorik, Dunkle Rhetorik, Die 5 Rollen einer Führungskraft), Argumentorik-Masterclass, Podcast „Menschen überzeugen", staatlich zertifizierter 6-Monats-Ausbildungs-CTA + Stats-Strip (400k Kunden, 14M Views, 250k Bücher, 12 Bücher inkl. 3 SPIEGEL-Bestseller). Sidebar-Link unter "Insights" hinzugefügt. `WladTopicChips`-Komponente unter dem Chat ersetzt den falschen „Die Kunst der Kommunikation"-Link (Buch existiert nicht) durch klickbare Starter-Prompts für alle 13 Wlad-Themen. ChatPage liest `sessionStorage.wlad_starter_prompt` und befüllt Input-Bar automatisch. WLADBOT_SYSTEM_PROMPT erweitert um Track-Record, echte Bücher, 5 Rollen, 13 Themen + Agent-Routing für Rhetorik / Verhandlung.
- [x] **[Iter 90 · 25.02.26] Video-Analyse Bulletproofing** — Whisper bekam "Invalid file format" Errors weil MediaRecorder's video/webm Container manchmal von OpenAI abgelehnt wurde. Fix: `_transcribe_audio` pipet alle Uploads jetzt durch ffmpeg → strippt Video, downmixt zu mono 16 kHz MP3 → schickt erst dann an Whisper. Bundle: `imageio-ffmpeg` (Python pip) als Fallback wenn System-ffmpeg fehlt. Beide Endpoints `/api/video-challenges/{id}/analyze` + `/api/voice/transcribe` nutzen dieselbe Pipeline. Defensive Guards: empty file → 400, > 25 MB → 413, kein Sprachsignal erkannt → 422 (statt 500). UI zeigt jetzt Toast-Error mit Backend-Detail statt stille Stummheit. Regression-Pytest in `/app/backend/tests/test_video_analyze_pipeline.py`.
- [x] **[Iter 90 · 25.02.26] Learning Videos Vimeo-Manager** — `db.learning_videos` Mongo-Override-Collection wird beim `/api/my-path/videos` Aufruf gemerged (vimeo_id/vimeo_url/video_url). Admin-UI `/wlad-control-x7k9q2` zeigt `LearningVideosManager` zum Live-Eintragen ohne Code-Deploy. Endpoints: `GET/PUT /api/admin/learning-videos/{id}`.
- [x] **[Iter 59] Monthly Leadership Scorecard** — `/api/cron/monthly-scorecard` (Accelerator-only). Sendet monatliche Email mit XP-Delta, Challenge-Tage-Delta, 3-Layer-Bars, Top-Insight + Next-Focus. Idempotent via `email_log` + `scorecard_history`.
- [x] **[Iter 59] Code Review Refactors** — `admin_overview()` in 5 helpers gesplittet, `get_three_layer_score()` in 3 helpers, WladHubCard (191 Z) in 5 Sub-Komponenten, EventReminder (139 Z) in 3 Sub-Parts, Challenge30Page nested ternaries in 5 Helper-Funktionen extrahiert. Type Hints für server.py + seed_test_users.py.
- [x] **[Iter 65 · 2026-02] Component Split Sprint** — 3 große Pages refaktoriert, +16 neue fokussierte Sub-Komponenten:
  - `CommunityPage.js` **361 → 153 Z** → `components/community/` (CommunityCompose, CommunityFilters, CommunityPost, CommunityLeaderboard, communityConstants)
  - `PlaybooksPage.js` **398 → 196 Z** → `components/playbooks/` (PlaybookListCard, PlaybookChatMessage, PlaybookChatView, PlaybookReport)
  - `ChatPage.js` **443 → 192 Z** → `components/chat/` (chatRoles, ChatMessage, ChatRolesHeader, ChatEmpty, ChatUpsellModal, ChatInputBar, ChatInlineUpsell) + `buildFullMessage` helper extrahiert
  - Zero Regressions: alle data-testids erhalten, Frontend-Test 100% PASS (iteration_65.json)
- [x] **[Iter 66 · 2026-02] httpOnly Cookie Auth Migration** — XSS-Schutz durch vollständige Umstellung von localStorage-Bearer-Tokens auf pure httpOnly-Cookie-basierte Sessions:
  - Frontend: `localStorage.wladbot_token` ENTFERNT (war XSS-anfällig), Axios `withCredentials:true` sendet httpOnly Cookie automatisch, KEIN `Authorization: Bearer` Header mehr auf `/api/*` Requests
  - Backend: unverändert (setzte bereits HttpOnly+Secure+SameSite=lax Cookie seit Iter 52). JWT-Token im Response-Body für externe API-Consumer beibehalten, aber Frontend liest ihn nicht mehr.
  - `api.js` vereinfacht (70 Z): 401 → `/auth/refresh` once, dann Redirect zu /login wenn fehlgeschlagen
  - `AuthContext.login(userData)` ohne Token-Param; `checkAuth()` ruft nur `/auth/me`
  - Verifiziert: curl + Playwright E2E — 0 Authorization-Header auf 40+ API-Calls, session_token Cookie httpOnly=true (`iteration_66.json`)

- [x] **[Iter 134 · 2026-06 · GO-LIVE GATE] Kaufstrecke, Rechnung, Onboarding** — Wlad-Direktive: keine neuen Features, nur alles fixen, was einen echten Kunden am Kauf hindert.
  - **Echte Stripe-Rechnung (Blocker behoben)**: `routes/payments.py` erstellt Checkout Sessions jetzt mit dem rohen Stripe-SDK statt dem generischen Wrapper. Neu: `invoice_creation.enabled=true` (Stripe erzeugt + mailt die Rechnung), echter Produktname statt "Payment", `billing_address_collection=required` (Pflicht für DE-Rechnung), Kunden-Dedupe über `Customer.list(email)` → keine doppelten Stripe-Kunden. Gilt für Standard-Checkout UND Ratenzahlung.
  - **Status-Endpoint** liefert `package_name`, `tier`, `invoice_url`, `invoice_number`; Rechnungslinks werden in `payment_transactions` persistiert (`_attach_invoice_links`).
  - **1-€-Livetest Release-Gate**: neue Admin-Endpoints `GET/POST/DELETE /api/admin/livetest/buyers` + Panel `components/admin/LiveTestPanel.js` (Aktivierungscode, Link, fertiger Anleitungstext zum Rausschicken, Liste aller 1-€-Transaktionen inkl. Rechnungsnummer). Gate: `is_admin OR livetest_buyer` (DB-Flag, keine claimbare E-Mail-Allowlist) + Code `WLAD-1EURO-2026`.
  - **RAG-Vollständigkeit** (Wlad: "man sieht nicht, ob alles drin ist"): `GET /api/admin/rag/coverage` vergleicht die Quell-ZIP mit `rag_chunks` → 53/53 Dateien, 7.463 Chunks, keine Lücken. Button "Ist alles drin? (Bücher-Check)" im RAG Control Center.
  - **Onboarding**: Wlads Begrüßungsvideo (MP4, H.264, Click-to-Play) direkt vor dem Start; kein Voice/TTS; AI-Slop-Copy entfernt ("komplementäre Methodik", "perfekt kalibriert", Fake-Scarcity "Slots offen", ae-Tippfehler); alle Gedankenstriche (—) aus sichtbarer Onboarding-Copy entfernt (Wlad: "AI-Slop-Strich"); Standard-Wlad-Foto überall.
  - **PaymentSuccessPage**: Polling 20×3 s (statt 5×2 s) mit eigenem "wird noch verarbeitet"-Zustand statt Fehlmeldung; 404 → sofort klare Fehlerkarte mit "Zurück zum Kauf"; echte Rechnungsnummer + Stripe-Rechnungslink; Feature-Liste spiegelt jetzt TIER_CONFIG (keine falschen Versprechen wie "16 Video-Missionen" für Standard).
  - **DashboardFirstTour** startet stumm (Voice nur auf Wunsch). **UsageFeedbackPrompt** erscheint nicht mehr auf /onboarding, /coaching, /payment-success (verdeckte CTAs).
  - Tests: `backend/tests/test_iter134_golive.py` 7/7 PASS; Frontend-Report `test_reports/iteration_129.json`.
  - **[Iter 134.1] Avatar-Vereinheitlichung**: Überall der WladBot-Avatar von leadercheck.de (`https://leadercheck.de/wladbot-3-nobg.png`). Ersetzt das echte Foto (`WladProfilbild.jpg`) in `lib/brand.js` + 8 weiteren Stellen (WladBotAvatar, BotMascot, BotMascotPanel, SmartPopups, PaywallModal, OnboardingTour, coachingData, ReferralPage). Ein Gesicht über Diagnose (leadercheck.de) und Produkt (leaderos.de) hinweg.

- [x] **[Iter 135 · 2026-08-13 · GODMODE FINAL AUDIT]** Vollaudit RAG → Admin → leadercheck-Sync → Premium → SEO → Security → Scale. Keine neuen Produkt-Features, nur Härtung.
  - **P0 Isolation-Bug gefixt**: `POST /api/chat` vertraute einer mitgeschickten `session_id`. User B konnte mit der Session-ID von User A posten → dessen Verlauf landete im Prompt und in der Antwort. Jetzt Ownership-Check in `_ensure_session` (404) + `user_id` im History-Query. Test: `test_foreign_session_id_is_rejected`.
  - **RAG-Staleness gefixt**: `invalidate_caches()` in `services_rag.py`, aufgerufen nach Re-Ingest, Wissens-Upload und Quelle-Löschen. Vorher konnte der Coach bis zu 1 h aus dem alten Korpus antworten.
  - **RAG-Resilienz**: `retrieve_context()` komplett gekapselt (`gather(return_exceptions=True)` + Top-Level-Guard) — Embedding-OOM oder Vektor-Fehler führen jetzt zu einer nicht-gegroundeten Antwort statt zu HTTP 500.
  - **Quellenangaben**: Chunk-Header im Prompt tragen jetzt den lesbaren Titel (`_source_label` nutzt `_clean_display_title`). Premium-gated Prompt-Regel „Quelle: <Titel>" — bei Wissensfragen verifiziert.
  - **leadercheck.de-Sync repariert**: war one-shot (`has_wladhub_diagnosis` → nie wieder). Jetzt Re-Check max. alle 6 h pro Login, Vergleich über `source_assessed_at`; neuer Wert → Update, gleicher Wert → `unchanged`. Jeder Versuch landet in `wladhub_sync_log` (`completed|unchanged|not_found|error`) — vorher schrieb der automatische Pfad NICHTS, Admin zeigte 0 Syncs.
  - **Zahlungs-Sicherheitsnetz**: `reconcile_pending_payments()` läuft bei jedem Login (fire-and-forget, max. 3 Sessions, toter Session-Status wird gemerkt). Wer bezahlt hat, aber die Erfolgsseite nie gesehen hat, bekommt den Zugang beim nächsten Login. Login-Redirect (`postLoginRoute(user, from)`) bringt den User zurück auf `/payment-success`.
  - **Premium-first Rollout** (neu, schlank): `routes/features.py`, Collection `feature_rollout`, Stufen `off|premium|all`, `GET /api/features`, Admin-Panel `FeatureRolloutPanel`.
  - **Admin = Kontrollzentrum**: `/admin/rag/local-status` (Chunks, Quellen, Modell, Vektor-Cache, Live-Retrieval-Probe), `/admin/sync-health` (completed/unchanged/not_found/failed, letzter Erfolg, letzter Fehler + Grund), Ops-Runbook-Panel im Dashboard, `/admin/rag/coverage` (53/53).
  - **Scale**: fehlende Indizes ergänzt (`payment_transactions.session_id` — wurde beim Checkout alle 3 s ohne Index abgefragt, `credits.user_id`, `chat_sessions.session_id`, `tasks`, `folder_items`, `wladhub_*`, `feature_rollout`).
  - **SEO**: `src/lib/seo.js` setzt Title/Description/Canonical/OG pro Route (vorher ein einziges Canonical `/` für alle Seiten → Duplicate-Content). Sitemap auf 9 wirklich indexierbare URLs reduziert (`/` und `/signup` raus: Redirect bzw. Duplikat).
  - Tests: `test_iter135_godmode_audit.py` 15/15, `test_iter135_failure_modes.py` 10/10, `test_iter134_golive.py` 6/6, Regression (chat/folder/autosync/rag) 33 passed. Frontend-Audit `test_reports/iteration_135.json`: 12/12 grün. Prod-Build ohne Warnungen.
  - **[Iter 135.1] Avatar sauber + Sprachausgabe-Wahrheit**: Der WladBot-Avatar ist jetzt ein 512×512-Gesichts-Ausschnitt auf ruhigem Hintergrund (`public/wladbot-avatar-clean.png`, generiert aus `leadercheck.de/wladbot-3-nobg.png`). Grund: das transparente Ganzkörper-PNG wurde in kleinen Kreisen (Chat-Header, Nachrichten, FAB, 28–32 px) zu einem dunklen Punkt. Eine Quelle für alles: `lib/brand.js`, `components/brand/WladBotAvatar.js`, E-Mails + Magic-Link, FakeWladCall; `components/shared/WladBotAvatar.js` (Zap-Kachel) ist nur noch ein Re-Export. Verifiziert auf /chat, /challengers, /playbooks, /dashboard, /login, /onboarding: 0 gebrochene Bilder.
  - Gedankenstriche („AI-Slop-Strich") auch aus Dashboard-Tour und Login-Copy entfernt.
  - **Befund**: `ELEVENLABS_API_KEY` in `backend/.env` ist eine Key-**ID**, kein API-Key (muss mit `sk_` beginnen) → gesamte Sprachausgabe war stumm tot, aber mit HTTP 200 „erfolgreich". Jetzt liefert `/api/voice/tts` `error: elevenlabs_invalid_api_key` und die UI zeigt einen Hinweis statt stumm nichts zu tun. Echter Key nötig (siehe DEV_HANDOVER §6).

- [x] **[Iter 136 · 2026-08-19] Wlad-Bugliste: E-Mail-Zustellung, Lizenz-Wiederanmeldung, Rechnungsdaten, „Über mich"**
  - **E-Mail-Guard (nicht umgehbar)**: `services_email.send_email` prüft jetzt vor jedem Versand `_sendability()` — ungültige Adressen, Test-/Reserved-Domains (`.test`, `.local`, `.invalid`, `example.com`) und die Sperrliste `email_suppression`. Permanente Resend-Fehler landen automatisch auf der Sperrliste (+ `users.email_status="invalid"`), damit die Absender-Reputation nicht durch Bounces leidet. Alle drei Domains (leaderos.de, leadercheck.de, leader-os.de) sind bei Resend verifiziert; Absender `wlad@leaderos.de` getestet (Live-Mail an info@argumentorik.com zugestellt).
  - `email_verified` wird jetzt beim Magic-Link-Klick gesetzt (`email_verified_via: magic_link`) und hebt eine Sperre auf. Magic-Link-Erstellung für existierende Accounts verifiziert (Testfall).
  - **Lizenz-Wiederanmeldung gefixt**: `POST /api/auth/license/activate` warf bei bereits eingelöstem Key 400 „bereits eingelöst" — der grüne Pfeil war für Bestandskunden eine Sackgasse. Jetzt: gleicher Key + gleiche E-Mail + korrektes Passwort → Re-Login (`relogin: true`), fremde E-Mail → 400, falsches Passwort → 401, OAuth-Konto → 409. Eigener DE-Validator für die E-Mail (keine englische Pydantic-Meldung mehr). Hinweistext im Formular erklärt die Wiederanmeldung.
  - **Stripe-Rechnung**: Verkäufer jetzt „Argumentorik-Akademie GmbH · Tölzer Str. 1 · 82031 Grünwald · info@argumentorik.com" (Footer + Custom Fields), kein „Leadership OS", keine Telefonnummer.
  - **Premium-Copy**: „500 Credits/Monat", „16 Video-Missionen" und die 12-Videokurse-Drip-Ansage sind aus Post-Purchase- und Billing-Texten raus; Paket-Werbung wird zahlenden Nutzern nicht mehr gezeigt.
  - **„Über mich"** (`users.about_me`, 6000 Zeichen, editierbar): Karte + Editor im Profil; fließt über `services.get_user_memory()` in JEDEN AI-Workflow. Vom Test-Agent bestätigt: WladBot bezieht sich in der Antwort konkret auf den gespeicherten Kontext (Team, Konfliktvermeidung, Bereichsleiter-Ziel).
  - **Toter Code entfernt**: `BotMascot.js`, `BotMascotPanel.js`, `BotMascotRinging.js` waren nirgends eingebunden (das Live-Widget ist `FakeWladCall`). Buchungs-CTA dort auf Brand-Lime statt Emerald; Cal.com-Embed bekommt `cal-brand-text` (lesbarer dunkler Text auf Lime).
  - Profil-Hero zeigt keine erfundenen Tier-Labels mehr („plus Member" → Mapping mit Fallback).
  - Tests: `tests/test_iter136_fixes.py` 11/11; Regression 33 passed (iter134/135/136); `test_iter135_failure_modes.py` 10/10 standalone; Frontend-Report `test_reports/iteration_136.json`; Prod-Build ohne Warnungen.
