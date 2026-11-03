"""CSV parsing for admin lead imports (webinar attendee lists).

Pure functions, no database — unit-tested in tests/test_lead_import.py and
used by routes/admin.py::import_webinar_leads. Accepts the exports the support
team actually produces (Zoom attendee list, Excel, Google Sheets): comma,
semicolon or tab separated, header names in German or English, BOM tolerated.
"""
from __future__ import annotations

import csv
import io
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")

LEAD_COLUMNS = {
    "email": ("email", "e-mail", "mail", "email address", "e-mail-adresse", "user email"),
    "name": ("name", "vorname", "first name", "firstname", "full name", "user name"),
    "company": ("company", "firma", "unternehmen", "organisation", "organization"),
}


def parse_lead_csv(text: str) -> tuple[list[dict], list[str]]:
    """Return (valid_leads, invalid_lines).

    - Header row is optional; without one the first column is the email.
    - Emails are lowercased and de-duplicated (first occurrence wins).
    - `name` / `company` are trimmed to 120 characters.
    """
    text = text.lstrip("﻿")
    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    rows = list(csv.reader(io.StringIO(text), dialect))
    if not rows:
        return [], []

    header = [h.strip().lower() for h in rows[0]]
    idx: dict[str, int] = {}
    for key, aliases in LEAD_COLUMNS.items():
        for i, h in enumerate(header):
            if h in aliases:
                idx[key] = i
                break
    if "email" in idx:
        body = rows[1:]
    else:
        idx = {"email": 0}
        body = rows

    valid: list[dict] = []
    invalid: list[str] = []
    seen: set[str] = set()
    for r in body:
        if not any(c.strip() for c in r):
            continue
        email = (r[idx["email"]] if idx["email"] < len(r) else "").strip().lower()
        if not EMAIL_RE.match(email):
            invalid.append(",".join(r)[:120])
            continue
        if email in seen:
            continue
        seen.add(email)
        lead = {"email": email}
        for key in ("name", "company"):
            i = idx.get(key)
            if i is not None and i < len(r) and r[i].strip():
                lead[key] = r[i].strip()[:120]
        valid.append(lead)
    return valid, invalid
