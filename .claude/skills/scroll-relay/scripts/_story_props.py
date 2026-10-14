#!/usr/bin/env python3
"""Fill media.count from <dir>/meta.json (or file count) and validate paths. Usage: _story_props.py <run> <story.json>"""
import json, os, sys
run, story = sys.argv[1], sys.argv[2]
p = json.load(open(os.path.join(run, story), encoding="utf-8"))
for s in p["sections"]:
    for m in s.get("media", []):
        d = os.path.join(run, m["dir"])
        if not os.path.isdir(d): sys.exit(f"media dir missing: {m['dir']}")
        if not m.get("count"):
            meta = os.path.join(d, "meta.json")
            m["count"] = json.load(open(meta))["count"] if os.path.exists(meta) else len([x for x in os.listdir(d) if x.endswith("." + m.get("ext", "png"))])
        if "ext" not in m:
            m["ext"] = "png" if os.path.exists(os.path.join(d, "000001.png")) else "jpg"
out = os.path.join(run, ".story_props.json"); json.dump(p, open(out, "w"), ensure_ascii=False); print(out)
