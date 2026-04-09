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

const PAGE_SIZE = 20;

// imports
import { renderPokemons, renderDialog, renderEvolution } from "./render.js";
import {
  loadBaseNames,
  loadPokemonBatch,
  fetchPokemonData,
  getTypeAttribute,
  getEvolutionData,
} from "./fetches.js";
// eventlisteners

window.addEventListener("DOMContentLoaded", init);

// functions

async function init() {
  showLoading();
  bindUI();
  initDialogTabs();
  initDialogNavigation();

  const baseData = await loadBaseNames();
  baseNames = baseData.baseNames;
  maxPokemons = baseData.maxPokemons;

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
  start.addEventListener("click", function () {
    if (start.classList.contains("disabled")) return;
    initPokemons();
  });

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

async function loadPokemons() {
  pokeArray = await loadPokemonBatch({
    startIndex: pokeCount,
    targetCount: PAGE_SIZE,
    baseNames,
    maxPokemons,
  });
}

// actions
async function nextPokemons() {
  if (pokeCount + PAGE_SIZE >= maxPokemons) return;

  showLoading();
  pokeCount += PAGE_SIZE;
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  updateNavUI();
  hideLoading();
}

async function lastPokemons() {
  if (pokeCount === 0) return;

  showLoading();
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

  let pokemon = pokeArray.find(function (entry) {
    // find pokemon in pokeArray
    return entry?.name === name; // handshake pokemon.name
  });

  if (!pokemon) {
    pokemon = await fetchPokemonData(name); // fetch if not found in pokeArray (eg from search)
  }
  if (!pokemon) return; // if still not found, exit

  const mainTypeUrl = pokemon.types?.[0]?.type?.url; // handshake p.types[0].type.url
  const typeAttributes = await getTypeAttribute(mainTypeUrl); // get type attributes (strong/weak) for main type
  
  renderDialog(pokemon, typeAttributes);

  const evoDisplayData = await getEvolutionData(pokemon); // get evolution data for pokemon
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
  if (!dialog || !dialog.open) return;

  if (event.target === dialog) {
    dialog.close(); // close dialog if click was on backdrop (dialog itself)
  }
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

function showLoading() {
  document.getElementById("loading-overlay").classList.add("active");
  setNavDisabled(true);
}

function hideLoading() {
  document.getElementById("loading-overlay").classList.remove("active");
  setNavDisabled(false);
}

function setNavDisabled(state) {
  if (next) next.classList.toggle("disabled", state);
  if (last) last.classList.toggle("disabled", state);
  if (start) start.classList.toggle("disabled", state);
}
