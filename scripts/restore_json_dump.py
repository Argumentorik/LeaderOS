#!/usr/bin/env python3
"""Restore a JSON dump from GET /api/admin/backup/database into MongoDB.

The admin dumper falls back to Extended-JSON lines when the host has no
mongodump binary (Emergent doesn't), which mongorestore can't read:

    {"type": "meta", "db": ..., "collections": [...]}
    {"type": "collection", "name": "users"}
    {"type": "doc", "data": {...}}

Usage:
    MONGO_URL=... python scripts/restore_json_dump.py DUMP [--db leadership_os]
        [--collections users,credits] [--drop]

DUMP may be .json, .json.gz or "-" for stdin. Refuses to write into a
non-empty collection unless --drop is given. Indexes aren't in the dump;
the backend recreates them on startup.
"""
import argparse
import gzip
import json
import os
import sys

from bson import json_util
from pymongo import MongoClient

BATCH = 1000


def open_dump(path):
    if path == "-":
        return sys.stdin
    if path.endswith(".gz"):
        return gzip.open(path, "rt", encoding="utf-8")
    return open(path, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dump")
    ap.add_argument("--db", default=os.environ.get("DB_NAME", "leadership_os"))
    ap.add_argument("--collections", help="comma-separated; default: all")
    ap.add_argument("--drop", action="store_true", help="drop target collections first")
    args = ap.parse_args()

    only = set(args.collections.split(",")) if args.collections else None
    db = MongoClient(os.environ["MONGO_URL"])[args.db]

    counts, batch, cur, skip = {}, [], None, True

    def flush():
        if batch:
            db[cur].insert_many(batch, ordered=False)
            counts[cur] += len(batch)
            batch.clear()

    with open_dump(args.dump) as f:
        for line in f:
            rec = json_util.loads(line)
            kind = rec["type"]
            if kind == "meta":
                print(f"source db {rec['db']} exported {rec['exported_at']}", file=sys.stderr)
            elif kind == "collection":
                flush()
                cur = rec["name"]
                skip = only is not None and cur not in only
                if skip:
                    continue
                if args.drop:
                    db[cur].drop()
                elif db[cur].estimated_document_count():
                    sys.exit(f"{args.db}.{cur} is not empty; pass --drop to replace it")
                counts[cur] = 0
            elif kind == "doc" and not skip:
                batch.append(rec["data"])
                if len(batch) >= BATCH:
                    flush()
    flush()

    if only and (missing := only - counts.keys()):
        print(f"not in dump: {', '.join(sorted(missing))}", file=sys.stderr)
    bad = 0
    for name, n in sorted(counts.items()):
        actual = db[name].count_documents({})
        bad += actual != n
        print(f"{name:40} {n:>7} {'ok' if actual == n else f'MISMATCH ({actual} in db)'}")
    print(f"{sum(counts.values())} docs into {args.db}", file=sys.stderr)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
