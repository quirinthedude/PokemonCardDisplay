// variables, constants

let pokeCount = 0;
let pokeArray = [];
let baseNames = [];
let maxPokemons;
let next; //  document.getElementById("next-btn")
let last; // document.getElementById("last-btn")
let start; // document.getElementById("poke-btn") all done in bindUI()
let searchInput;
let autocompleteDropdown;

const MAX_POKEMONS = 341;
const PAGE_SIZE = 20;
const BASE_URL = "https://pokeapi.co/api/v2/pokemon/";
// cachemaps:
const pokemonCache = new Map();
const typeCache = new Map();
const evolutionCache = new Map();
// The Map object holds key-value pairs and remembers the original insertion order of the keys.
// Any value (both objects and primitive values) may be used as either a key or a value.

// imports
import { renderPokemons, renderDialog, renderEvolution } from "./render.js";

// eventlisteners

window.addEventListener("DOMContentLoaded", init);

// functions

async function init() {
  showLoading();
  bindUI();
  initDialogTabs();
  initDialogNavigation();
  await loadBaseNames();
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  initDialogClose();
  initDialogKeyboard();
  updateNavUI();
  hideLoading();
}

function bindUI() {
  autocompleteDropdown = document.querySelector(".autocomplete-dropdown");
  next = document.getElementById("next-btn");
  last = document.getElementById("last-btn");
  start = document.getElementById("poke-btn");
  searchInput = document.querySelector(".search-input");

  next.addEventListener("click", function () {
    if (next.classList.contains("disabled")) return;
    nextPokemons();
  });
  last.addEventListener("click", function () {
    if (last.classList.contains("disabled")) return;
    lastPokemons();
  });
  start.addEventListener("click", initPokemons);

  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("keydown", handleSearchKeydown);
  }
  document.addEventListener("click", handleOutsideClick);
  bindCardClicks();
}

function updateNavUI() {
  if (pokeCount === 0) last.classList.add("disabled");
  else last.classList.remove("disabled");

  const lastPageStart = Math.floor((maxPokemons - 1) / PAGE_SIZE) * PAGE_SIZE;
  //               cut floating point
  //  -> investigates last row of the 341 Pokemons
  if (pokeCount >= lastPageStart) next.classList.add("disabled");
  else next.classList.remove("disabled");
}

// fetches
async function loadBaseNames() {
  const nameJSON = await fetch("./json/base_names.json");
  const data = await nameJSON.json();
  baseNames = data.bases;
  maxPokemons = baseNames.length > 0 ? baseNames.length : MAX_POKEMONS;
}

async function loadPokemonBatch({ startIndex, targetCount }) {
  const results = [];
  // array for pokemon data
  let i = startIndex;

  while (results.length < targetCount && i < maxPokemons) {
    const name = baseNames[i];

    try {
      const response = await fetch(BASE_URL + name);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${BASE_URL + name}`);
      }

      const data = await response.json();
      pokemonCache.set(name.toLowerCase(), data); // store in cache
      results.push(data);
    } catch (err) {
      console.warn(`Skipped: ${name} - `, err);
    }

    i++;
  }

  return results;
}

async function loadPokemons() {
  pokeArray = await loadPokemonBatch({
    startIndex: pokeCount,
    targetCount: PAGE_SIZE,
  });
}

async function loadEvolutionChain(p) {
  if (!p?.species?.url) return []; // handshake p.species.url
  //                  otherwise return empty array

  const speciesResponse = await fetch(p.species.url);
  const speciesData = await speciesResponse.json();

  const evoUrl = speciesData?.evolution_chain?.url;
  if (!evoUrl) return []; // again handshake-fallback

  const evoResponse = await fetch(evoUrl);
  const evoData = await evoResponse.json();

  return extractEvolutionEntries(evoData.chain);
}

async function enrichEvolutionEntries(entries) {
  const result = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

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

async function fetchPokemonData(name) {
  const cacheKey = name.toLowerCase();
  console.log("POKECACHE HIT: ", cacheKey);
  if (pokemonCache.has(cacheKey)) {
    // check cache first
    return pokemonCache.get(cacheKey); // return cached data if found
  }
  // Fetch the Pokemon if not in pokeArray (using similar logic to loadPokemonBatch)
  try {
    const response = await fetch(BASE_URL + name);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${BASE_URL + name}`);
    }

    const pokemonData = await response.json();
    pokemonCache.set(cacheKey, pokemonData); // store in cache
    return pokemonData;
  } catch (err) {
    console.warn(`Skipped: ${name} - `, err);
    return null; // Don't show dialog if fetch fails
  }
}

async function getTypeAttribute(typeUrl) {
  const cached = checkTypeCache(typeUrl); // check cache before fetching
  if (cached) return cached;

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

    typeCache.set(typeUrl, typeData); // store in cache
    return typeData;
  } catch (err) {
    console.warn(`Failed to fetch type data from ${typeUrl} - `, err);
    return {
      strongAgainst: [],
      weakAgainst: [],
    }; // fallback to empty arrays
  }
}

async function getEvolutiondata(p) {
  const cacheKey = p.name.toLowerCase();
  if (evolutionCache.has(cacheKey)) {
    return evolutionCache.get(cacheKey);
  }

  const evoEntries = await loadEvolutionChain(p);
  const enrichedEvoData = await enrichEvolutionEntries(evoEntries);

  evolutionCache.set(cacheKey, enrichedEvoData);
  return enrichedEvoData;
}
// actions
async function nextPokemons() {
  showLoading();
  if (pokeCount + PAGE_SIZE >= maxPokemons) return;

  pokeCount += PAGE_SIZE;
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  updateNavUI();
  hideLoading();
}

async function lastPokemons() {
  showLoading();
  if (pokeCount === 0) return;

  pokeCount -= PAGE_SIZE;
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  updateNavUI();
  hideLoading();
}

async function initPokemons() {
  showLoading();
  pokeCount = 0;
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  updateNavUI();
  hideLoading();
}

function bindCardClicks() {
  const container = document.getElementById("pokemon-container");
  if (!container) return;

  container.addEventListener("click", function (e) {
    const card = e.target.closest(".pokemon-card");
    if (!card) return;
    if (card.classList.contains("empty")) return;

    const name = card.dataset.name;
    if (!name) return;
    openDialog(name);
  });
}

async function openDialog(name) {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  showLoading();

  try {
    await updateDialogContent(name);
    if (!dialog.open) {
      dialog.showModal();
      dialog.focus(); // ensure dialog itself gets focus for keyboard navigation  
      const closeBtn = document.getElementById("dialog-close");
      if (closeBtn) closeBtn.focus();
    }
  } finally {
    hideLoading();
  }
}

function initDialogTabs() {
  const tabs = document.getElementById("dialog-tabs");
  const body = document.getElementById("dialog-body");
  if (!tabs || !body) return;

  if (tabs.dataset.bound === "1") return;
  tabs.dataset.bound = "1";

  tabs.addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-tab]");
    if (!btn) return;

    const tabName = btn.dataset.tab;

    tabs.querySelectorAll("button[data-tab]").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
    });
    body.querySelectorAll(".tab").forEach(function (panel) {
      panel.classList.toggle(
        "is-active",
        panel.classList.contains("tab-" + tabName),
      );
    });
  });
}

function initDialogNavigation() {
  const prevBtn = document.getElementById("dialog-prev");
  const nextBtn = document.getElementById("dialog-next");

  if (!prevBtn || !nextBtn) return;

  prevBtn.addEventListener("click", () => navigateDialog(-1));
  nextBtn.addEventListener("click", () => navigateDialog(1));
}

async function navigateDialog(direction) {
  const title = document.getElementById("dialog-title");
  if (!title) return;

  const currentName = title.textContent.toLowerCase();
  const index = pokeArray.findIndex((p) => p.name === currentName);
  if (index === -1) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= pokeArray.length) return;

  const newPokemon = pokeArray[newIndex];
  if (!newPokemon) return;

  showLoading();

  try {
    await updateDialogContent(newPokemon.name);
  } finally {
    hideLoading();
  } // ensures loading state is cleared even if updateDialogContent fails
}

function updateDialogNav(currentName) {
  const prevBtn = document.getElementById("dialog-prev");
  const nextBtn = document.getElementById("dialog-next");

  if (!prevBtn || !nextBtn) return;

  const index = pokeArray.findIndex(
    (p) => p.name === currentName.toLowerCase(),
  );

  prevBtn.classList.toggle("disabled", index <= 0); // disable if first
  nextBtn.classList.toggle("disabled", index >= pokeArray.length - 1); // disable if last
}

async function updateDialogContent(name) {
  const title = document.getElementById("dialog-title"); // pokemon name in dialog
  if (title) {
    title.textContent = capitalize(name);
  }

  let p = pokeArray.find(function (pokemon) {
    // find pokemon in pokeArray
    return pokemon?.name === name; // handshake pokemon.name
  });

  if (!p) {
    p = await fetchPokemonData(name); // fetch if not found in pokeArray (eg from search)
  }
  if (!p) return; // if still not found, exit

  console.log("POKECACHE HIT: ", name);
  const mainTypeUrl = p.types?.[0]?.type?.url; // handshake p.types[0].type.url
  const typeAttributes = await getTypeAttribute(mainTypeUrl); // get type attributes (strong/weak) for main type
  renderDialog(p, typeAttributes);

  const evoDisplayData = await getEvolutiondata(p); // get evolution data for pokemon
  renderEvolution(evoDisplayData);

  updateDialogNav(name); // update dialog navigation buttons based on current pokemon index
}

function initDialogClose() {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  dialog.addEventListener("click", handleDialogOutsideClick);
}

function initDialogKeyboard() {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault(); // prevent default scrolling behavior 
      navigateDialog(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateDialog(1);
    }
  });
}

function handleDialogOutsideClick(event) {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  dialog.addEventListener("click", function (event) {
    const rect = dialog.getBoundingClientRect(); // get dialog position and size

    const clickedInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!clickedInside) {
      dialog.close(); // close dialog if click was outside
    }
  });
}

function handleSearchInput() {
  const query = searchInput.value.trim().toLowerCase(); // easier to compare
  const dropdown = autocompleteDropdown;

  if (!dropdown || !searchInput) return;
  dropdown.innerHTML = "";

  if (query.length >= 3) {
    const suggestions = baseNames
      .filter((name) => name.toLowerCase().startsWith(query))
      .slice(0, 10);

    if (suggestions.length > 0) {
      searchInput.classList.add("dropdown-open"); // border-bottom none + radius
      // -> only if suggestions, otherwise looks weird with empty dropdown

      const ul = document.createElement("ul");

      suggestions.forEach((name) => {
        const li = document.createElement("li");
        li.textContent = capitalize(name);
        li.addEventListener("click", () => selectSuggestion(name));
        ul.appendChild(li); // add click listener to each suggestion
      });

      dropdown.appendChild(ul); // add suggestions to dropdown
      dropdown.style.display = "block";
      return; // exit early if suggestions found
    }
  }

  dropdown.style.display = "none"; // hide dropdown if no suggestions
  searchInput.classList.remove("dropdown-open");
}

function performSearch(query) {
  const pokemon = baseNames.find(function (name) {
    return name.toLowerCase() === query.toLowerCase();
  });
  if (pokemon) {
    openDialog(pokemon);
  } else {
    alert("No Pokémon found with that name.");
  } 
}

function selectSuggestion(name) {
  searchInput.value = name; // set input to selected name
  autocompleteDropdown.style.display = "none"; // hide dropdown
  performSearch(name); // trigger search action
}

function handleSearchKeydown(event) {
  if (event.key === "Enter") {
    const query = searchInput.value.trim();
    autocompleteDropdown.style.display = "none"; // hide dropdown on enter
    if (query) {
      performSearch(query);
    }
  }
}

function handleOutsideClick(event) {
  if (
    !searchInput.contains(event.target) &&
    !autocompleteDropdown.contains(event.target)
  ) {
    autocompleteDropdown.style.display = "none"; // hide dropdown if click outside
  }
}

// helpers
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
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

  return null; // not found in cache
}

function showLoading() {
  document.getElementById("loading-overlay").classList.add("active");
}

function hideLoading() {
  document.getElementById("loading-overlay").classList.remove("active");
}
