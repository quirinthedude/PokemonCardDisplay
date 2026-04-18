const MAX_POKEMONS = 341;
const BASE_URL = "https://pokeapi.co/api/v2/pokemon/";

// cachemaps:
const pokemonCache = new Map();
const typeCache = new Map();
const evolutionCache = new Map();

export async function loadBaseNames() {
  const response = await fetch("./json/base_names.json");
  const data = await response.json();

  const baseNames = data.bases ?? [];
  const maxPokemons = baseNames.length > 0 ? baseNames.length : MAX_POKEMONS;

  return { baseNames, maxPokemons };
}

export async function loadPokemonBatch({ startIndex, targetCount, baseNames, maxPokemons }) {
  const results = [];
  let currentIndex = startIndex;

  while (results.length < targetCount && currentIndex < maxPokemons) {
    const name = baseNames[currentIndex];

    try {
      const response = await fetch(BASE_URL + name);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${BASE_URL + name}`);
      }

      const pokemonData = await response.json();
      pokemonCache.set(name.toLowerCase(), pokemonData);
      results.push(pokemonData);
    } catch (error) {
      console.warn(`Skipped: ${name} - `, error);
    }

    currentIndex++;
  }

  return results;
}

export async function fetchPokemonData(name) {
  const cacheKey = name.toLowerCase();

  if (pokemonCache.has(cacheKey)) {
    return pokemonCache.get(cacheKey);
  }

  try {
    const response = await fetch(BASE_URL + name);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${BASE_URL + name}`);
    }

    const pokemonData = await response.json();
    pokemonCache.set(cacheKey, pokemonData);
    return pokemonData;
  } catch (error) {
    console.warn(`Skipped: ${name} - `, error);
    return null;
  }
}

export async function getTypeAttribute(typeUrl) {
  const cachedTypeData = checkTypeCache(typeUrl);
  if (cachedTypeData) return cachedTypeData;

  try {
    const response = await fetch(typeUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${typeUrl}`);
    }

    const data = await response.json();

    const typeData = {
      strongAgainst: data.damage_relations.double_damage_to,
      weakAgainst: data.damage_relations.double_damage_from,
    };

    typeCache.set(typeUrl, typeData);
    return typeData;
  } catch (error) {
    console.warn(`Failed to fetch type data from ${typeUrl} - `, error);
    return {
      strongAgainst: [],
      weakAgainst: [],
    };
  }
}

export async function getEvolutionData(pokemon) {
  const cacheKey = pokemon.name.toLowerCase();

  if (evolutionCache.has(cacheKey)) {
    return evolutionCache.get(cacheKey);
  }

  const evolutionEntries = await loadEvolutionChain(pokemon);
  const enrichedEvolutionData = await enrichEvolutionEntries(evolutionEntries);

  evolutionCache.set(cacheKey, enrichedEvolutionData);
  return enrichedEvolutionData;
}

async function loadEvolutionChain(pokemon) {
  if (!pokemon?.species?.url) return [];

  const speciesResponse = await fetch(pokemon.species.url);
  const speciesData = await speciesResponse.json();

  const evolutionUrl = speciesData?.evolution_chain?.url;
  if (!evolutionUrl) return [];

  const evolutionResponse = await fetch(evolutionUrl);
  const evolutionData = await evolutionResponse.json();

  return extractEvolutionEntries(evolutionData.chain);
}

async function enrichEvolutionEntries(entries) {
  const result = [];

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];

    const response = await fetch(BASE_URL + entry.name);
    const data = await response.json();

    result.push({
      name: entry.name,
      img:
        data.sprites?.other?.["official-artwork"]?.front_default ??
        data.sprites?.front_default ??
        "",
    });
  }

  return result;
}

function extractEvolutionEntries(chain) {
  const names = [];
  let current = chain;

  while (current) {
    names.push({
      name: current.species.name,
      speciesUrl: current.species.url,
    });

    current = current.evolves_to[0];
  }

  return names;
}

function checkTypeCache(typeUrl) {
  if (!typeUrl) {
    return {
      strongAgainst: [],
      weakAgainst: [],
    };
  }

  if (typeCache.has(typeUrl)) {
    return typeCache.get(typeUrl);
  }

  return null;
}

export async function loadAllPokemonNames() {
  const ALL_POKEMONS_LIMIT = 10000; // Arbitrary large number to ensure we get all Pokémon
  try {
    const response = await fetch(BASE_URL + "?limit=" + ALL_POKEMONS_LIMIT);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${BASE_URL}?limit=${ALL_POKEMONS_LIMIT}`);
    }

    const data = await response.json();
    return data.results.map((entry) => entry.name);
  } catch (error) {
    console.warn("Failed to load all Pokémon names - ", error);
    return [];
  }
}