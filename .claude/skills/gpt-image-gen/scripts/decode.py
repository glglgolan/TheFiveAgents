#!/usr/bin/env python3
"""Read JSON from stdin, extract data[0].b64_json, decode to PNG at argv[1]."""
import sys
import json
import base64


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: decode.py <output-path>", file=sys.stderr)
        return 2
    output = sys.argv[1]
    data = json.load(sys.stdin)
    b64 = data["data"][0]["b64_json"]
    with open(output, "wb") as f:
        f.write(base64.b64decode(b64))
    return 0


if __name__ == "__main__":
    sys.exit(main())
