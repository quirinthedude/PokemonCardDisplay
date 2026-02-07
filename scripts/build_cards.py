#!/usr/bin/env python3
"""
Build a small "cards.json" for a Pokémon card grid:
- picks N base forms (evolves_from_species == null)
- that actually evolve (evolution chain has at least 1 step)
- enriches with pokemon/{name} details (types, key stats, official artwork)
- outputs a compact JSON for easy frontend rendering
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import requests

BASE = "https://pokeapi.co/api/v2"
USER_AGENT = "DA-Pokemon-Card-Display/1.0 (local script)"
TIMEOUT = 20


# --- HTTP helpers ------------------------------------------------------------

def get_json(url: str, session: requests.Session, retries: int = 4) -> Dict[str, Any]:
    last_err = None
    for attempt in range(retries):
        try:
            r = session.get(url, timeout=TIMEOUT)
            if r.status_code == 429:
                # rate limit; respect Retry-After if present
                wait = int(r.headers.get("Retry-After", "2"))
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Failed GET {url}: {last_err}")


# --- Evolution parsing -------------------------------------------------------

def flatten_evolution_chain(chain_root: Dict[str, Any]) -> List[str]:
    """
    "Linear" flatten:
    - Always follows the first branch only.
    If you later want branching (Eevee), we can adapt to return all paths.
    """
    out: List[str] = []
    node = chain_root
    while node:
        species = node.get("species", {}).get("name")
        if species:
            out.append(species)
        evolves_to = node.get("evolves_to") or []
        node = evolves_to[0] if evolves_to else None
    return out


def chain_has_evolution(chain_root: Dict[str, Any]) -> bool:
    evolves_to = chain_root.get("evolves_to") or []
    return len(evolves_to) > 0


# --- Data extraction ---------------------------------------------------------

STAT_KEYS = ["hp", "attack", "defense", "special-attack", "speed"]

def extract_stats(pokemon_json: Dict[str, Any]) -> Dict[str, int]:
    stats_map: Dict[str, int] = {}
    for s in pokemon_json.get("stats", []):
        name = s.get("stat", {}).get("name")
        val = s.get("base_stat")
        if name in STAT_KEYS and isinstance(val, int):
            stats_map[name] = val

    # Ensure all keys exist (fallback 0)
    return {k: int(stats_map.get(k, 0)) for k in STAT_KEYS}


def official_artwork_url(pokemon_json: Dict[str, Any]) -> Optional[str]:
    # Prefer API-provided official artwork if present
    try:
        return pokemon_json["sprites"]["other"]["official-artwork"]["front_default"]
    except Exception:
        return None


def extract_types(pokemon_json: Dict[str, Any]) -> List[str]:
    types = []
    for t in pokemon_json.get("types", []):
        name = t.get("type", {}).get("name")
        if name:
            types.append(name)
    return types


# --- Core pipeline -----------------------------------------------------------

def iter_species_pages(session: requests.Session, page_size: int = 200, offset: int = 0):
    url = f"{BASE}/pokemon-species?limit={page_size}&offset={offset}"
    while url:
        data = get_json(url, session)
        yield data
        url = data.get("next")


def build_cards(
    target_n: int = 10,
    species_page_size: int = 200,
    start_offset: int = 0,
    sleep_between: float = 0.0,
) -> Dict[str, Any]:
    with requests.Session() as session:
        session.headers.update({"User-Agent": USER_AGENT})

        picked: List[Dict[str, Any]] = []

        # 1) Find N base forms that actually evolve
        for page in iter_species_pages(session, page_size=species_page_size, offset=start_offset):
            for item in page.get("results", []):
                species_url = item.get("url")
                if not species_url:
                    continue

                species = get_json(species_url, session)
                # base form?
                if species.get("evolves_from_species") is not None:
                    continue

                evo_chain_url = (species.get("evolution_chain") or {}).get("url")
                if not evo_chain_url:
                    continue

                evo_chain = get_json(evo_chain_url, session)
                chain_root = evo_chain.get("chain") or {}
                if not chain_root or not chain_has_evolution(chain_root):
                    continue  # doesn't evolve => skip

                base_name = species.get("name")
                if not base_name:
                    continue

                picked.append({
                    "base_name": base_name,
                    "species_url": species_url,
                    "evo_chain_url": evo_chain_url,
                })

                if sleep_between:
                    time.sleep(sleep_between)

                if len(picked) >= target_n:
                    break
            if len(picked) >= target_n:
                break

        # 2) Enrich each base Pokémon via /pokemon/{name}
        cards: List[Dict[str, Any]] = []
        for p in picked:
            base_name = p["base_name"]
            pokemon = get_json(f"{BASE}/pokemon/{base_name}", session)

            # evolution chain -> flat list
            evo_chain = get_json(p["evo_chain_url"], session)
            chain_root = evo_chain.get("chain") or {}
            evo_list = flatten_evolution_chain(chain_root) if chain_root else [base_name]

            card = {
                "id": int(pokemon.get("id") or 0),
                "name": base_name,
                "types": extract_types(pokemon),
                "image": official_artwork_url(pokemon),
                "stats": extract_stats(pokemon),
                "evolution": evo_list,
            }
            cards.append(card)

            if sleep_between:
                time.sleep(sleep_between)

        # 3) Output structure
        return {
            "meta": {
                "source": "pokeapi.co",
                "createdAt": time.strftime("%Y-%m-%d"),
                "rules": {
                    "baseOnly": True,
                    "mustEvolve": True,
                    "statsTop": STAT_KEYS,
                    "evolutionFlattening": "linear-first-branch",
                },
                "startOffset": start_offset,
                "speciesPageSize": species_page_size,
                "targetN": target_n,
            },
            "cards": cards,
        }


def main():
    data = build_cards(
        target_n=10,
        species_page_size=200,
        start_offset=0,
        sleep_between=0.0,  # set to 0.2 if you hit rate limits
    )

    out_path = "cards.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Wrote {out_path} with {len(data['cards'])} cards.")
    # quick preview
    for c in data["cards"]:
        print(f"- #{c['id']:>3} {c['name']:<12} types={c['types']} evo={c['evolution']}")


if __name__ == "__main__":
    main()
