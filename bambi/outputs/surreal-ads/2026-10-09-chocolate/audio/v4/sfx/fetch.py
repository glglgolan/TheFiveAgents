import json,sys,subprocess
from pathlib import Path
MAP={"glass shattering":"impact","under pressure":"creak","shards falling":"shards","grinding and scraping":"scrape",
"flying past":"flyby","landing heavily":"splat","rising and stretching":"viscous","dull thud":"thud","single thick drop":"drip",
"air swish":"whip","Extreme close-up":"molten","foil":"foil","room tone":"room"}
out=Path(__file__).parent
for f in sys.argv[1:]:
    d=json.load(open(f))
    for g in d["generations"]:
        key=next(v for k,v in MAP.items() if k in g["prompt"])
        tag=f'{key}_{g["id"][:4]}'
        p=out/f"{tag}.mp3"
        if g["status"]=="completed" and not p.exists():
            subprocess.run(["curl","-s","-o",str(p),g["content_url"]],check=True)
        print(tag,g["status"],"OK" if p.exists() else "")
