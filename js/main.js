// variables, constants (global state)

let currentPageStart = 0;
let currentPagePokemon = [];
let baseNames = [];
let maxPokemons;
let nextButton;
let prevButton;
let homeButton;
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
import { initSearchBar } from "./searchbar.js"; 


// eventlisteners
window.addEventListener("DOMContentLoaded", init);

// ==========================
// INIT / SETUP
// ==========================

async function init() {
  showLoading();
  bindUI();
  initSearchBar({
    searchInput,
    autocompleteDropdown,
    getBaseNames: () => baseNames,
    openDialog,
  });
  initDialogTabs();
  initDialogNavigation();

  const baseData = await loadBaseNames();
  baseNames = baseData.baseNames;
  maxPokemons = baseData.maxPokemons;

  await loadPokemons();
  renderPokemons(currentPagePokemon, PAGE_SIZE);
  initDialogClose();
  initDialogCloseButton();
  initDialogKeyboard();
  initDialogStateSync();
  updateNavUI();
  hideLoading();
}

function bindUI() {
  cacheUIElements();
  bindNavigationButtons();
  bindCardClicks();
}

function cacheUIElements() {
  autocompleteDropdown = document.querySelector(".autocomplete-dropdown");
  nextButton = document.getElementById("next-btn");
  prevButton = document.getElementById("last-btn");
  homeButton = document.getElementById("poke-btn");
  searchInput = document.querySelector(".search-input");
}

function bindNavigationButtons() {
  nextButton.addEventListener("click", function () {
    if (nextButton.classList.contains("disabled")) return;
    nextPokemons();
  });

  prevButton.addEventListener("click", function () {
    if (prevButton.classList.contains("disabled")) return;
    lastPokemons();
  });

  homeButton.addEventListener("click", function () {
    if (homeButton.classList.contains("disabled")) return;
    initPokemons();
  });
}

function bindSearchInput() {
  if (!searchInput) return;

  searchInput.addEventListener("input", handleSearchInput);
  searchInput.addEventListener("keydown", handleSearchKeydown);
}

function updateNavUI() {
  if (currentPageStart === 0) prevButton.classList.add("disabled");
  else prevButton.classList.remove("disabled");

  const lastPageStart = Math.floor((maxPokemons - 1) / PAGE_SIZE) * PAGE_SIZE;

  if (currentPageStart >= lastPageStart) nextButton.classList.add("disabled");
  else nextButton.classList.remove("disabled");
}

async function loadPokemons() {
  currentPagePokemon = await loadPokemonBatch({
    startIndex: currentPageStart,
    targetCount: PAGE_SIZE,
    baseNames,
    maxPokemons,
  });
}

function inittDialogStateSync() {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  dialog.addEventListener("close", function () {
    document.body.classList.remove("no-scroll");
  });
}

// ==========================
// PAGE ACTIONS
// ==========================

async function nextPokemons() {
  if (currentPageStart + PAGE_SIZE >= maxPokemons) return;

  showLoading();
  currentPageStart += PAGE_SIZE;
  await loadPokemons();
  renderPokemons(currentPagePokemon, PAGE_SIZE);
  updateNavUI();
  hideLoading();
}

async function lastPokemons() {
  if (currentPageStart === 0) return;

  showLoading();
  currentPageStart -= PAGE_SIZE;
  await loadPokemons();
  renderPokemons(currentPagePokemon, PAGE_SIZE);
  updateNavUI();
  hideLoading();
}

async function initPokemons() {
  showLoading();
  currentPageStart = 0;
  await loadPokemons();
  renderPokemons(currentPagePokemon, PAGE_SIZE);
  updateNavUI();
  hideLoading();
}

// ==========================
// CARD + DIALOG FLOW
// ==========================

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
      document.body.classList.add("no-scroll");
      dialog.focus();
      const closeBtn = document.getElementById("dialog-close");
      if (closeBtn) closeBtn.focus();
    }
  } finally {
    hideLoading();
  }
}

async function updateDialogContent(name) {
  setDialogTitle(name);

  const pokemon = await findPokemonForDialog(name);
  if (!pokemon) return;

  await renderDialogViews(pokemon);
  updateDialogNav(name);
}

async function findPokemonForDialog(name) {
  let pokemon = currentPagePokemon.find(function (entry) {
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

function updateDialogNav(currentName) {
  const prevBtn = document.getElementById("dialog-prev");
  const nextBtn = document.getElementById("dialog-next");

  if (!prevBtn || !nextBtn) return;

  const index = currentPagePokemon.findIndex(
    (pokemon) => pokemon.name === currentName.toLowerCase(),
  );

  prevBtn.classList.toggle("disabled", index <= 0);
  nextBtn.classList.toggle("disabled", index >= currentPagePokemon.length - 1);
}

function initDialogTabs() {
  const tabs = document.getElementById("dialog-tabs");
  const body = document.getElementById("dialog-body");

  if (!tabs || !body) return;
  if (tabs.dataset.bound === "1") return;

  tabs.dataset.bound = "1";

  tabs.addEventListener("click", function (event) {
    handleDialogTabClick(event, tabs, body);
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

  const newPokemon = getDialogTargetPokemon(direction);
  if (!newPokemon) return;

  showLoading();

  try {
    await updateDialogContent(newPokemon.name);
  } finally {
    hideLoading();
  }
}

function getDialogTargetPokemon(direction) {
    const title = document.getElementById("dialog-title");
  if (!title) return;

  const currentName = title.textContent.toLowerCase();
  const index = currentPagePokemon.findIndex(
    (pokemon) => pokemon.name === currentName,
  );
  if (index === -1) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= currentPagePokemon.length) return;

  return currentPagePokemon[newIndex];
}

function initDialogClose() {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  dialog.addEventListener("click", handleDialogOutsideClick);
}

function initDialogCloseButton() {
  const closeBtn = document.getElementById("dialog-close");
  if (!closeBtn) return;

  closeBtn.addEventListener("click", function () {
    document.body.classList.remove("no-scroll");
  });
}

function initDialogKeyboard() {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
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
    closeDialog();
  }
}

function initDialogStateSync() {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  dialog.addEventListener("close", function () {
    document.body.classList.remove("no-scroll");
  });
}

function closeDialog() {
  const dialog = document.getElementById("lightbox");
  if (!dialog || !dialog.open) return;
  dialog.close();
  document.body.classList.remove("no-scroll");
}


// ==========================
// DIALOG TAB HELPERS
// ==========================

function handleDialogTabClick(event, tabs, body) {
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

// ==========================
// HELPERS
// ==========================

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
  if (nextButton) nextButton.classList.toggle("disabled", state);
  if (prevButton) prevButton.classList.toggle("disabled", state);
  if (homeButton) homeButton.classList.toggle("disabled", state);
}

function setDialogTitle(name) {
  const title = document.getElementById("dialog-title");
  if (!title) return;
  title.textContent = capitalize(name);
}
