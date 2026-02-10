// variables, constants

let pokeCount = 0;
let pokeArray = [];
let baseNames = [];
let maxPokemons;
const NEXT = document.getElementById("next-btn");
const LAST = document.getElementById("last-btn");
const START = document.getElementById("poke-btn");
const MAX_POKEMONS = 341;
const BASE_URL = "https://pokeapi.co/api/v2/pokemon/";
// imports

// eventlisteners
NEXT.addEventListener("click", function () {
  if (NEXT.classList.contains("disabled")) return;
  nextDecade();
});
LAST.addEventListener("click", function () {
  if (LAST.classList.contains("disabled")) return;
  lastDecade();
});
START.addEventListener("click", initDecade);

// init
LAST.classList.add("disabled");

// main part
init()

// functions

async function init() {
  await loadBaseNames();
  await loadPokeDecade();
  await renderPokemons();
}

// fetches
async function loadBaseNames() {
  const nameJSON = await fetch("/json/base_names.json");
  const data = await nameJSON.json();
  baseNames = data.bases;
  console.log(baseNames);
  maxPokemons = baseNames.length ?? MAX_POKEMONS;
}

async function loadPokeDecade() {
  //name der Datenbank pokeindex
  let pokeCountEnd = 0;
  if (pokeCount + 9 > maxPokemons) {
    pokeCountEnd = maxPokemons - 1;
  } else {
    pokeCountEnd = pokeCount + 9;
  }
  pokeArray = [];
  for (
    let pokemonIndex = pokeCount;
    pokemonIndex <= pokeCountEnd;
    pokemonIndex++
  ) {
    const actualPokemon = baseNames[pokemonIndex];
    try {
      let response = await fetch(BASE_URL + actualPokemon);
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} for ${BASE_URL + actualPokemon}`,
        );
      }

      let actualPokemonData = await response.json();
      console.log(actualPokemonData);
      pokeArray.push(actualPokemonData);
    } catch (err) {
      console.warn("Fetch failed:", err);
    }
  }


}

// actions
function nextDecade() {
  if (pokeCount + 10 > MAX_POKEMONS) {
    NEXT.classList.add("disabled");
  } else {
    NEXT.classList.remove("disabled");
    pokeCount += 10;
  }
}

function lastDecade() {
  if (pokeCount === 0) {
    LAST.classList.add("disabled");
  } else {
    LAST.classList.remove("disabled");
    pokeCount -= 10;
  }
}

function initDecade() {
  pokeCount = 0;
  LAST.classList.add("disabled");
}

// Rendering
function renderPokemons() {
  // Rendername
  // Renderimg
}
