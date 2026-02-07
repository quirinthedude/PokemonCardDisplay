#!/usr/bin/env python3
from __future__ import annotations

import json
import time
from typing import Any, Dict, List, Optional

import requests

BASE = "https://pokeapi.co/api/v2"
USER_AGENT = "DA-Pokemon-BaseIndex/1.0"
TIMEOUT = 20


def get_json(url: str, session: requests.Session, retries: int = 4) -> Dict[str, Any]:
    last_err = None
    for attempt in range(retries):
        try:
            r = session.get(url, timeout=TIMEOUT)
            if r.status_code == 429:
                wait = int(r.headers.get("Retry-After", "2"))
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Failed GET {url}: {last_err}")


def iter_species(session: requests.Session, page_size: int = 200) -> List[Dict[str, Any]]:
    url = f"{BASE}/pokemon-species?limit={page_size}&offset=0"
    out: List[Dict[str, Any]] = []
    while url:
        page = get_json(url, session)
        out.extend(page.get("results", []))
        url = page.get("next")
    return out


def collect_paths_from_chain(node: Dict[str, Any], prefix: Optional[List[str]] = None) -> List[List[str]]:
    """Return all evolution paths (supports branching like Eevee)."""
    if prefix is None:
        prefix = []
    name = node.get("species", {}).get("name")
    if name:
        prefix = prefix + [name]

    evolves_to = node.get("evolves_to") or []
    if not evolves_to:
        return [prefix]

    paths: List[List[str]] = []
    for child in evolves_to:
        paths.extend(collect_paths_from_chain(child, prefix))
    return paths


def pokemon_assets(name: str, session: requests.Session) -> Dict[str, Any]:
    """
    Robust asset fetch:
    - First try /pokemon/{name}
    - If 404, try /pokemon-species/{name} and use default variety pokemon.url
    - If still failing, return minimal record with error marker (no crash)
    """
    def from_pokemon(p: Dict[str, Any]) -> Dict[str, Any]:
        mini = p.get("sprites", {}).get("front_default")
        official = (
            p.get("sprites", {})
             .get("other", {})
             .get("official-artwork", {})
             .get("front_default")
        )
        types = [t["type"]["name"] for t in p.get("types", []) if t.get("type")]
        return {
            "id": int(p.get("id") or 0),
            "name": p.get("name") or name,
            "types": types,
            "mini": mini,
            "image": official,
        }

    url = f"{BASE}/pokemon/{name}"
    try:
        p = get_json(url, session)
        return from_pokemon(p)
    except RuntimeError as e:
        # If it isn't a 404, still maybe temporary – but we’ll attempt fallback anyway.
        # Fallback: species -> default variety -> pokemon.url
        try:
            s = get_json(f"{BASE}/pokemon-species/{name}", session)
            varieties = s.get("varieties") or []
            default_var = next((v for v in varieties if v.get("is_default")), None) or (varieties[0] if varieties else None)
            p_url = (default_var or {}).get("pokemon", {}).get("url")
            if not p_url:
                raise RuntimeError("No default variety pokemon.url")
            p2 = get_json(p_url, session)
            return from_pokemon(p2)
        except Exception:
            # Don’t crash the whole build – just return a placeholder
            return {
                "id": 0,
                "name": name,
                "types": [],
                "mini": None,
                "image": None,
                "error": "pokemon-not-found",
            }


def main():
    # Settings:
    ONLY_THOSE_WHO_EVOLVE = True   # set False if you also want single-stage bases
    PAGE_SIZE = 200

    with requests.Session() as session:
        session.headers.update({"User-Agent": USER_AGENT})

        species_list = iter_species(session, page_size=PAGE_SIZE)

        base_entries: List[Dict[str, Any]] = []

        for item in species_list:
            s_url = item.get("url")
            if not s_url:
                continue

            s = get_json(s_url, session)

            # base form?
            if s.get("evolves_from_species") is not None:
                continue

            evo_url = (s.get("evolution_chain") or {}).get("url")
            if not evo_url:
                continue

            evo = get_json(evo_url, session)
            chain = evo.get("chain") or {}
            if not chain:
                continue

            paths = collect_paths_from_chain(chain)
            # If we only want bases that have at least one evolution step:
            # that means any path length >= 2
            has_evo = any(len(p) >= 2 for p in paths)
            if ONLY_THOSE_WHO_EVOLVE and not has_evo:
                continue

            base_name = s.get("name")
            if not base_name:
                continue

            # Collect unique stage names appearing in paths
            stage_names = []
            seen = set()
            for pth in paths:
                for nm in pth:
                    if nm not in seen:
                        seen.add(nm)
                        stage_names.append(nm)

            # Fetch mini assets for every stage (for your evolution mini-strip)
            stages = [pokemon_assets(nm, session) for nm in stage_names]
            for st in stages:
                if st.get("error"):
                    print(f"[WARN] Missing pokemon endpoint for: {st['name']}")


            base_entries.append({
                "base": base_name,
                "paths": paths,      # e.g. [["bulbasaur","ivysaur","venusaur"]] or branching paths
                "stages": stages,    # each has id/name/types/mini/image
            })

        out = {
            "meta": {
                "source": "pokeapi.co",
                "createdAt": time.strftime("%Y-%m-%d"),
                "onlyThoseWhoEvolve": ONLY_THOSE_WHO_EVOLVE,
                "pageSize": PAGE_SIZE,
                "count": len(base_entries),
                "notes": "paths contains all evolution paths; stages contains unique stage nodes with mini sprites.",
            },
            "bases": base_entries,
        }

        with open("base_index.json", "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)

        print(f"Wrote base_index.json with {len(base_entries)} base entries.")


if __name__ == "__main__":
    main()
