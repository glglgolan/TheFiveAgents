#!/usr/bin/env python3
"""Download ElevenLabs creative-flow generations from a saved creative_get_flow_run_status JSON.
Tip: pass >=20 session_ids to get_flow_run_status so the (huge) result is saved to a file instead of the context.
Usage: python3 fetch_elevenlabs.py <out_dir> <map.json> <status.json> [...]
map.json = {"<unique substring of the prompt>": "<name>", ...}  → files <out_dir>/<name>_<id4>.mp3"""
import json, sys, subprocess
from pathlib import Path
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
MAP = json.load(open(sys.argv[2]))
for f in sys.argv[3:]:
    for g in json.load(open(f))["generations"]:
        key = next((v for k, v in MAP.items() if k in g["prompt"]), "misc")
        p = out / f'{key}_{g["id"][:4]}.mp3'
        if g["status"] == "completed" and not p.exists():
            subprocess.run(["curl", "-s", "-o", str(p), g["content_url"]], check=True)
        print(p.name, g["status"], "OK" if p.exists() else "")
