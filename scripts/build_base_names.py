#!/usr/bin/env python3
"""
Extract base Pokémon names from base_index.json
and write a minimal base_names.json for frontend usage.
"""

import json
from pathlib import Path


INPUT_FILE = Path("base_index.json")
OUTPUT_FILE = Path("base_names.json")


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError("base_index.json not found. Run build_base_index.py first.")

    with INPUT_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)

    bases = []
    for entry in data.get("bases", []):
        name = entry.get("base")
        if name:
            bases.append(name)

    out = {
        "meta": {
            "source": "derived-from-base_index",
            "count": len(bases)
        },
        "bases": bases
    }

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Wrote {OUTPUT_FILE} with {len(bases)} base Pokémon names.")


if __name__ == "__main__":
    main()
