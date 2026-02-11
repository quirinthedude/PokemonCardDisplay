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
init();

// functions

async function init() {
  await loadBaseNames();
  await loadPokeDecade();
  renderPokemons();
}

function updateNavUI() {
  if (pokeCount === 0) LAST.classList.add("disabled");
  else LAST.classList.remove("disabled");

  const lastPageStart = Math.floor((maxPokemons - 1) / 10) * 10;
  //               cut floating point
  //  -> investigates last decade of the 341 Pokemons
  if (pokeCount >= lastPageStart) NEXT.classList.add("disabled");
  else NEXT.classList.remove("disabled");
}

// fetches
async function loadBaseNames() {
  const nameJSON = await fetch("/json/base_names.json");
  const data = await nameJSON.json();
  baseNames = data.bases;
  console.log(baseNames);
  maxPokemons = baseNames.length > 0 ? baseNames.length : MAX_POKEMONS;
}

async function loadPokeDecade() {
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
      pokeArray.push(actualPokemonData);
    } catch (err) {
      console.warn("Fetch failed:", err);
    }
  }
  console.log(pokeArray);
}

// actions
async function nextDecade() {
  if (pokeCount + 10 > maxPokemons) return;

  pokeCount += 10;
  await loadPokeDecade();
  renderPokemons();
  updateNavUI();
}

async function lastDecade() {
  if (pokeCount === 0) return;

  pokeCount -= 10;
  await loadPokeDecade();
  renderPokemons();
  updateNavUI();
}

async function initDecade() {
  pokeCount = 0;
  await loadPokeDecade();
  renderPokemons();
  updateNavUI();
}

// Rendering
function renderPokemons() {
  const container = document.getElementById("pokemon-container");
  if (!container) return;

  container.innerHTML = "";
  for (let pokeFrameIndex = 0; pokeFrameIndex < 10; pokeFrameIndex++) {
    const p = pokeArray[pokeFrameIndex];
    const card = document.createElement("div");
    //                  inserts element "div"
    // easy way to create a wrapper inside "pokemon-container"
    card.classList.add("pokemon-card");

    if (!p) {
      card.classList.add("empty");
      card.textContent = "-";
      container.appendChild(card);
      // appends a node (element) as the last child of an element
      // here appends the wrapper
      continue;
    }

    const name = p.name ?? "unknown";
    const img =
      p.sprites?.other?.["official-artwork"]?.front_default ??
      p.sprites?.front_default ??
      "";

    card.innerHTML = `
      <div class="poke-img-wrap">
      ${img ? `<img src="${img}" alt="${name}">` : `<div class="img-placeholder"></div>`}
      </div>
      <div class="poke-name">${name}</div>
    `;
    container.appendChild(card);
  }
}
