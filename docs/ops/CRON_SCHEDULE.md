# Cron Schedule — LeaderOS

> All schedules live in the repo: `.github/workflows/cron.yml` (daily/monthly)
> and `.github/workflows/webinar-cron.yml` (October webinar, fixed dates).
> They call `POST {BACKEND_URL}/api/cron/<job>` with header `X-Cron-Secret`
> (`CRON_SHARED_SECRET`, GitHub secret + Railway env). `BACKEND_URL` defaults to
> `https://leaderos.de`, which follows DNS (Emergent today, Railway after cutover).
> Every endpoint is idempotent, so a second caller never double-sends.
>
> **Pause:** repo variable `CRON_PAUSED=true` skips all scheduled runs
> (manual runs still work). **Run one by hand:** Actions → cron-jobs → Run workflow.
>
> cron-job.org (Emergent era) is being retired. Its job list was never in the
> repo; compare it against the table below before cancelling it.

---

## Endpoints

| Endpoint | Schedule | Was |
|---|---|---|
| `installments-due` | daily 07:00 UTC | Fällige Ratenzahlungen |
| `free-video-drip` | daily 07:00 UTC | 4 Gratis-Videos (Tag 1–4) an neue Signups |
| `lead-nurture` | daily 07:00 UTC | Lead-Nurture-Serie |
| `license-nurture` | daily 07:00 UTC | 5-Mail-Serie an `/frameworks`-Leads (s. u.) |
| `trial-reminders` | daily 07:00 UTC | Trial-Ablauf-Reminder 3 Tage vor Ende |
| `video-drip` | daily 07:00 UTC | Lernvideo-Drip Woche 1–6 nach Signup-Alter |
| `monthly-scorecard` | 1st of month 07:00 UTC | Monats-Scorecard |
| `challenge-daily` | in-app (`challenge_mail_loop`, 07:00 Berlin) | Tages-Mail 30-Tage-Programm |
| `drip-sequence` | — (no-op since Iter 186) | in `challenge-daily` aufgegangen |
| `webinar-reminders` / `webinar-followup` | `webinar-cron.yml`, fixed dates | Webinar 29.10. |
| `day-10-consultation` | **manual only** (not verified) | Beratungs-Reminder ~Tag 10. Bookings are no longer tracked (Google booking pages), so it reaches people who already booked — once each. |
| `course-launch` | **manual only** (not verified) | Kurs-Start-Erinnerung 7 + 1 Tag vorher |
| `masterclass-conversion` | **manual only** (not verified) | Freigegebene Conversion-Sequenz |
| `masterclass-expiry` | **manual only** (not verified) | 7-Tage-Reminder + **Downgrade** abgelaufener Masterclass-Kunden |
| `event-reminders` | **manual only** (not verified) | 24h/1h-Event-Reminder; braucht 15-min-Takt (±15 min Fenster) — GitHub-Schedules können Stunden zu spät sein |

"Manual only" = in the workflow's job list, not scheduled. Before scheduling one,
check whether cron-job.org ran it: if it never ran, the first run sends the
whole backlog (or downgrades every expired masterclass client at once).

---

## License-Activation Workflow (/frameworks)

```
Lead füllt /frameworks-Formular aus (Tag 0)
        │
        ├─ Sofort: Mail 1 (routes/license_activation.py, beim Submit)
        │  + optional echte Webinar-Anmeldung (db.webinar_leads)
        ▼
Tag 1:   Mail 2 — SEXIER-Modell
Tag 3:   Mail 3 — Feedbackformel
Tag 5:   Mail 4 — 10 Stufen des Zuhörens
Tag 7:   Mail 5 — letzte Erinnerung
        │
        ▼
Sequenz endet automatisch, sobald die E-Mail in db.users auftaucht
(echter Account) — dann wird der Lead `converted: true` markiert und
für immer aus dem Cron-Query ausgeschlossen (backend/routes/lifecycle_emails.py).
```

**Idempotenz:** Jeder Lead bekommt jede Stufe exakt einmal (`license_steps_sent`
Array + `db.email_log`). Der Cron holt beim ersten Lauf nach einer Pause nur
**eine** fällige Stufe pro Lead nach (kein Mail-Burst bei Backlog).

**Unsubscribe:** `GET /api/license/unsubscribe?token=...` (HMAC-Token, 365
Tage gültig, gleicher Mechanismus wie die anderen Lead-Funnels).

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
curl https://leaderos.de/api/lifecycle/status

# Manuelle Trigger (testweise, mit Secret-Header)
curl -X POST https://leaderos.de/api/cron/video-drip \
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
