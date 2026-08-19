"""Shared event loop for sync-style async tests.

Motor's client is created at import time of `config` and binds to the default
event loop of the process. Tests must therefore use THAT loop — creating a new
one leads to "got Future attached to a different loop".
"""
import asyncio

try:
    LOOP = asyncio.get_event_loop()
    if LOOP.is_closed():
        raise RuntimeError("closed")
except RuntimeError:
    LOOP = asyncio.new_event_loop()
    asyncio.set_event_loop(LOOP)

run = LOOP.run_until_complete
