"""GODMODE-Qualitätscheck (Iter 154): Ist ein Guide-Clip wirklich fertig?

Prüft Script-Rhetorik, Präsenz-Shot-Struktur, Enden, Lipsync-Engine, Thumbnail und Fertigstellung.
Reines Lesen — keine Fal-Aufrufe.
"""
import re

from guide_content import CLIP_SETTING, PRESENCE_SETTINGS, TALK_TAIL_SECONDS, word_count, word_limits
from guide_scripts_godmode import AI_SLOP

_PRESENCE_PRESETS = {p for pair in PRESENCE_SETTINGS.values() for p in pair}
_CTA = ("fang", "starte", "probier", "nimm dir", "füll", "schreib", "lass uns", "los geht", "leg los", "wir an",
        "jetzt", "heute", "morgen", "als nächstes", "dein nächster schritt")


def _sentences(text: str) -> list[str]:
    return [s for s in re.split(r"(?<=[.!?])\s+", " ".join(text.split())) if s]


def godmode_check(clip: dict) -> dict:
    script = clip.get("script") or ""
    kind = clip.get("kind") or ""
    lo, hi = word_limits(kind)
    words = word_count(script)
    sents = _sentences(script)
    lens = [len(s.split()) for s in sents] or [0]
    low = script.lower()
    shots = clip.get("shots") or []
    talks = [s for s in shots if s.get("type") == "talk"]
    checks = [
        ("script_length", lo <= words <= hi, f"{words} Wörter (erlaubt {lo}–{hi})"),
        ("script_no_ai_slop", not any(p in low for p in AI_SLOP),
         "keine Maschinen-Floskeln" if not any(p in low for p in AI_SLOP) else "Floskel: " + ", ".join(p for p in AI_SLOP if p in low)),
        ("script_rhythm", min(lens) <= 9 and max(lens) >= 16 and len(sents) >= 5,
         f"{len(sents)} Sätze, {min(lens)}–{max(lens)} Wörter (kurz & lang gemischt)"),
        ("script_direct", bool(re.search(r"\b(du|dir|dich|dein\w*)\b", low)), "spricht den Nutzer direkt an"),
        ("script_next_step", any(c in " ".join(sents[-2:]).lower() for c in _CTA), "endet mit konkretem Next Step"),
        ("presence_shots", bool(talks) and all(t.get("preset") in _PRESENCE_PRESETS for t in talks),
         "Präsenz-Shots (kein Walk-in)" if talks else "keine Shots geplant"),
        ("lipsync_omnihuman", bool(talks) and all(t.get("engine") == "omnihuman" and t.get("synced_path") for t in talks),
         "OmniHuman-Lipsync auf allen Sprech-Shots"),
        ("soft_ending", bool(talks) and talks[-1].get("audio_seconds", 0) > 0 and "speech_lead" in talks[0],
         f"Auftakt + {TALK_TAIL_SECONDS:.1f} s Ausklang + Abbinder"),
        ("video_complete", clip.get("status") == "video_ready" and clip.get("pipeline") == "multishot" and not clip.get("stale"),
         "Film fertig geschnitten (Abbinder, Branding, Untertitel)"),
        ("thumbnail", any(s.get("keyframe_path") for s in shots) or bool(clip.get("keyframe_path")), "branded Thumbnail vorhanden"),
        ("published", bool(clip.get("published")), "für Nutzer freigeschaltet"),
    ]
    items = [{"id": i, "ok": bool(ok), "label": label} for i, ok, label in checks]
    passed = sum(1 for i in items if i["ok"])
    return {"passed": passed, "total": len(items), "godmode": passed == len(items), "items": items,
            "setting": clip.get("setting") or CLIP_SETTING.get(clip.get("slug") or "", "loft")}
