from __future__ import annotations

import json
import os
from pathlib import Path

BASE_DIR = Path(os.environ.get("TOKEN_TRACKER_DIR", Path(__file__).resolve().parent))
ENV_PATH = Path(os.environ.get("TOKEN_ENV", BASE_DIR / ".env"))


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text().splitlines():
        if "=" in raw and not raw.lstrip().startswith("#"):
            key, value = raw.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


load_env(ENV_PATH)
DB_PATH = Path(os.environ.get("TOKEN_DB", BASE_DIR / "data" / "tokens.db"))
SOURCES_PATH = Path(os.environ.get("TOKEN_SOURCES_FILE", BASE_DIR / "sources.json"))
PORT = int(os.environ.get("TOKEN_PORT", "8799"))
API_KEY = os.environ.get("TOKEN_API_KEY", "")
TIMEZONE = os.environ.get("TOKEN_TIMEZONE", "Asia/Shanghai")


def load_sources(path: Path) -> dict:
    if not path.exists():
        return {}
    data = json.loads(path.read_text())
    if not isinstance(data, dict):
        raise RuntimeError("sources.json must contain an object")
    required = {"label", "url", "auth", "secret_env"}
    for name, source in data.items():
        if not isinstance(source, dict) or not required <= source.keys():
            raise RuntimeError(f"source {name!r} is missing required fields")
        if source["auth"] not in {"cookie", "bearer"}:
            raise RuntimeError(f"source {name!r} has unsupported auth type")
        source.setdefault("user_env", "")
        source.setdefault("default_user", "")
    return data


SOURCES = load_sources(SOURCES_PATH)
