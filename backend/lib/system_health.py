"""
system_health — zentrale Provider-Diagnostik.

Liefert für jedes Subsystem einen Status:
  - 'go'        : nativer Provider konfiguriert, läuft
  - 'degraded'  : läuft, aber auf Legacy-Pfad (Emergent-Fallback)
  - 'down'      : kein Provider verfügbar, Aufrufe würden 500en

Wird gerendert unter `/api/system/health` und im Frontend unter
`/system`. Gibt nie echte Keys aus — nur ob sie gesetzt sind und
welcher Pfad gewählt wurde.
"""

import os


def _present(name: str) -> bool:
    v = os.environ.get(name) or ""
    return bool(v.strip())


def _llm_status() -> dict:
    if _present("ANTHROPIC_API_KEY"):
        return {"status": "go", "provider": "anthropic",
                "model": "claude-haiku-4-5-20251001",
                "note": "Native Anthropic SDK"}
    if _present("OPENAI_API_KEY"):
        return {"status": "go", "provider": "openai",
                "model": "gpt-4o-mini",
                "note": "Native OpenAI SDK"}
    if _present("EMERGENT_LLM_KEY"):
        return {"status": "degraded", "provider": "emergent",
                "model": "openai/gpt-5.2",
                "note": "Legacy wrapper — set ANTHROPIC_API_KEY to migrate"}
    return {"status": "down", "provider": None,
            "note": "No LLM provider configured"}


def _stt_status() -> dict:
    # STT ist optional — wer kein Voice-Mode braucht, lässt OPENAI_API_KEY
    # einfach leer. `optional: True` heißt: zieht den Overall-Status
    # nicht runter wenn DOWN.
    if _present("OPENAI_API_KEY"):
        return {"status": "go", "provider": "openai",
                "model": "whisper-1",
                "note": "Native OpenAI Whisper"}
    if _present("EMERGENT_LLM_KEY"):
        return {"status": "degraded", "provider": "emergent",
                "optional": True,
                "note": "Legacy wrapper — Voice-Mode works but on emergent"}
    return {"status": "down", "provider": None,
            "optional": True,
            "note": "Voice-Mode disabled — set OPENAI_API_KEY to enable"}


def _tts_status() -> dict:
    # Sprachausgabe (ElevenLabs). Wie STT `optional: True` — wer Voice
    # bewusst aus lässt, soll kein rotes Dashboard bekommen. Es taucht
    # aber sichtbar als DOWN auf, und genau darum geht es: im
    # MA-Test 08/2026 haben vier Tester unabhängig "Sprachausgabe geht
    # nicht" gemeldet, während der Health-Report das Subsystem gar nicht
    # kannte. Ein fehlender Key sah aus wie ein Produktfehler.
    if _present("ELEVENLABS_API_KEY"):
        return {"status": "go", "provider": "elevenlabs",
                "note": "Sprachausgabe aktiv"}
    return {"status": "down", "provider": None,
            "optional": True,
            "note": "ELEVENLABS_API_KEY fehlt — Sprachausgabe und "
                    "'Zitat des Tages' bleiben stumm"}


def _email_status() -> dict:
    # NICHT optional: ohne Resend überspringt services_email still jeden
    # Versand (`is_enabled()`-Gate). Kein Fehler im Log, keine Mail beim
    # Kunden — der komplette Lead-Nurture- und Webinar-Reminder-Funnel
    # läuft ins Leere, ohne dass es jemand merkt.
    if _present("RESEND_API_KEY"):
        return {"status": "go", "provider": "resend",
                "sender": os.environ.get("SENDER_EMAIL", "(SENDER_EMAIL nicht gesetzt)"),
                "note": "Transaktions- und Funnel-Mails aktiv"}
    return {"status": "down", "provider": None,
            "note": "RESEND_API_KEY fehlt — Welcome-Mails, 7-Mail-Journey "
                    "und Webinar-Reminder werden STILL übersprungen"}


def _stripe_status() -> dict:
    key = os.environ.get("STRIPE_API_KEY") or ""
    if not key:
        return {"status": "down", "mode": None,
                "note": "STRIPE_API_KEY not set — checkout will fail"}
    if key.strip() == "sk_test_emergent":
        return {"status": "degraded", "mode": "emergent_sandbox",
                "note": "Using Emergent's shared sandbox token — "
                        "set your own sk_live_… for production charges"}
    if key.startswith("sk_live_"):
        return {"status": "go", "mode": "live",
                "key_prefix": key[:7] + "…",
                "note": "LIVE Stripe charges"}
    if key.startswith("sk_test_"):
        return {"status": "go", "mode": "test",
                "key_prefix": key[:7] + "…",
                "note": "Stripe test mode (own account)"}
    return {"status": "degraded", "mode": "unknown",
            "note": "STRIPE_API_KEY format not recognised"}


def _storage_status() -> dict:
    if _present("SUPABASE_URL") and _present("SUPABASE_SERVICE_KEY"):
        return {"status": "go", "backend": "supabase",
                "bucket": os.environ.get("SUPABASE_STORAGE_BUCKET",
                                         "wladbot-uploads"),
                "note": "Native Supabase Storage"}
    if _present("EMERGENT_LLM_KEY"):
        return {"status": "degraded", "backend": "emergent",
                "note": "Legacy wrapper — set SUPABASE_URL + "
                        "SUPABASE_SERVICE_KEY to migrate"}
    return {"status": "down", "backend": None,
            "note": "No storage backend — uploads will fail"}


def _supabase_db_status() -> dict:
    """Supabase ist auch unsere User-Mirror-DB, separat von Storage."""
    if _present("SUPABASE_URL") and _present("SUPABASE_SERVICE_KEY"):
        return {"status": "go",
                "url": os.environ.get("SUPABASE_URL"),
                "note": "RAG + Auth-Mirror"}
    return {"status": "down",
            "note": "SUPABASE_URL/SERVICE_KEY missing — "
                    "RAG retrieval + Auth-Sync disabled"}


def _sentry_status() -> dict:
    # Sentry ist Ops-Observability — App läuft auch ohne, daher
    # `optional: True`. Pulls den Overall nicht runter wenn DOWN.
    leader_os = _present("REACT_APP_SENTRY_DSN_LEADER_OS") or _present("SENTRY_DSN")
    leader_check = _present("REACT_APP_SENTRY_DSN_LEADER_CHECK")
    if leader_os and leader_check:
        return {"status": "go", "note": "Both Sentry projects configured"}
    if leader_os or leader_check:
        return {"status": "degraded",
                "optional": True,
                "note": "Only one Sentry DSN set — errors from the "
                        "other surface will not be captured"}
    return {"status": "down",
            "optional": True,
            "note": "No Sentry DSN configured"}


def collect() -> dict:
    """Aggregate report. Wird vom /api/system/health Endpoint zurückgegeben."""
    subsystems = {
        "llm":        _llm_status(),
        "stt":        _stt_status(),
        "tts":        _tts_status(),
        "email":      _email_status(),
        "stripe":     _stripe_status(),
        "storage":    _storage_status(),
        "supabase":   _supabase_db_status(),
        "sentry":     _sentry_status(),
    }
    counts = {"go": 0, "degraded": 0, "down": 0}
    # Mandatory-Subset: optional-Subsysteme (z.B. STT wenn Voice-Mode
    # bewusst aus ist) zählen nicht ins Overall — wir wollen nicht das
    # ganze Dashboard rot bei legitimer Konfig.
    mandatory_down = 0
    mandatory_degraded = 0
    for s in subsystems.values():
        counts[s["status"]] = counts.get(s["status"], 0) + 1
        if s.get("optional"):
            continue
        if s["status"] == "down":
            mandatory_down += 1
        elif s["status"] == "degraded":
            mandatory_degraded += 1
    overall = ("go" if mandatory_down == 0 and mandatory_degraded == 0
               else "degraded" if mandatory_down == 0
               else "down")
    return {
        "overall": overall,
        "counts": counts,
        "subsystems": subsystems,
    }
