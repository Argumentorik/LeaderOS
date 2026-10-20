"""My Path — AI Journey 5 Levels Progressionssystem."""
from fastapi import APIRouter, Request
from config import db
from services import get_current_user, LEVEL_THRESHOLDS
from services_tier import resolve_user_tier

router = APIRouter(prefix="/api", tags=["my-path"])


# ── Lernvideos-Katalog ───────────────────────────────────────────────────────
# First 6 videos: FREE for everyone (lead-magnet — pre-launch wlad cohort
# strategy: give value upfront, convert to Leadership OS / PLUS later).
# Remaining 4: Accelerator-exclusive Masterclasses.
LEARNING_VIDEOS = [
    # Onboarding-Kurs — Plattform-Tutorial für neue User (Tester-Wunsch Iter 114)
    {"id": "v0", "title": "Leader-OS Onboarding: Erste Schritte", "duration": "18 Min", "module": "Onboarding",
     "description": "So holst du alles raus: KI-Coach richtig fragen, Video-Missionen, Daily Check-in, Leader-Diagnose & dein 30-Tage-Loop.",
     "min_tier": "free", "episodes": 7, "thumbnail_color": "#BFFF00", "level": "Start"},
    # Free leadership starter pack (lead-magnet — 6 episodes, no tier required)
    {"id": "v1", "title": "Rhetorik-Grundlagen", "duration": "42 Min", "module": "Kommunikation",
     "description": "Die 3 Säulen wirkungsvoller Führungssprache. Körpersprache, Stimme & Wortwahl.",
     "min_tier": "free", "episodes": 6, "thumbnail_color": "#6366F1", "level": "Einstieg"},
    {"id": "v2", "title": "Schwierige Gespräche meistern", "duration": "38 Min", "module": "Kommunikation",
     "description": "Konflikt, Kritik & Kündigung — ohne Drama. SBI-Methode in Action.",
     "min_tier": "free", "episodes": 5, "thumbnail_color": "#8B5CF6", "level": "Einstieg"},
    {"id": "v3", "title": "Delegation wie ein Profi", "duration": "29 Min", "module": "Führung",
     "description": "Aufgaben richtig abgeben, Vertrauen aufbauen, Mikromanagement vermeiden.",
     "min_tier": "free", "episodes": 4, "thumbnail_color": "#EC4899", "level": "Einstieg"},
    {"id": "v4", "title": "Feedback-Formate (SBI & WWW)", "duration": "35 Min", "module": "Coaching",
     "description": "Strukturiertes Feedback geben — wöchentlich, faktenbasiert, wirksam.",
     "min_tier": "free", "episodes": 5, "thumbnail_color": "#F59E0B", "level": "Einstieg"},
    {"id": "v5", "title": "Storytelling im Boardroom", "duration": "47 Min", "module": "Kommunikation",
     "description": "Wie du komplexe Ideen in 2 Minuten verkaufst. Hollywood-Dramaturgie für Leader.",
     "min_tier": "free", "episodes": 7, "thumbnail_color": "#10B981", "level": "Fortgeschritten"},
    {"id": "v6", "title": "Meeting-Rhetorik", "duration": "33 Min", "module": "Führung",
     "description": "Wer zuerst spricht, gewinnt. Agenda-Hacking & die 20-Sekunden-Regel.",
     "min_tier": "free", "episodes": 4, "thumbnail_color": "#14B8A6", "level": "Einstieg"},

    # Accelerator-exklusive Masterclasses
    {"id": "v7", "title": "KI-First Leadership", "duration": "2h 15 Min", "module": "AI-Strategie",
     "description": "Wie Top-Unternehmen GPT-5.2 & Claude in Entscheidungsprozesse integrieren.",
     "min_tier": "accelerator", "episodes": 12, "thumbnail_color": "#BFFF00", "level": "Master", "exclusive": True},
    {"id": "v8", "title": "Change Management Master", "duration": "1h 48 Min", "module": "Strategie",
     "description": "Transformation ohne Widerstand. Kotter's 8-Step-Modell — KI-aktualisiert.",
     "min_tier": "accelerator", "episodes": 10, "thumbnail_color": "#BFFF00", "level": "Master", "exclusive": True},
    {"id": "v9", "title": "Executive Presence", "duration": "1h 22 Min", "module": "Führung",
     "description": "Wie du Raum einnimmst, bevor du sprichst. Gravitas-Training nach Wlad.",
     "min_tier": "accelerator", "episodes": 8, "thumbnail_color": "#BFFF00", "level": "Master", "exclusive": True},
    {"id": "v10", "title": "Boardroom-Strategie", "duration": "2h 05 Min", "module": "Strategie",
     "description": "C-Level Entscheidungen vorbereiten, präsentieren & durchsetzen.",
     "min_tier": "accelerator", "episodes": 11, "thumbnail_color": "#BFFF00", "level": "Master", "exclusive": True},
]
TIER_RANK = {"free": 0, "starter": 1, "standard": 2, "accelerator": 3}

# ── Iter 121 (Wlad / Go-Live Lockdown) ────────────────────────────────────
# Prelaunch: ALLE Lernvideos werden gesperrt bis wir die finalen Vimeo-Uploads
# haben. Weder Free noch Accelerator sollen die Videos schon abspielen können —
# stattdessen zeigt die UI den "🔓 Upgrade auf Premium – Vollzugriff freischalten"
# CTA. Über die Environment-Variable `PRELAUNCH_VIDEO_LOCK=0` kann der Lock
# nach dem Launch zentral wieder deaktiviert werden.
import os as _os_prelaunch
PRELAUNCH_VIDEO_LOCK = _os_prelaunch.environ.get("PRELAUNCH_VIDEO_LOCK", "1") == "1"

LEVEL_META = {
    "Teamplayer": {
        "subtitle": "Du lernst im Team zu führen und Verantwortung zu übernehmen.",
        "description": "Der Teamplayer versteht Gruppendynamiken, baut Vertrauen auf und übernimmt erste Führungsverantwortung. Du lernst die Grundlagen der KI-gestützten Zusammenarbeit.",
        "color": "#6366F1",
        "skills": ["Teamdynamik", "Vertrauen aufbauen", "KI-Grundlagen", "Selbstreflexion"],
        "unlock": "Starte deine Journey — 0 XP",
        "certificate": "Zertifikat: Teamführung & Zusammenarbeit",
    },
    "Mentor": {
        "subtitle": "Du förderst Mitarbeiter und entwickelst ihre Fähigkeiten weiter.",
        "description": "Der Mentor identifiziert Stärken und Schwächen, gibt strukturiertes Feedback und hilft anderen, über sich hinauszuwachsen. KI wird dein Coaching-Verstärker.",
        "color": "#8B5CF6",
        "skills": ["Feedback (SBI)", "Mitarbeiterentwicklung", "KI-Coach Nutzung", "Aktives Zuhören"],
        "unlock": "200 XP + 5 Challenge-Tage",
        "certificate": "Zertifikat: Coaching & Mitarbeiterentwicklung",
    },
    "Kommunikator": {
        "subtitle": "Du kommunizierst klar, überzeugend und rhetorisch brillant.",
        "description": "Der Kommunikator vermittelt Botschaften effektiv, präsentiert auf Boardroom-Level und nutzt Storytelling als Führungsinstrument. KI schärft deine Rhetorik.",
        "color": "#EC4899",
        "skills": ["Boardroom-Rhetorik", "Storytelling", "Video-Kommunikation", "Schwierige Gespräche"],
        "unlock": "500 XP + 15 Challenge-Tage",
        "certificate": "Zertifikat: Kommunikation & Rhetorik",
    },
    "Strategischer Denker": {
        "subtitle": "Du planst langfristig und triffst komplexe Entscheidungen.",
        "description": "Der Strategische Denker analysiert Situationen, denkt in Szenarien und trifft Entscheidungen unter Unsicherheit. KI wird dein strategischer Sparringspartner.",
        "color": "#F59E0B",
        "skills": ["AI-Strategie", "Change Management", "Szenario-Planung", "OKRs"],
        "unlock": "1.000 XP + 25 Challenge-Tage",
        "certificate": "Zertifikat: Strategie & Entscheidung",
    },
    "Visionär": {
        "subtitle": "Du entwickelst eine klare Zukunftsperspektive und inspirierst dein Team.",
        "description": "Der Visionär setzt ambitionierte Ziele, inspiriert Teams diese zu erreichen und gestaltet die Zukunft aktiv. Du führst AI-First und hinterlässt ein Vermächtnis.",
        "color": "#BFFF00",
        "skills": ["AI-First Leadership", "Visionäre Zielsetzung", "Disruptive Innovation", "Legacy Building"],
        "unlock": "2.000 XP + 30 Challenge-Tage + 5 Video-Missionen",
        "certificate": "Zertifikat: Visionäre Führung",
    },
}


def _build_level_data(thresholds: list, meta: dict, current_level: str, xp: int) -> list:
    """Build the levels array with unlock/progress state."""
    current_idx = next((t["index"] for t in thresholds if t["level"] == current_level), 0)
    levels = []
    for t in thresholds:
        m = meta[t["level"]]
        is_current = t["level"] == current_level
        is_unlocked = t["index"] <= current_idx

        if is_current and t["index"] < 4:
            next_t = thresholds[t["index"] + 1]
            xp_progress = min(100, round(((xp - t["min_xp"]) / max(1, next_t["min_xp"] - t["min_xp"])) * 100))
        elif t["index"] == 4 and is_current:
            xp_progress = 100
        else:
            xp_progress = 100 if is_unlocked else 0

        levels.append({
            "level": t["level"], "index": t["index"], "subtitle": m["subtitle"],
            "description": m["description"], "color": m["color"], "skills": m["skills"],
            "unlock_requirement": m["unlock"], "certificate": m["certificate"],
            "min_xp": t["min_xp"], "is_current": is_current, "is_unlocked": is_unlocked,
            "is_next": t["index"] == current_idx + 1, "xp_progress": xp_progress,
        })
    return levels, current_idx


def _build_certificates(thresholds: list, meta: dict, current_level: str, current_idx: int) -> list:
    """Build certificates list with earned/pending status."""
    certs = [
        {"level": t["level"], "title": meta[t["level"]]["certificate"], "earned": True}
        for t in thresholds if t["index"] < current_idx
    ]
    certs.append({"level": current_level, "title": meta.get(current_level, {}).get("certificate", ""), "earned": False})
    return certs


@router.get("/my-path")
async def get_my_path(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]

    xp = user.get("xp", 0)
    current_level = user.get("level", "Teamplayer")

    progress = await db.challenge30_progress.find_one({"user_id": uid}, {"_id": 0})
    completed_days = len(progress.get("completed_days", [])) if progress else 0
    video_count = await db.video_challenges.count_documents({"user_id": uid})
    chat_count = await db.chat_sessions.count_documents({"user_id": uid})

    levels, current_idx = _build_level_data(LEVEL_THRESHOLDS, LEVEL_META, current_level, xp)
    certificates = _build_certificates(LEVEL_THRESHOLDS, LEVEL_META, current_level, current_idx)

    return {
        "current_level": current_level, "current_index": current_idx, "xp": xp,
        "challenge_days": completed_days, "video_missions": video_count, "chat_sessions": chat_count,
        "levels": levels, "certificates": certificates,
        "scores": {
            "leadership": user.get("leadership_score", 0),
            "eq": user.get("eq_score", 0),
            "communication": user.get("communication_score", 0),
        },
    }



@router.get("/my-path/videos")
async def get_learning_videos(request: Request):
    """Return the learning videos catalog with per-tier unlock info.

    Merges the static catalog with any per-video metadata stored in the
    `learning_videos` MongoDB collection — that's where Mert drops vimeo_id /
    vimeo_url once a recording is ready. Until a row exists, the frontend
    falls back to a "chat about this lesson" deep link.
    """
    user = await get_current_user(request)
    tier_info = await resolve_user_tier(user)
    user_tier = tier_info["tier"]
    user_rank = TIER_RANK.get(user_tier, 0)

    # Pull video metadata overrides from Mongo (only fields we care about merging)
    overrides_cursor = db.learning_videos.find(
        {}, {"_id": 0, "id": 1, "vimeo_id": 1, "vimeo_url": 1, "video_url": 1,
             "release_date": 1, "transcript_url": 1, "thumbnail_url": 1},
    )
    overrides = {row["id"]: row async for row in overrides_cursor if row.get("id")}

    videos = []
    for v in LEARNING_VIDEOS:
        required_rank = TIER_RANK.get(v["min_tier"], 1)
        unlocked = user_rank >= required_rank
        # Iter 121: Global pre-launch lockdown — ALL videos show as locked
        # regardless of tier. Cleared centrally when PRELAUNCH_VIDEO_LOCK=0.
        if PRELAUNCH_VIDEO_LOCK:
            unlocked = False
        merged = {**v, "unlocked": unlocked, "locked_reason": "prelaunch" if PRELAUNCH_VIDEO_LOCK else None}
        ov = overrides.get(v["id"])
        if ov:
            for field in ("vimeo_id", "vimeo_url", "video_url", "release_date",
                          "transcript_url", "thumbnail_url"):
                if ov.get(field):
                    merged[field] = ov[field]
        merged["has_video"] = bool(merged.get("vimeo_id") or merged.get("vimeo_url") or merged.get("video_url"))
        videos.append(merged)

    free_videos = [v for v in videos if v["min_tier"] == "free"]
    accelerator_videos = [v for v in videos if v["min_tier"] == "accelerator"]
    ready_count = sum(1 for v in videos if v["has_video"])

    return {
        "user_tier": user_tier,
        "user_tier_name": tier_info["tier_name"],
        # `starter_videos` kept for backward-compat with the frontend; it now
        # serves the FREE pack (first 6 episodes — Wlad cohort lead-magnet).
        "starter_videos": free_videos,
        "free_videos": free_videos,
        "accelerator_videos": accelerator_videos,
        "total_episodes": sum(item["episodes"] for item in videos),
        "unlocked_count": sum(1 for item in videos if item["unlocked"]),
        "total_count": len(videos),
        "ready_count": ready_count,  # how many have a real Vimeo link
        "prelaunch_lock": PRELAUNCH_VIDEO_LOCK,
    }
