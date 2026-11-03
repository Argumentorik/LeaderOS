# Wlads Produkt-Feedback vom 28.10.2026 · Befund und Stand

Quelle: Wlads Antwort auf die Mail vom 27.10. Hier steht, was der Code (Branch
`mvpcode`) dazu sagt, was geändert wurde und was noch offen ist.

## Vorab: wo die App läuft

Wlad testet die App auf **leaderos.de**. Das ist das **Emergent-Deployment**
(`docs/ops/DEPLOY.md`, `docs/ops/APP_TAKEOVER_STEFAN.md`), nicht die
Vercel-Seite. Vercel liefert `leader-os.de` und `leader-check.de` (Marketing,
Webinar, Journal, Diagnose-Funnel) und leitet App-Routen wie `/login`,
`/dashboard`, `/chat`, `/simulations`, `/onboarding` per `vercel.json` auf
`leaderos.de` um. `leaderos.de` ist im Vercel-Team als Domain eingetragen,
hängt aber an keinem Vercel-Projekt.

Folge: **Ein gemergter PR ist auf leaderos.de erst live, wenn in Emergent aus
`mvpcode` deployt wird** (manuell, Stefan). Am 23.10. fehlten dort die
Webinar-Routen (`/api/webinar/stats` lieferte 404), die Emergent-Version war
also älter als `mvpcode`. Alles, was Wlad bemängelt, kann deshalb auch an einem
alten Deployment liegen.

## Punkt für Punkt

| Wlad schreibt | Befund im Code | Aktion | Stand |
| --- | --- | --- | --- |
| „Ist das schon für alle live?“ | Kein Einladungs-Gate im Code (Suche nach invite, waitlist, closed beta in Auth, Config, Login ohne Treffer): Registrierung ist offen, 14 Tage Test über `/signup?trial=14`. Welche Version auf leaderos.de läuft, ist nicht geprüft. | Stefan deployt `mvpcode` in Emergent und prüft `/api/health`, `/api/webinar/stats`. | offen (Stefan) |
| „Antwortqualität lässt zu wünschen übrig, WladBot beantwortet einige Fragen nicht richtig“ | Von hier nicht nachstellbar (kein Zugriff auf Live-Backend und Modell). Verdächtige: älteres Deployment; fehlender Embedding-Key oder Provider nach der Neueinrichtung auf Emergent (dann liefert die Wissenssuche nichts und WladBot antwortet ohne Wlads Material); Schwelle `RAG_MATCH_THRESHOLD` (0,40). | Stefan ruft als Admin `GET /api/admin/rag/golden-check` und `GET /api/admin/rag/local-status` auf (zeigt, welche Prüffragen kein Wlad-Wissen finden). Wlad schickt 3 bis 5 Fragen mit der falschen Antwort, wir nehmen sie in `backend/tests/test_golden_questions.py` auf. | offen (Stefan, Wlad) |
| „Argumentationstraining greift nicht auf SEXIER zurück, war früher besser“ | SEXIER ist verbindlich in der **Argumentations-Vorbereitung** (`routes/simulations.py`, `ARGUMENTATION_PREP_PROMPT`), im **Voice-Sparring** (Prep-Kontext) und im **Video-Feedback** (`routes/video.py`, Hauptbewertungsmuster). Es fehlte im **Text-Rollenspiel**: dort bewusst keine Frameworks, RAG nur am Ende, ohne SEXIER-Vorgabe. Kein Rückschritt in der Historie: Commit 36d9ae1 vom 09.07. hat den SEXIER-Satz im Video-Prompt umformuliert, nicht entfernt. | **Geändert** (`backend/services_simulation.py`): Bei Überzeugungs-Szenarien (Gehaltsverhandlung, Beförderungsgespräch, Veränderung kommunizieren, Feedback nach oben, Argumentation) hakt die Figur nach, wo ein SEXIER-Schritt fehlt (Warum? Beispiel? Was heißt das für mich? Und der Einwand?), ohne das Modell beim Namen zu nennen. Das Abschluss-Feedback bewertet die Argumentation nach SEXIER, die Wissenssuche am Ende zieht SEXIER-Material. | im Code erledigt, wirkt nach dem Emergent-Deploy |
| „Antwortgeschwindigkeit beim Gesprächstraining könnte schneller sein“ | Jede Rollenspiel-Antwort lief über gpt-5.2. Im Code ist dokumentiert, was das heißt (`routes/voice_tts.py`, Iter 92.20 und 115): gpt-5.2 braucht 15 bis 25 Sekunden je Antwort, gpt-4o 3 bis 5 Sekunden. Dazu kam keine Längenvorgabe für die Figur. | **Geändert**: Rollenspiel-Züge laufen über gpt-4o, Antworten auf zwei bis vier Sätze begrenzt. Umschaltbar per Env `SIM_TURN_MODEL` (z. B. `anthropic/claude-haiku-4-5-20251001`, oder `openai/gpt-5.2` für den alten Stand). Die JSON-Auswertung (am Ende und ab der 8. Manager-Nachricht) bleibt bei gpt-5.2. Nicht gemessen (kein Modellzugang hier): nach dem Deploy eine Simulation durchspielen und die Zeit prüfen. Nächste Stufe wäre Streaming (Antwort erscheint Wort für Wort), braucht Backend und Frontend. | im Code erledigt, Messung nach Deploy |
| „Einführungsvideos jetzt nur zum Lesen, Onboarding-Videos auch nur Text, warum?“ | (a) `OnboardingVideoModal`: Vimeo-Embed wurde in Iter 92.32 entfernt, weil der Player „cannot be played here“ meldete (Vimeo-Datenschutz: Domain nicht freigegeben); seit Iter 92.34 („alle PopUps erstmal weglassen“, Go-Live) ist das Modal ganz abgeschaltet. (b) Das Willkommens-Video im Onboarding (`OnboardingIntroSteps`, `lib/brand.js`) lädt von einem Emergent-Asset. (c) Die Gratis-Serie „Führung beginnt hier“ (`services_free_videos.py`) hängt an Google-Drive-Dateien; YouTube- und Vimeo-IDs sind leer, der vierte Clip hat gar keine Quelle (Platzhalter „coming soon“). | **Nicht geändert**, braucht Entscheidung und Zugang: (1) In Vimeo beim Video 1197728183 die Domains `leaderos.de`, `www.leaderos.de`, `leader-os.de`, `www.leader-os.de` freigeben; danach binde ich das Willkommens-Video im Onboarding wieder ein (kleine Frontend-Änderung). (2) Dauerhaft besser: die Clips auf Wlads YouTube-Kanal und `youtube_id` eintragen, unabhängig von Drive und Workspace. (3) Drive-Dateien der Serie nicht verschieben oder löschen, sonst brechen die Einbettungen. Wlad soll sagen, welche Videos er genau vermisst. | offen (Mert, Wlad) |
| „Finde ich sehr übersichtlich“ | – | – | notiert |
| Drive: „über Google Workspace teilen, nicht von deinem privaten Drive“ | Der Drive-Connector dieser Sitzung hängt an `start@aiporate.com`. Von dort kann ich nicht in den Argumentorik-Workspace schreiben. | Mert verbindet in den Claude-Connectors Google Drive mit dem argumentorik.com-Konto, danach lege ich den Ordner dort neu an und teile von dort. | offen (Mert) |
| Tools: „Higgsfield habe ich nicht, Loom ja, sonst nichts“ | – | Aufnahme mit Loom (steht im Video-Plan), kein Higgsfield nötig. | erledigt |

## Nach dem Emergent-Deploy prüfen (Stefan, 10 Minuten)

1. `GET /api/health`, `GET /api/webinar/stats` antworten.
2. `GET /api/admin/rag/golden-check` ist `PASS`; sonst `local-status` ansehen.
3. Eine Simulation „Gehaltsverhandlung“ durchspielen: Antwort der Figur in unter ca. 5 Sekunden, zwei bis vier Sätze; mit „end“ beenden: das Feedback nennt SEXIER-Schritte.
4. Ist die Antwort zu dünn, `SIM_TURN_MODEL=anthropic/claude-haiku-4-5-20251001` oder `openai/gpt-5.2` setzen, ohne neuen Code.
