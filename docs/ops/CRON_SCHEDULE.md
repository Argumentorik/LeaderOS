# Cron Schedule — leader-os.de

> Externe Scheduler (cron-job.org / GitHub Actions / Vercel Cron) müssen diese
> Endpoints periodisch aufrufen. Alle sind über `X-Cron-Secret` Header
> abgesichert (Env-Var `CRON_SHARED_SECRET`).

---

## Endpoints + Empfohlener Schedule

| Endpoint | Schedule (UTC) | Was | Why |
|---|---|---|---|
| `POST /api/cron/trial-reminders` | `0 9 * * *` (täglich 09:00) | Sendet Trial-Ablauf-Reminder 3 Tage vor Ende | Free-Trial Reaktivierung |
| `POST /api/cron/drip-sequence` | `0 10 * * *` (täglich 10:00) | Day 1 / 3 / 7 Drip-Emails an neue User | Onboarding-Aktivierung |
| `POST /api/cron/video-drip` | `0 11 * * 1` (montags 11:00) | Wöchentliche Video-Drip (Woche 1-6) | Lead-Magnet Lernvideo-Serie |
| `POST /api/cron/webinar-reminders` | `*/15 * * * *` (alle 15 min, mindestens 27.–29.10.) | 24h-Reminder (12–24,5 h vorher) + 1h-Reminder (0–2 h vorher) an alle Webinar-Leads, je Lead einmal | Show-up-Rate Webinar 29.10. |
| `POST /api/cron/webinar-followup` | `0 8 * * *` (täglich) | „Starte deinen Trial"-Mail ab 20 h nach dem Webinar, je Lead einmal | Webinar → Trial |

> **Webinar-Crons:** GitHub-Action `webinar-cron.yml` ruft beide nur in den
> Fenstern um den Termin auf — **als Backup**. Geplante GitHub-Läufe starten
> hier bis zu 5 h verspätet (siehe `cron-jobs`, 07:00 → ~12:30 UTC). Primär
> deshalb bei cron-job.org einen 15-min-Job für `webinar-reminders` anlegen
> (Setup unten). Doppelte Aufrufe sind unkritisch.

---

## Cron-Job.org Setup (empfohlen)

1. https://cron-job.org/en/ → Account anlegen
2. **Create cronjob** für jedes Endpoint:
   - **URL:** `https://leader-os.de/api/cron/video-drip`
   - **Schedule:** `Every Monday at 11:00 UTC`
   - **Headers:** `X-Cron-Secret: <CRON_SHARED_SECRET aus Emergent .env>`
   - **Notifications:** Email on failure
3. Status testen: erstes Trigger sollte JSON `{"sent": 0, ...}` zurückgeben

---

## Video-Drip Workflow (Iter 92.4)

```
User registriert (Tag 0)
        │
        ▼
Tag 7:   Woche 1 — Rhetorik-Grundlagen      ← nur wenn v1 vimeo_id gesetzt
Tag 14:  Woche 2 — Schwierige Gespräche     ← nur wenn v2 vimeo_id gesetzt
Tag 21:  Woche 3 — Delegation
Tag 28:  Woche 4 — Feedback-Formate
Tag 35:  Woche 5 — Storytelling
Tag 42:  Woche 6 — Meeting-Rhetorik
        │
        ▼
Lead-Magnet komplett ausgespielt
```

**Wichtig:** Die Cron-Endpoint skipped automatisch jeden User, dessen
entsprechendes Video keine Vimeo-ID hat. Das heißt: sobald Wlad die ersten
Folge hochlädt + im Admin-Panel die `vimeo_id` einträgt, beginnt der nächste
Cron-Lauf automatisch mit dem Aussenden.

**Idempotenz:** Jeder User bekommt Woche-N exakt einmal (gates über
`email_log` Collection mit `user_id + type=video_drip_wN`).

---

## Unsubscribe

User können sich via `db.users.unsubscribed_video_drip: true` aus der
Sequence ausklinken. Frontend: `/profile` → Email-Settings (TODO future).

---

## Monitoring

```bash
# Health-Check
curl https://leader-os.de/api/lifecycle/status

# Manuelle Trigger (testweise, mit Secret-Header)
curl -X POST https://leader-os.de/api/cron/video-drip \
  -H "X-Cron-Secret: <SECRET>"
```

Bei Erfolg JSON wie:
```json
{
  "sent": 12,
  "scanned": 87,
  "by_week": {"video_drip_w1": 8, "video_drip_w2": 4},
  "skipped_no_video": 15,
  "ready_video_ids": ["v1", "v2"]
}
```

Stand: Feb 2026 · Iter 92.4
