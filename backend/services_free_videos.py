"""Free-Video Funnel "Führung beginnt hier" — backend config (godmode).

Single source of truth for the daily drip emails of the free 4-video series.
Frontend mirror: frontend/src/data/freeVideos.js — KEEP TITLES/SOURCES IN SYNC
(the public page /fuehrung-beginnt-hier and the in-app player render from the
frontend copy; the emails render from THIS copy).

The funnel:

    /fuehrung-beginnt-hier (opt-in, no account)  →  all 4 videos unlock inline
      + instant Video-1 email (routes/free_videos.py)
      + Day 2-4 daily drip   (routes/lifecycle_emails.py cron)
    Registered users additionally get the series at /free-videos in the app.

Each slot resolves a source in priority order:

  1. youtube_id — preferred once the clips are on YouTube.
  2. vimeo_id   — Vimeo HD (same family as the weekly Lernvideo library).
  3. drive_id   — Google-Drive preview embed. Works today WITHOUT re-hosting,
                  but the Drive file must be shared "Anyone with the link".

A slot with NO source is treated as "coming soon": shown locked on the pages
and SKIPPED by the email drip (we never email a broken "watch this" link).
"""

# Ordered Day 1 → Day 4. `day` drives the email drip cadence (one per day).
FREE_VIDEOS = [
    {
        "id": "fv1",
        "day": 1,
        "title": "Warum die meisten Führungskräfte unsichtbar bleiben",
        "subtitle": "Der Denkfehler, der dich Beförderung, Gehalt und Respekt kostet",
        "duration": "8 Min",
        # Google-Drive: "YouTube Video 01 KI CTA.mp4"
        "drive_id": "16MqmrIEOG4xrqm_j8VyJq3gJH168Wyg4",
        "youtube_id": "",
        "vimeo_id": "",
        "hook": (
            "Fangen wir mit dem an, was fast niemand ausspricht: Fachlich stark zu "
            "sein reicht nicht. Es gibt einen Denkfehler, der dich Beförderung, "
            "Gehalt und Respekt kostet — und du kannst ihn heute abstellen."
        ),
        "takeaway": (
            "Du erkennst den einen Denkfehler, der dich unsichtbar macht — und "
            "weißt, womit du ihn ab heute ersetzt."
        ),
    },
    {
        "id": "fv2",
        "day": 2,
        "title": "Natürliche Autorität — ohne lauter zu werden",
        "subtitle": "Die 3 Signale, an denen dein Team entscheidet, ob es dir folgt",
        "duration": "11 Min",
        # Google-Drive: "Youtube Video 04 KI CTA.mp4"
        "drive_id": "1-KJxED0b74Zgph3Q9hnOIAhnuxNQcK5o",
        "youtube_id": "",
        "vimeo_id": "",
        "hook": (
            "Tag 2. Dein Team entscheidet in Sekunden, ob es dir folgt — an drei "
            "Signalen, die du komplett steuern kannst. Heute lernst du sie kennen. "
            "Ohne Druck, ohne Manipulation, ohne lauter zu werden."
        ),
        "takeaway": (
            "Du kennst die 3 Autoritäts-Signale und weißt, wie du sie ab dem "
            "nächsten Meeting bewusst setzt."
        ),
    },
    {
        "id": "fv3",
        "day": 3,
        "title": "Weniger arbeiten, mehr bewirken",
        "subtitle": "Schluss mit Mikromanagement — dein Team übernimmt Verantwortung",
        "duration": "9 Min",
        # Google-Drive: "YouTube Video 05.mp4"
        "drive_id": "1hIMfxWbZVZbtmWyN1YWf3nVMkQfKsxfQ",
        "youtube_id": "",
        "vimeo_id": "",
        "hook": (
            "Tag 3. Wenn du nach Feierabend noch die Arbeit deines Teams "
            "kontrollierst, hast du kein Zeit-Problem — du hast ein "
            "Delegations-Problem. Heute drehen wir das um: dein Team übernimmt "
            "von allein Verantwortung."
        ),
        "takeaway": (
            "Du bekommst den Hebel, mit dem dein Team von allein Verantwortung "
            "übernimmt — und du abends wirklich abschalten kannst."
        ),
    },
    {
        "id": "fv4",
        "day": 4,
        "title": "Dein 30-Tage-Plan zur KI-nativen Führungskraft",
        "subtitle": "Wlads Methodik in deinem Alltag — in 10 Minuten pro Tag",
        "duration": "12 Min",
        # 4th clip — add the source (youtube_id / vimeo_id / drive_id) here.
        # Until then this slot shows "in Kürze" on the pages and is skipped by
        # the email drip, so the funnel never links to a broken video.
        "drive_id": "",
        "youtube_id": "",
        "vimeo_id": "",
        "hook": (
            "Tag 4 — das Finale. Du hast den Denkfehler abgestellt, die "
            "Autoritäts-Signale gesetzt und delegierst wie ein Profi. Jetzt "
            "bekommst du den genauen 30-Tage-Fahrplan, mit dem du Wlads Methodik "
            "dauerhaft in deinen Alltag bringst — in 10 Minuten pro Tag."
        ),
        "takeaway": (
            "Du hast deinen konkreten 30-Tage-Plan — und weißt genau, wie es "
            "mit LeaderOS weitergeht, wenn du mehr willst."
        ),
    },
]

# Map for O(1) lookups.
FREE_VIDEOS_BY_ID = {v["id"]: v for v in FREE_VIDEOS}

# Public squeeze page — where email-only leads are deep-linked (no login wall).
# ?unlock=1 restores their unlocked state (see FreeVideosPage useEffect).
PUBLIC_FUNNEL_URL = "https://leader-os.de/fuehrung-beginnt-hier?unlock=1"


def video_source(video: dict) -> tuple[str, str] | tuple[None, None]:
    """Resolve the (kind, id) of the first available source for a video.

    kind ∈ {"youtube", "vimeo", "drive"}. Returns (None, None) if the slot
    has no source yet ("coming soon").
    """
    if video.get("youtube_id"):
        return "youtube", video["youtube_id"]
    if video.get("vimeo_id"):
        return "vimeo", video["vimeo_id"]
    if video.get("drive_id"):
        return "drive", video["drive_id"]
    return None, None


def is_ready(video: dict) -> bool:
    """True if the video has any playable source."""
    kind, _ = video_source(video)
    return kind is not None


def embed_url(video: dict) -> str | None:
    """Public embed/preview URL for the video, or None if not ready."""
    kind, ref = video_source(video)
    if kind == "youtube":
        return f"https://www.youtube.com/embed/{ref}"
    if kind == "vimeo":
        return f"https://player.vimeo.com/video/{ref}"
    if kind == "drive":
        return f"https://drive.google.com/file/d/{ref}/preview"
    return None


def ready_videos() -> list[dict]:
    """The subset of FREE_VIDEOS that currently have a playable source."""
    return [v for v in FREE_VIDEOS if is_ready(v)]
