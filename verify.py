#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import ipaddress
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
TEXT_SUFFIXES = {".py", ".js", ".md", ".html", ".json", ".yml", ".yaml", ".service", ".timer", ".txt", ".svg", ""}
EXPECTED_WIDGETS = {
    "SetupTokenTrackerV2.js",
    "TokenOverviewV2.js",
    "ModelRankingV2.js",
    "ModelFocusV2.js",
    "UsageRhythmV2.js",
    "ActivityCacheV2.js",
    "SetupTokenTrackerV3.js",
    "TokenOverviewV3.js",
    "ModelRankingV3.js",
    "ModelFocusV3.js",
    "UsageRhythmV3.js",
    "ActivityCacheV3.js",
    "CacheHealthV3.js",
    "ResponsePulseV3.js",
    "SetupTokenTrackerV4.js",
    "TokenOverviewV4.js",
    "ModelRankingV4.js",
    "ModelFocusV4.js",
    "UsageRhythmV4.js",
    "ActivityCacheV4.js",
    "CacheHealthV4.js",
    "ResponsePulseV4.js",
}
ALLOWED_HOSTS = {"github.com", "scriptable.app", "img.shields.io", "example.com", "relay.example.com", "api.example.com", "your-domain.example", "127.0.0.1", "www.w3.org"}
URL_PATTERN = re.compile(r"https?://[^\s\"'<>`)]+")
IP_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
SECRETISH = re.compile(r"(?i)(?:api[_-]?key|access[_-]?token|secret|password|session|authorization)\s*[:=]\s*[\"']?([^\s\"',}]+)")
PLACEHOLDER_PARTS = ("replace", "example", "your_", "<", "os.environ", "self.headers", "value.apikey", "settings.apikey", "alert.textfieldvalue", "env.get", "self.cfg", "headers[")


def fail(message: str) -> None:
    raise AssertionError(message)


def run(command: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True)
    if result.returncode:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        raise RuntimeError("failed: " + " ".join(command))
    return result


def text_files() -> list[Path]:
    return [p for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.parts and p.suffix.lower() in TEXT_SUFFIXES]


def external_blocked_hashes() -> set[str]:
    path = os.environ.get("TOKEN_TRACKER_PRIVATE_HASHES", "")
    if not path:
        return set()
    return {line.strip().lower() for line in Path(path).read_text().splitlines() if line.strip() and not line.startswith("#")}


def scan_text(label: str, text: str, private_hashes: set[str]) -> list[str]:
    findings = []
    lowered = text.lower()
    for match in URL_PATTERN.finditer(text):
        host = (urlparse(match.group(0)).hostname or "").lower()
        if host and host not in ALLOWED_HOSTS and not host.endswith(".github.com"):
            findings.append(f"{label}: non-allowlisted URL host {host!r}")
    for match in IP_PATTERN.finditer(text):
        try:
            address = ipaddress.ip_address(match.group(0))
        except ValueError:
            continue
        if not (address.is_loopback or address.is_unspecified):
            findings.append(f"{label}: non-loopback IP address")
    for match in SECRETISH.finditer(text):
        value = match.group(1).strip()
        low = value.lower()
        if not value or any(part.lower() in low for part in PLACEHOLDER_PARTS) or value.startswith(("TOKEN_", "RELAY_")):
            continue
        if len(value) >= 16:
            findings.append(f"{label}: possible hard-coded credential")
    for digest in private_hashes:
        # Compare every whitespace/quote-delimited token by hash without storing private values in this repository.
        for token in re.findall(r"[^\s\"'`,;{}()\[\]]{4,}", lowered):
            if hashlib.sha256(token.encode()).hexdigest() == digest:
                findings.append(f"{label}: token matches external private denylist")
                break
    return findings


def scan_public_tree() -> None:
    private_hashes = external_blocked_hashes()
    findings = []
    for path in text_files():
        findings.extend(scan_text(str(path.relative_to(ROOT)), path.read_text(errors="ignore"), private_hashes))
    if findings:
        fail("public tree safety scan failed:\n" + "\n".join(findings))
    print("PASS public tree contains no private URL, IP, or hard-coded credential")
    if private_hashes:
        print("PASS external hashed private denylist")


def verify_demo_is_fictional() -> None:
    demo = (ROOT / "docs" / "demo-preview.html").read_text()
    screen = (ROOT / "tools" / "v3-sanitized-screen.svg").read_text()
    markers = ["Fictional Demo Data", "虚构演示数据", "NO REAL USER DATA", "Synthetic Labs"]
    if not all(marker in demo for marker in markers):
        fail("demo preview is not explicitly marked as fictional")
    if "ALL VALUES ARE FICTIONAL" not in screen or "PUBLIC DEMO ONLY" not in screen:
        fail("V3 screen preview is not explicitly marked as fictional")
    payload = json.loads((ROOT / "tools" / "v4" / "demo_payload.json").read_text())
    if payload.get("meta", {}).get("fictional") != "ALL VALUES ARE FICTIONAL · PUBLIC DEMO ONLY":
        fail("V4 demo payload is not marked as fictional")
    print("PASS preview is explicitly fictional")


def verify_v4_build() -> None:
    """The seven V4 widgets must be exactly what tools/build_v4.py generates from src/v4/core.js."""
    before = {p.name: p.read_text() for p in (ROOT / "scriptable").glob("*V4.js") if p.name != "SetupTokenTrackerV4.js"}
    run([sys.executable, str(ROOT / "tools" / "build_v4.py")], ROOT)
    after = {p.name: p.read_text() for p in (ROOT / "scriptable").glob("*V4.js") if p.name != "SetupTokenTrackerV4.js"}
    if before != after:
        fail("V4 widgets are out of date: run python3 tools/build_v4.py and commit the result")
    core = (ROOT / "src" / "v4" / "core.js").read_text()
    if core.index("/* ============================== entry") < core.index("const Pulse = {"):
        fail("V4 entry code must come after the view definitions")
    print("PASS V4 widgets match src/v4/core.js")


def verify_code() -> None:
    widgets = {path.name for path in (ROOT / "scriptable").glob("*.js")}
    if widgets != EXPECTED_WIDGETS:
        fail(f"unexpected Scriptable sources: {sorted(widgets)}")
    run([sys.executable, "-m", "py_compile", *[p.name for p in (ROOT / "backend").glob("*.py")]], ROOT / "backend")
    run([sys.executable, "test_v3.py"], ROOT / "backend")
    qjsc = subprocess.run(["sh", "-c", "command -v qjsc"], text=True, capture_output=True).stdout.strip()
    node = subprocess.run(["sh", "-c", "command -v node"], text=True, capture_output=True).stdout.strip()
    with tempfile.TemporaryDirectory() as directory:
        for source in sorted((ROOT / "scriptable").glob("*.js")):
            if qjsc:
                run([qjsc, "-m", "-c", "-o", str(Path(directory) / f"{source.stem}.c"), str(source)])
            elif node:
                run([node, "--check", str(source)])
            else:
                fail("neither qjsc nor node is available for JavaScript syntax checks")
    print("PASS backend and Scriptable syntax/tests")


def verify_runtime_and_history() -> None:
    forbidden = {".env", "sources.json", "tokens.db", "sync.log", "sync.lock", "token-tracker-v2-settings.json", "token-tracker-v3-settings.json", "token-tracker-v4-settings.json", "token-tracker-v4-cache.json"}
    present = [p for p in ROOT.rglob("*") if p.is_file() and p.name in forbidden]
    if present:
        fail("runtime/private files present: " + ", ".join(str(p.relative_to(ROOT)) for p in present))
    if (ROOT / ".git").exists():
        history = run(["git", "log", "-p", "--all", "--no-ext-diff"], ROOT).stdout
        findings = scan_text("Git history", history, external_blocked_hashes())
        if findings:
            fail("Git history safety scan failed:\n" + "\n".join(findings))
        print("PASS Git history safety scan")
    print("PASS runtime/private files are absent")


def main() -> None:
    scan_public_tree()
    verify_demo_is_fictional()
    verify_runtime_and_history()
    verify_code()
    verify_v4_build()
    print("ALL PUBLIC RELEASE GATES OK")


if __name__ == "__main__":
    main()
