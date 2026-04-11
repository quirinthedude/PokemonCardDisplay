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

  tabs.addEventListener("click", function (event) {
    handdleDialogTabClick(event, tabs, body);
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
  setDialogTitle(name);

  const pokemon = await findPokemonForDialog(name);
  if (!pokemon) return; // if pokemon not found, exit

  await renderDialogViews(pokemon);
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
  if (!autocompleteDropdown || !searchInput) return; // safety check

  const query = searchInput.value.trim().toLowerCase();
  autocompleteDropdown.innerHTML = ""; // clear previous suggestions

  if (query.length < 3) {
    hideSuggestions();
    return;
  }

  const suggestions = getSearchSuggestions(query);

  if (suggestions.length === 0) {
    hideSuggestions();
    return;
  }
  renderSuggestions(suggestions);
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

function setDialogTitle(name) {
  const title = document.getElementById("dialog-title");
  if (!title) return;
  title.textContent = capitalize(name);
}

async function findPokemonForDialog(name) {
  let pokemon = pokeArray.find(function (entry) {
    return entry?.name === name;
  });

  if (pokemon) return pokemon;

  pokemon = await fetchPokemonData(name);
  return pokemon;
}

async function renderDialogViews(pokemon) {
  const mainTypeUrl = pokemon.types?.[0]?.type?.url;
  const typeAttributes = await getTypeAttribute(mainTypeUrl);
  renderDialog(pokemon, typeAttributes);

  const evolutionDisplayData = await getEvolutionData(pokemon);
  renderEvolution(evolutionDisplayData);
}

function getSearchSuggestions(query) {
  return baseNames
    .filter(function (name) {
      return name.toLowerCase().startsWith(query.toLowerCase());
    })
    .slice(0, 10);
}

function renderSuggestions(suggestions) {
  const suggsestionList = document.createElement("ul");

  suggestions.forEach(function (name) {
    const suggestionItem = document.createElement("li");
    suggestionItem.textContent = capitalize(name);
    suggestionItem.addEventListener("click", function () {
      selectSuggestion(name);
    });
    suggsestionList.appendChild(suggestionItem);
  });

  autocompleteDropdown.appendChild(suggsestionList);
  autocompleteDropdown.style.display = "block";
  searchInput.classList.add("dropdown-open");
}

function hideSuggestions() {
  autocompleteDropdown.style.display = "none";
  searchInput.classList.remove("dropdown-open");
}

function handdleDialogTabClick(event, tabs, body) {
  const clickedTabButton = event.target.closest("button[data-tab]");
  if (!clickedTabButton) return;

  const tabName = clickedTabButton.dataset.tab;
  updateActiveTabButton(tabs, clickedTabButton);
  updateActiveTabPanel(body, tabName);
}

function updateActiveTabButton(tabs, activeButton) {
  tabs.querySelectorAll("button[data-tab]").forEach(function (tabButton) {
    tabButton.classList.toggle("is-active", tabButton === activeButton);
  });
}

function updateActiveTabPanel(body, tabName) {
  body.querySelectorAll(".tab").forEach(function (panel) {
    panel.classList.toggle(
      "is-active",
      panel.classList.contains("tab-" + tabName),
    );
  });
}
