// variables, constants

let pokeCount = 0;
let pokeArray = [];
let baseNames = [];
let maxPokemons;
let next; //  document.getElementById("next-btn")
let last; // document.getElementById("last-btn")
let start; // document.getElementById("poke-btn") all done in bindUI()
let searchInput;
const MAX_POKEMONS = 341;
const PAGE_SIZE = 20;
const BASE_URL = "https://pokeapi.co/api/v2/pokemon/";
// imports
import { renderPokemons } from "./render.js";

// eventlisteners

window.addEventListener("DOMContentLoaded", init);

// functions

async function init() {
  bindUI();
  await loadBaseNames();
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  updateNavUI();
}

function bindUI() {
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
    // searchInput.addEventListener("input", handlesearch);
  }
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
  console.log(baseNames);
  maxPokemons = baseNames.length > 0 ? baseNames.length : MAX_POKEMONS;
}

async function loadPokemonBatch({ startIndex, targetCount }) {
  // option object, a starting point for maybe more parameters
  // -> nice candidate for a representing project
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
    targetCount: PAGE_SIZE
  });
  console.log(pokeArray);
}

// actions
async function nextPokemons() {
  if (pokeCount + PAGE_SIZE >= maxPokemons) return;

  pokeCount += PAGE_SIZE;
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  updateNavUI();
}

async function lastPokemons() {
  if (pokeCount === 0) return;

  pokeCount -= PAGE_SIZE;
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  updateNavUI();
}

async function initPokemons() {
  pokeCount = 0;
  await loadPokemons();
  renderPokemons(pokeArray, PAGE_SIZE);
  updateNavUI();
}

function bindCardClicks() {
  const container = document.getElementById("pokemon-container");
  if (!container) return;

  container.addEventListener("click", function(e) {
    const card = e.target.closest(".pokemon-card");
    if(!card) return;
    if (card.classList.contains("empty")) return;

    const name = card.dataset.name;
    if (!name) return;

    console.log("card click", name);
    openDialog(name);
  });
}

function openDialog(name) {

}

function initDialogTabs() {
  const tabButtons = document.querySelectorAll("#dialog-tabs button");
  const tabPanels = document.querySelectorAll("#dialog-body .tab");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab;
      tabButtons.forEach(btn => btn.classList.remove("is-active"));
      tabPanels.forEach(panel => panel.classList.remove("is-active"));
      button.classList.add("is-active");
      // activate fitting panel
      const activePanel = document.querySelector(".tab-" + tabName);
      if (activePanel) {
        activePanel.classList.add("is-active");
      }
    });
  });
}

// main procedure
initDialogTabs();