"""Shared test configuration — credentials from environment."""
import os

TEST_EMAIL = os.environ.get("TEST_EMAIL", "test@test.com")
TEST_PASSWORD = os.environ.get("TEST_PASSWORD", "test123")


# Iter 183: Motor bindet seinen Client an genau EINE Event-Loop. Läufe über mehrere
# Testdateien brauchen deshalb eine gemeinsame Loop, sonst scheitert die zweite Datei
# mit „Event loop is closed".
import asyncio

import pytest


@pytest.fixture(scope="session")
def loop():
    lo = asyncio.new_event_loop()
    asyncio.set_event_loop(lo)
    yield lo
    lo.close()
