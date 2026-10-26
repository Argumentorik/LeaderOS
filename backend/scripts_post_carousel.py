"""Karussell aus docs/gtm/linkedin-carousels-01 über Zernio planen oder posten.

Run (aus backend/, Repo-Checkout vorausgesetzt):
  python3 scripts_post_carousel.py accounts
  python3 scripts_post_carousel.py show C01 --platform linkedin
  python3 scripts_post_carousel.py post C01 --platform linkedin --account <accountId> \
      --at 2026-10-28T07:30 --tz Europe/Berlin [--dry-run]
  python3 scripts_post_carousel.py post C01 --platform instagram --account <accountId> --now

Quelle: manifest.json (öffentliche URLs der Folien und PDFs) und CAPTIONS.md
(Caption je Karussell). LinkedIn bekommt die PDF als Dokument-Karussell,
Instagram die Einzelbilder mit der -ig-Variante der CTA-Folie (Link in der
Bio). Der „Erster Kommentar"-Hinweis aus CAPTIONS.md wird nicht gepostet,
sondern ausgegeben: der Kommentar mit dem Link wird nach dem Post von Hand
gesetzt (LinkedIn drosselt Posts mit externem Link im Text).

Ohne ZERNIO_API_KEY funktionieren nur `show` und `post --dry-run`.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from services_zernio import ZernioClient, ZernioError, build_post_payload, media_item, platform_target  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SERIES_DIR = ROOT / "docs" / "gtm" / "linkedin-carousels-01"
PLATFORMS = ("linkedin", "instagram")
DEFAULT_TZ = "Europe/Berlin"

_SECTION = re.compile(r"^## (C\d{2}) · (.+)$", re.MULTILINE)
_COMMENT = re.compile(r"^> Erster Kommentar:\s*[„\"]?(.*?)[\"“]?\s*$", re.MULTILINE)


def parse_captions(text: str) -> dict[str, dict]:
    """CAPTIONS.md → {id: {title, caption, first_comment}}.

    Ein Abschnitt beginnt mit `## C01 · Titel` und endet am nächsten `---`.
    Die Blockquote „Erster Kommentar" gehört nicht in den Post-Text.
    """
    result: dict[str, dict] = {}
    matches = list(_SECTION.finditer(text))
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[m.end():end]
        block = block.split("\n---", 1)[0]
        comment = _COMMENT.search(block)
        body = _COMMENT.sub("", block)
        caption = "\n".join(line.rstrip() for line in body.strip().splitlines()).strip()
        result[m.group(1)] = {
            "title": m.group(2).strip(),
            "caption": caption,
            "first_comment": comment.group(1).strip() if comment else "",
        }
    return result


def load_series(series_dir: Path = SERIES_DIR) -> tuple[dict[str, dict], dict[str, dict]]:
    manifest = {c["id"]: c for c in json.loads((series_dir / "manifest.json").read_text(encoding="utf-8"))}
    captions = parse_captions((series_dir / "CAPTIONS.md").read_text(encoding="utf-8"))
    return manifest, captions


def media_for(entry: dict, platform: str) -> list[dict]:
    """LinkedIn: PDF als Dokument. Instagram: Bilder, letzte Folie als -ig-Variante."""
    if platform == "linkedin":
        return [media_item(entry["linkedin"]["pdf"], "document")]
    if platform == "instagram":
        return [media_item(url, "image") for url in entry["instagram"]["slides"]]
    raise ZernioError(f"Plattform {platform!r} wird vom Skript nicht abgedeckt ({', '.join(PLATFORMS)})")


def content_for(caption: dict, platform: str) -> str:
    """Instagram kennt keinen ersten Kommentar: dort steht der Hinweis auf die Bio im Text."""
    text = caption["caption"]
    if platform == "instagram" and caption["first_comment"]:
        text = f"{text}\n\nLink in der Bio."
    return text


def build(carousel_id: str, platform: str, account_id: str, at: str | None, tz: str, now: bool) -> tuple[dict, dict]:
    manifest, captions = load_series()
    if carousel_id not in manifest:
        raise ZernioError(f"{carousel_id} nicht im Manifest ({', '.join(sorted(manifest))})")
    if carousel_id not in captions:
        raise ZernioError(f"{carousel_id} hat keine Caption in CAPTIONS.md")
    payload = build_post_payload(
        content=content_for(captions[carousel_id], platform),
        platforms=[platform_target(platform, account_id)],
        media_items=media_for(manifest[carousel_id], platform),
        scheduled_for=None if now else at,
        timezone=None if now else tz,
        publish_now=now,
    )
    return payload, captions[carousel_id]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("accounts", help="verbundene Zernio-Konten mit accountId auflisten")

    show = sub.add_parser("show", help="Caption, Medien und ersten Kommentar eines Karussells anzeigen")
    show.add_argument("carousel", help="z. B. C01")
    show.add_argument("--platform", choices=PLATFORMS, default="linkedin")

    post = sub.add_parser("post", help="Karussell planen (--at) oder sofort posten (--now)")
    post.add_argument("carousel", help="z. B. C01")
    post.add_argument("--platform", choices=PLATFORMS, required=True)
    post.add_argument("--account", required=True, help="accountId aus `accounts`")
    post.add_argument("--at", help="ISO-Zeitpunkt in --tz, z. B. 2026-10-28T07:30")
    post.add_argument("--tz", default=DEFAULT_TZ, help=f"IANA-Zeitzone, Standard {DEFAULT_TZ}")
    post.add_argument("--now", action="store_true", help="sofort veröffentlichen statt planen")
    post.add_argument("--dry-run", action="store_true", help="nur den Request zeigen, nichts senden")
    args = parser.parse_args(argv)

    try:
        if args.cmd == "accounts":
            print(json.dumps(ZernioClient.from_env().list_accounts(), indent=2, ensure_ascii=False))
            return 0

        if args.cmd == "show":
            manifest, captions = load_series()
            entry, caption = manifest[args.carousel], captions[args.carousel]
            print(f"{args.carousel} · {caption['title']}\n")
            print(content_for(caption, args.platform))
            print("\nMedien:")
            for m in media_for(entry, args.platform):
                print(f"  {m['type']}: {m['url']}")
            if caption["first_comment"]:
                print(f"\nErster Kommentar (von Hand): {caption['first_comment']}")
            return 0

        if not args.now and not args.at:
            parser.error("post braucht --at <Zeitpunkt> oder --now")
        payload, caption = build(args.carousel, args.platform, args.account, args.at, args.tz, args.now)
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        if caption["first_comment"]:
            print(f"\nErster Kommentar (nach dem Post von Hand setzen): {caption['first_comment']}")
        if args.dry_run:
            print("\n(dry-run: nichts gesendet)")
            return 0
        result = ZernioClient.from_env().create_post(**payload_kwargs(payload))
        print("\nZernio-Antwort:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except ZernioError as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        return 1


def payload_kwargs(payload: dict) -> dict:
    """POST-Body zurück in die Argumente von ZernioClient.create_post."""
    return {
        "content": payload["content"],
        "platforms": payload["platforms"],
        "media_items": payload.get("mediaItems"),
        "scheduled_for": payload.get("scheduledFor"),
        "timezone": payload.get("timezone"),
        "publish_now": payload.get("publishNow", False),
    }


if __name__ == "__main__":
    sys.exit(main())
