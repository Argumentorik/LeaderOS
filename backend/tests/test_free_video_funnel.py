"""Unit tests for the 4-free-video funnel (config + email template).

Pure-function coverage — no DB / network needed. Verifies:
  - the config has 4 ordered daily slots,
  - source resolution + embed URLs pick youtube > vimeo > drive,
  - "coming soon" slots (no source) are correctly flagged and skipped,
  - the daily drip email renders with the right day/subject/deeplink.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import services_free_videos as fv
from services_email import free_video_drip_email


def test_config_is_four_ordered_daily_slots():
    assert len(fv.FREE_VIDEOS) == 4
    assert [v["day"] for v in fv.FREE_VIDEOS] == [1, 2, 3, 4]
    # ids are unique and indexed
    ids = [v["id"] for v in fv.FREE_VIDEOS]
    assert len(set(ids)) == 4
    assert set(fv.FREE_VIDEOS_BY_ID) == set(ids)


def test_source_priority_youtube_over_vimeo_over_drive():
    both = {"youtube_id": "yt", "vimeo_id": "vm", "drive_id": "dr"}
    assert fv.video_source(both) == ("youtube", "yt")
    assert fv.embed_url(both) == "https://www.youtube.com/embed/yt"

    vimeo = {"youtube_id": "", "vimeo_id": "vm", "drive_id": "dr"}
    assert fv.video_source(vimeo) == ("vimeo", "vm")
    assert fv.embed_url(vimeo) == "https://player.vimeo.com/video/vm"

    drive = {"youtube_id": "", "vimeo_id": "", "drive_id": "dr"}
    assert fv.video_source(drive) == ("drive", "dr")
    assert fv.embed_url(drive) == "https://drive.google.com/file/d/dr/preview"


def test_coming_soon_slot_is_not_ready():
    empty = {"youtube_id": "", "vimeo_id": "", "drive_id": ""}
    assert fv.video_source(empty) == (None, None)
    assert fv.is_ready(empty) is False
    assert fv.embed_url(empty) is None


def test_first_three_ready_from_drive_fourth_pending():
    # Videos 1-3 ship with Drive IDs; the 4th slot is intentionally empty
    # until its CTA clip source is added.
    ready = fv.ready_videos()
    assert [v["id"] for v in ready] == ["fv1", "fv2", "fv3"]
    assert fv.is_ready(fv.FREE_VIDEOS_BY_ID["fv4"]) is False


def test_drip_email_renders_day_and_deeplink():
    video = fv.FREE_VIDEOS_BY_ID["fv2"]
    subject, html = free_video_drip_email(
        "Alex", video, total=4,
        unsubscribe_link="https://leaderos.de/api/unsubscribe/x",
    )
    assert isinstance(subject, str) and subject
    # deep-links to the gated page with the specific video selected
    assert "/free-videos?v=fv2" in html
    assert "Tag 2" in html
    assert "Alex" in html
    # unsubscribe link is wired through
    assert "unsubscribe" in html


def test_drip_email_final_day_has_trial_pitch():
    video = fv.FREE_VIDEOS_BY_ID["fv4"]
    _subject, html = free_video_drip_email("Sam", video, total=4)
    assert "14 Tage kostenlos" in html


def test_lead_unsubscribe_token_roundtrip():
    # Imports the route module (needs the backend env, as in CI); skip locally
    # if the DB/env isn't wired.
    try:
        from routes.free_videos import (
            make_lead_unsub_token,
            _verify_lead_unsub_token,
            lead_unsub_url,
        )
    except Exception as exc:  # pragma: no cover - env-dependent
        import pytest
        pytest.skip(f"route env unavailable: {exc}")
        return  # unreachable (skip raises) — makes control flow explicit

    token = make_lead_unsub_token("alex@firma.de")
    assert _verify_lead_unsub_token(token) == "alex@firma.de"
    assert _verify_lead_unsub_token("garbage.token") is None
    assert _verify_lead_unsub_token(token + "tamper") is None
    assert lead_unsub_url("a@b.de").startswith(
        "https://leaderos.de/api/free-videos/unsubscribe?token="
    )
