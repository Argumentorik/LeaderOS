# Vimeo-Workflow für Lernvideos — How-To für Wlad / Mert

> Ziel: Sobald Wlad ein neues Video aufnimmt, soll es ohne Code-Änderung in der App
> erscheinen. Dieses Dokument erklärt den kompletten Workflow.

---

## TL;DR (30 Sekunden)

1. Video auf **Vimeo** (Pro/Business Account) hochladen
2. In den Vimeo-Einstellungen **"Private + Embed Allowed"** aktivieren
3. Die **Numeric Vimeo ID** (z.B. `987654321`) aus der URL kopieren
4. Im **Admin Panel** unter `/wlad-control-x7k9q2` → "Learning Videos" → das passende
   Video auswählen → `vimeo_id` eintragen → Save
5. **Fertig** — beim nächsten Reload des `/my-path` Lernvideos-Tabs spielt der
   In-App-Vimeo-Player das Video ab.

---

## Was geht aktuell live?

| Video-ID | Titel | Tier | Vimeo-ID gesetzt? |
|---|---|---|---|
| v1 | Rhetorik-Grundlagen | 🟢 FREE | — |
| v2 | Schwierige Gespräche meistern | 🟢 FREE | — |
| v3 | Delegation wie ein Profi | 🟢 FREE | — |
| v4 | Feedback-Formate (SBI & WWW) | 🟢 FREE | — |
| v5 | Storytelling im Boardroom | 🟢 FREE | — |
| v6 | Meeting-Rhetorik | 🟢 FREE | — |
| v7 | KI-First Leadership | 👑 Accelerator | — |
| v8 | Change Management Master | 👑 Accelerator | — |
| v9 | Executive Presence | 👑 Accelerator | — |
| v10 | Boardroom-Strategie | 👑 Accelerator | — |

**Aktueller Stand:** Alle 10 Videos sind als Karten sichtbar. Sobald `vimeo_id` in der
MongoDB-Collection `learning_videos` gesetzt ist, blendet der "Verfügbar in Kürze"-State
sich automatisch aus und der Player startet.

---

## Schritt 1 — Vimeo-Upload (für Wlad)

1. Account: https://vimeo.com (Pro-Plan oder höher, sonst kein Embed möglich)
2. **Upload** → Drag-and-drop oder Datei wählen
3. Während des Uploads in den **"Settings"** des Videos:
   - **Privacy** → "Hide from Vimeo" + "Where can this be embedded?" → **"Specific Domains"**
   - Domain hinzufügen: `leader-os.de`, `leader-check.de`, `*.preview.emergentagent.com`
   - **Disable** Download (optional, schützt vor unautorisierten Downloads)
4. Nach Upload-Abschluss: **URL kopieren**, z.B. `https://vimeo.com/987654321`
5. Die **Numeric ID** ist `987654321` — das ist der Wert, der ins Admin Panel kommt

---

## Schritt 2 — Vimeo-ID in der App eintragen

### Option A: Admin Panel (empfohlen)

1. Login als Admin (`test@test.com` / `test123` im Preview, echter Admin in Production)
2. URL: `/wlad-control-x7k9q2` (versteckter Admin-Pfad)
3. Tab **"Learning Videos"** → Video `v1` (oder welches auch immer) auswählen
4. Feld **`vimeo_id`** → `987654321` eintragen → **Save**
5. Reload der `/my-path` Seite (Tab "Lernvideos") — der Player erscheint

### Option B: Direkt in MongoDB (für Notfälle)

```bash
# Im Backend-Pod
mongo $MONGO_URL/$DB_NAME --eval '
  db.learning_videos.updateOne(
    { id: "v1" },
    { $set: { id: "v1", vimeo_id: "987654321", updated_at: new Date() } },
    { upsert: true }
  )
'
```

### Option C: API direkt (für Automatisierung / Bulk-Upload)

```bash
TOKEN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"..."}' \
  | jq -r .token)

curl -X PATCH $API_URL/api/admin/learning_videos/v1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vimeo_id":"987654321"}'
```

---

## Was die App technisch macht

1. **Backend** (`/api/my-path/videos`) merged den statischen Katalog (`LEARNING_VIDEOS`
   in `my_path.py`) mit den Override-Daten aus der MongoDB-Collection `learning_videos`
2. Jedes Video hat ein Feld `has_video: bool` — wird `true`, sobald `vimeo_id`,
   `vimeo_url` oder `video_url` gesetzt ist
3. **Frontend** (`LearningVideosTab.js`) zeigt:
   - Wenn `has_video === false`: "Verfügbar in Kürze" + Wlad-Avatar
   - Wenn `has_video === true` UND `unlocked === true`: Play-Button
   - Wenn `has_video === true` UND `unlocked === false`: Lock-Overlay + Upgrade-CTA
4. **VideoPlayer** (`/components/shared/VideoPlayer.js`) erkennt Source-Typ automatisch:
   - Numeric ID → Vimeo embed (`https://player.vimeo.com/video/{id}?dnt=1...`)
   - YouTube URL → YouTube embed (`youtube-nocookie.com`)
   - MP4 / WebM URL → HTML5 `<video>` tag

---

## Tier-System (FYI)

| Tier | Wer? | Zugriff auf |
|---|---|---|
| `free` | Anonyme + registrierte User ohne Kauf | **v1-v6** (gratis Lead-Magnet) |
| `starter` | Nicht aktiv (Legacy, ungenutzt) | — |
| `standard` (= Leadership OS €997/Jahr) | Voll registriert + bezahlt | v1-v6 + spätere Standard-Inhalte |
| `accelerator` (= Leadership OS PLUS €4.797/Jahr) | Top-Tier | **Alle Videos inkl. v7-v10** |

**Wichtig:** Die ersten 6 Videos (`v1`-`v6`) sind ab Iter 92.3 auf `min_tier: "free"` —
auch nicht-eingeloggte User können sie theoretisch sehen, sobald Wlad sie hochlädt.
Das ist der absichtliche Lead-Magnet-Funnel für die Cohort.

---

## Pre-Launch Checklist (für Mert)

- [ ] Vimeo-Account upgraden auf Pro/Business (für Domain-Restricted Embed)
- [ ] Domains in Vimeo-Settings whitelisten: `leader-os.de`, `leader-check.de`
- [ ] Die 6 ersten Videos hochladen (Free-Bundle)
- [ ] Vimeo-IDs ins Admin Panel eintragen (oder via API-Bulk-Update)
- [ ] Im Live-Test: `/my-path` → Tab "Lernvideos" → erste 6 Karten müssen "Gratis"-Badge zeigen + abspielbar sein
- [ ] Für die 4 Accelerator-Masterclasses später dasselbe — diese bleiben hinter Paywall

---

## Bekannte Gotchas

| Problem | Ursache | Fix |
|---|---|---|
| Video lädt nicht, schwarzer Frame | Vimeo Free-Plan (kein Embed-Privacy) | Auf Vimeo Pro/Business upgraden |
| "Sorry, due to privacy settings" | Domain nicht whitelisted | Domain in Vimeo-Settings hinzufügen |
| Video lädt aber kein Sound | Browser autoplay-policy (autoplay erfordert muted) | Autoplay nur mit muted=1 (bereits im VideoPlayer berücksichtigt) |
| In-app player startet nicht | `vimeo_id` als String mit Anführungszeichen statt nackt | Im Admin Panel: nur die Ziffern eintragen, ohne Anführungszeichen oder URL-Prefix |

---

## Code-Referenzen

| Was | Datei |
|---|---|
| Statischer Video-Katalog | `/app/backend/routes/my_path.py` (LEARNING_VIDEOS) |
| Vimeo-Override Endpoint | `/app/backend/routes/admin.py` (admin_update_learning_video) |
| Frontend Video-Tab | `/app/frontend/src/components/mypath/LearningVideosTab.js` |
| Universal Video Player | `/app/frontend/src/components/shared/VideoPlayer.js` |

---

Stand: Feb 2026 · Iter 92.3
