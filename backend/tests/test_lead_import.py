"""Unit tests for services_lead_import.parse_lead_csv — no DB, no network."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from services_lead_import import parse_lead_csv  # noqa: E402


def test_header_row_with_german_names_and_semicolons():
    text = "﻿Vorname;E-Mail;Firma\nAnna;Anna@Example.com;ACME GmbH\nBen;ben@example.org;\n"
    valid, invalid = parse_lead_csv(text)
    assert invalid == []
    assert valid == [
        {"email": "anna@example.com", "name": "Anna", "company": "ACME GmbH"},
        {"email": "ben@example.org", "name": "Ben"},
    ]


def test_zoom_style_export_tab_separated_and_duplicates():
    text = "User Name\tUser Email\tJoin Time\nAnna\tanna@example.com\t10:00\nAnna\tANNA@example.com\t10:05\n"
    valid, invalid = parse_lead_csv(text)
    assert [v["email"] for v in valid] == ["anna@example.com"]
    assert valid[0]["name"] == "Anna"
    assert invalid == []


def test_no_header_first_column_is_email_and_invalid_lines_reported():
    text = "anna@example.com\nnot-an-email\n\nben@example.org,Ben\n"
    valid, invalid = parse_lead_csv(text)
    assert [v["email"] for v in valid] == ["anna@example.com", "ben@example.org"]
    assert invalid == ["not-an-email"]


def test_empty_input():
    assert parse_lead_csv("") == ([], [])


def test_long_fields_are_trimmed():
    text = "email,name\nanna@example.com," + "x" * 300 + "\n"
    valid, _ = parse_lead_csv(text)
    assert len(valid[0]["name"]) == 120
