"""Startdatum der Kurs-Universität — eine Stelle für alle (Plan Iter 187).

Verschiebt sich der Start, ändert sich hier eine Zahl (oder die Umgebungs-
Variable `COURSES_LAUNCH_DATE`). Übersicht, Folgen-Seiten und Mails lesen
denselben Wert.
"""
from __future__ import annotations

import os
from datetime import date, datetime, timezone

DEFAULT_LAUNCH = "2026-11-01"


def launch_date() -> date:
    raw = os.environ.get("COURSES_LAUNCH_DATE") or DEFAULT_LAUNCH
    try:
        return date.fromisoformat(raw)
    except ValueError:
        return date.fromisoformat(DEFAULT_LAUNCH)


def launch_info() -> dict:
    d = launch_date()
    today = datetime.now(timezone.utc).date()
    return {
        "date": d.isoformat(),
        "label": f"{d.day:02d}.{d.month:02d}.{d.year}",
        "launched": today >= d,
        "days_until": max(0, (d - today).days),
    }


def is_launched() -> bool:
    return launch_info()["launched"]
