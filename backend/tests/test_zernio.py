"""Zernio-Client und Karussell-Skript ohne Netz (httpx.MockTransport)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import httpx
import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import services_zernio as z  # noqa: E402
import scripts_post_carousel as cli  # noqa: E402

SERIES = ROOT.parent / "docs" / "gtm" / "linkedin-carousels-01"

SAMPLE_CAPTIONS = """# Serie 01

Intro mit Regeln.

---

## C01 · Wissen wird gelehrt.

Zeile eins.
Zeile zwei.

Frage?

#Tag1 #Tag2

> Erster Kommentar: „LeaderOS Beta, kostenlos: [Link]"

---

## C02 · Zuhören

Text.

> Erster Kommentar: „Die zehn Stufen: leader-os.de/journal/x · Beta: [Link]"

---

## Offene Punkte

1. Freigabe.
"""


def test_parse_captions_splits_sections_and_first_comment():
    parsed = cli.parse_captions(SAMPLE_CAPTIONS)
    assert set(parsed) == {"C01", "C02"}
    assert parsed["C01"]["title"] == "Wissen wird gelehrt."
    assert parsed["C01"]["caption"].startswith("Zeile eins.\nZeile zwei.")
    assert parsed["C01"]["caption"].endswith("#Tag1 #Tag2")
    assert "Erster Kommentar" not in parsed["C01"]["caption"]
    assert parsed["C01"]["first_comment"] == "LeaderOS Beta, kostenlos: [Link]"
    assert parsed["C02"]["first_comment"].startswith("Die zehn Stufen")


def test_real_captions_cover_all_manifest_entries():
    if not SERIES.exists():
        pytest.skip("Repo-Checkout ohne docs/gtm")
    manifest, captions = cli.load_series(SERIES)
    assert set(manifest) <= set(captions)
    for cid, entry in manifest.items():
        assert entry["linkedin"]["pdf"].endswith(f"{cid}.pdf")
        assert entry["instagram"]["slides"][-1].endswith("-ig.jpg")
        assert captions[cid]["caption"]
        assert "[Link]" not in captions[cid]["caption"], cid


def test_media_for_linkedin_document_and_instagram_images():
    entry = {
        "linkedin": {"pdf": "https://x.test/C01.pdf", "slides": ["https://x.test/C01-01.jpg"]},
        "instagram": {"slides": ["https://x.test/C01-01.jpg", "https://x.test/C01-02-ig.jpg"]},
    }
    assert cli.media_for(entry, "linkedin") == [{"url": "https://x.test/C01.pdf", "type": "document"}]
    ig = cli.media_for(entry, "instagram")
    assert [m["type"] for m in ig] == ["image", "image"]
    assert ig[-1]["url"].endswith("-ig.jpg")
    with pytest.raises(z.ZernioError):
        cli.media_for(entry, "tiktok")


def test_content_for_instagram_points_to_bio():
    caption = {"caption": "Text.", "first_comment": "Beta: [Link]"}
    assert cli.content_for(caption, "linkedin") == "Text."
    assert cli.content_for(caption, "instagram") == "Text.\n\nLink in der Bio."


def test_build_post_payload_scheduled():
    payload = z.build_post_payload(
        "Hallo",
        [z.platform_target("LinkedIn", "acc_1")],
        [z.media_item("https://x.test/C01.pdf", "document")],
        scheduled_for="2026-10-28T07:30:00",
        timezone="Europe/Berlin",
    )
    assert payload == {
        "content": "Hallo",
        "platforms": [{"platform": "linkedin", "accountId": "acc_1"}],
        "mediaItems": [{"url": "https://x.test/C01.pdf", "type": "document"}],
        "scheduledFor": "2026-10-28T07:30:00",
        "timezone": "Europe/Berlin",
    }


def test_build_post_payload_publish_now_has_no_schedule():
    payload = z.build_post_payload("Hallo", [z.platform_target("instagram", "acc_2")], publish_now=True)
    assert payload == {"content": "Hallo", "platforms": [{"platform": "instagram", "accountId": "acc_2"}], "publishNow": True}


IMG = [z.media_item(f"https://x.test/{i}.jpg") for i in range(11)]
DOC = z.media_item("https://x.test/a.pdf", "document")
LI = [z.platform_target("linkedin", "a")]
IG = [z.platform_target("instagram", "b")]


@pytest.mark.parametrize(
    "kwargs, message",
    [
        (dict(platforms=IG, media_items=[DOC], publish_now=True), "nur auf LinkedIn"),
        (dict(platforms=LI, media_items=[DOC, IMG[0]], publish_now=True), "nicht mit Bildern"),
        (dict(platforms=IG, media_items=IMG, publish_now=True), "höchstens 10"),
        (dict(platforms=LI), "scheduledFor Pflicht"),
        (dict(platforms=LI, scheduled_for="2026-10-28T07:30:00"), "Zeitzone"),
        (dict(platforms=LI, scheduled_for="2026-10-28T07:30:00", timezone="Europe/Berlin", publish_now=True), "nicht beides"),
        (dict(platforms=[], publish_now=True), "mindestens eine Plattform"),
    ],
)
def test_build_post_payload_rejects_invalid_requests(kwargs, message):
    with pytest.raises(z.ZernioError, match=message):
        z.build_post_payload("Hallo", **kwargs)


def test_media_item_requires_https_and_known_type():
    with pytest.raises(z.ZernioError, match="https"):
        z.media_item("http://x.test/a.jpg")
    with pytest.raises(z.ZernioError, match="Medientyp"):
        z.media_item("https://x.test/a.gif", "gif")


def test_client_sends_bearer_json_and_parses_response():
    seen: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers["authorization"]
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.content)
        return httpx.Response(201, json={"id": "post_1", "status": "scheduled"})

    client = z.ZernioClient(api_key="test-key", transport=httpx.MockTransport(handler))
    result = client.create_post(
        "Hallo", [z.platform_target("linkedin", "acc_1")],
        scheduled_for="2026-10-28T07:30:00", timezone="Europe/Berlin",
    )
    assert result == {"id": "post_1", "status": "scheduled"}
    assert seen["auth"] == "Bearer test-key"
    assert seen["url"] == "https://zernio.com/api/v1/posts"
    assert seen["body"]["platforms"] == [{"platform": "linkedin", "accountId": "acc_1"}]
    assert seen["body"]["scheduledFor"] == "2026-10-28T07:30:00"


def test_client_raises_zernio_error_with_status_and_body():
    transport = httpx.MockTransport(lambda request: httpx.Response(401, json={"error": "invalid api key"}))
    client = z.ZernioClient(api_key="test-key", transport=transport)
    with pytest.raises(z.ZernioError) as info:
        client.list_accounts()
    assert info.value.status == 401
    assert info.value.payload == {"error": "invalid api key"}


def test_from_env_requires_key_and_trims_base_url(monkeypatch):
    monkeypatch.delenv("ZERNIO_API_KEY", raising=False)
    assert z.ZernioClient.is_enabled() is False
    with pytest.raises(z.ZernioError, match="ZERNIO_API_KEY"):
        z.ZernioClient.from_env()
    monkeypatch.setenv("ZERNIO_API_KEY", "test-key")
    monkeypatch.setenv("ZERNIO_BASE_URL", "https://example.test/v1/")
    client = z.ZernioClient.from_env()
    assert client.base_url == "https://example.test/v1"
    assert z.ZernioClient.is_enabled() is True


def test_cli_dry_run_prints_payload_without_network(capsys, monkeypatch):
    if not SERIES.exists():
        pytest.skip("Repo-Checkout ohne docs/gtm")
    monkeypatch.delenv("ZERNIO_API_KEY", raising=False)
    rc = cli.main(["post", "C01", "--platform", "linkedin", "--account", "acc_1", "--at", "2026-10-28T07:30", "--dry-run"])
    out = capsys.readouterr().out
    assert rc == 0
    assert '"scheduledFor": "2026-10-28T07:30"' in out
    assert '"type": "document"' in out
    assert "dry-run" in out
    assert "Erster Kommentar" in out


def test_cli_post_without_key_fails_cleanly(capsys, monkeypatch):
    if not SERIES.exists():
        pytest.skip("Repo-Checkout ohne docs/gtm")
    monkeypatch.delenv("ZERNIO_API_KEY", raising=False)
    rc = cli.main(["post", "C01", "--platform", "instagram", "--account", "acc_1", "--now"])
    assert rc == 1
    assert "ZERNIO_API_KEY" in capsys.readouterr().err
