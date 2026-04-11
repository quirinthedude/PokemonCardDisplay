export function renderPokemons(pokemonList, pageSize) {
  const container = document.getElementById("pokemon-container");
  
  // fallback
  if (!container) return;

  // clear previous render
  container.innerHTML = "";

  for (let i = 0; i < pageSize; i++) {
    const pokemon = pokemonList[i];

    // create a DOM node <div> which represents a single pokemon card
    const card = document.createElement("div");
    card.classList.add("pokemon-card");

    if (!pokemon) {
      renderEmptyCard(card, container);
      continue;
    }

    const { name, img } = getPokemonImageData(pokemon);
    const types = getTypeNames(pokemon);
    const mainType = types[0];

    // attach pokemon name as dataset attribute
    // and type for styling, eg: <div data-name="bulbasaur" data-type="grass">
    card.dataset.name = name;
    card.dataset.type = mainType;

    // render inner structure (image + name)
    renderImage(card, name, img, types);

    // appendChild inserts the node into the DOM tree,
    // making the card visible in the container
    container.appendChild(card);
  }
}

function renderEmptyCard(card, container) {
  card.classList.add("empty");
  card.textContent = "-";
  container.appendChild(card);
  // appends a node (element) as the last child of an element
  // here appends the wrapper
}

function getPokemonImageData(pokemon) {
  const name = pokemon.name ?? "unknown";
  // fallback if there is no name in the API, eg empty array
  const img =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ??
    pokemon.sprites?.front_default ??
    ""; // make sure there is no undefined (stability)
  return { name, img };
}

function renderImage(card, name, img, types) {
  card.innerHTML = `
    <div class="poke-types">
    ${types
      .map(
        (t) => 
          `<span><img src="./assets/types/${t}.png" alt="${t}" title="${t}">${capitalize(t)}</span>`
      )
      .join("")}
    </div>

    <div class="poke-img-wrap">
    ${
      img 
      ? `<img src="${img}" alt="${name}">` 
      : `<div class="img-placeholder"></div>`
    }
    </div>
    <div class="poke-name">${capitalize(name)}</div>
    `;
}

function getTypeNames(pokemon) {
  const types = [];

  if (!pokemon.types) return types;

  for (let i = 0; i < pokemon.types.length; i++) {
    types.push(pokemon.types[i].type.name);
  }

  return types;
}

export function renderDialog(pokemon, typeAttributes) {
  const typesPanel = document.querySelector("#dialog-body .tab-types");
  const statsPanel = document.querySelector("#dialog-body .tab-stats");
  const evoPanel = document.querySelector("#dialog-body .tab-evo");
  if (!typesPanel || !statsPanel || !evoPanel) return;

  const types = getTypeNames(pokemon);
  const mainType = types[0];
  const strongAgainst = typeAttributes.strongAgainst;;
  const weakAgainst = typeAttributes.weakAgainst;

  // about Panel (dein Mock: Liste mit Icons)
  typesPanel.innerHTML = `
    <div class="pokemon-box">
      <div class="dialog-img">
        <img src="${getDialogImage(pokemon)}" alt="${pokemon.name}">
      </div>

      <div class="poke-info">
        <h2>Main-Type:</h2>
        <ul>
          <li>
            <img src="./assets/types/${mainType}.png" alt="${mainType}" title="${mainType}">
            <strong>${capitalize(mainType)}</strong>
          </li>
        </ul>

        <h3>Strong Against:</h3>
        <ul>
          ${strongAgainst.
            map(
              (t) => `
            <li>
              <img src="./assets/types/${t.name}.png" alt="${t.name}" title="${t.name}">
              <strong>${capitalize(t.name)}</strong>
            </li>
          `,
            )
            .join("")}
        </ul>
        
        <h3>Weak Against:</h3>
        <ul>
          ${weakAgainst.
            map(
              (t) => `
            <li>
              <img src="./assets/types/${t.name}.png" alt="${t.name}" title="${t.name}">
              <strong>${capitalize(t.name)}</strong>
             </li>
          `,
            )
            .join("") 
          }
          </li>
        </ul>
      </div>
    </div>
  `;

  // stats
  const stats = pokemon.stats;

  statsPanel.innerHTML = `
    <div class="pokemon-box">
      <div class="dialog-img">
        <img src="${getDialogImage(pokemon)}" alt="${pokemon.name}">
      </div>
      <div class="poke-info">
        <h2>Stats</h2>
        <ul class="pokemon-stats">
          ${stats
            .map(
              (s) => `
           <li>
             <strong>${capitalize(s.stat.name)}</strong>: ${s.base_stat}
           </li>
          `,
            )
            .join("")}
        </ul>
    </div>
  </div>

  `;
  // evolution
  evoPanel.innerHTML = `<p>Evolution coming soon…</p>`;
}

function getDialogImage(pokemon) {
  return (
    pokemon.sprites?.other?.["official-artwork"]?.front_default ??
    pokemon.sprites?.front_default ??
    ""
  );
}

export function renderEvolution(evoData) {
  const evoPanel = document.querySelector("#dialog-body .tab-evo");
  if (!evoPanel) return;

  let html = '<div class="evo-chain">';

  evoData.forEach(function (pokemon, index) {
    html += `
      <div class="evo-stage">
        <img src="${pokemon.img}" alt="${pokemon.name}">
        <p>${capitalize(pokemon.name)}</p>
      </div>
    `;
    if (index < evoData.length - 1) {
      html += `<div class="evo-arrow">→</div>`;
    }
  });

  html += "</div>";

  evoPanel.innerHTML = html;
}

// helpers
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
