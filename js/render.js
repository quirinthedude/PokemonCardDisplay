export function renderPokemons(pokemonList, pageSize) {
  const container = document.getElementById("pokemon-container");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < pageSize; i++) {
    const pokemon = pokemonList[i];
    const card = createPokemonCard();

    if (!pokemon) {
      renderEmptyCard(card, container);
      continue;
    }
    renderPokemonCard(card, pokemon, container);
  }
}

function createPokemonCard() {
  const card = document.createElement("div");
  card.classList.add("pokemon-card");
  return card;
}

function renderPokemonCard(card, pokemon, container) {
  const { name, img } = getPokemonImageData(pokemon);
  const types = getTypeNames(pokemon);
  const mainType = types[0];

  card.dataset.name = name;
  card.dataset.type = mainType;

  renderImage(card, name, img, types);

  container.appendChild(card);
}

function renderEmptyCard(card, container) {
  card.classList.add("empty");
  card.textContent = "-";
  container.appendChild(card);
}

function getPokemonImageData(pokemon) {
  const name = pokemon.name ?? "unknown";
  const img =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ??
    pokemon.sprites?.front_default ??
    "";
  return { name, img };
}

function renderImage(card, name, img, types) {
  card.innerHTML = `
    <div class="poke-types">
    ${types
      .map(
        (t) =>
          `<span><img src="./assets/types/${t}.png" alt="${t}" title="${t}">${capitalize(t)}</span>`,
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
  const panels = getDialogPanels();
  if (!panels) return;

  const types = getTypeNames(pokemon);
  const mainType = types[0];
  const strongAgainst = typeAttributes.strongAgainst;
  const weakAgainst = typeAttributes.weakAgainst;
  const stats = pokemon.stats;

  panels.typesPanel.innerHTML = getTypesTemplate(
    pokemon,
    mainType,
    strongAgainst,
    weakAgainst,
  );
  panels.statsPanel.innerHTML = getStatsTemplate(stats, pokemon);
  panels.evoPanel.innerHTML = getEvolutionPlaceholderTemplate();
}

function getDialogPanels() {
  const typesPanel = document.querySelector("#dialog-body .tab-types");
  const statsPanel = document.querySelector("#dialog-body .tab-stats");
  const evoPanel = document.querySelector("#dialog-body .tab-evo");
  if (!typesPanel || !statsPanel || !evoPanel) return null;
  return { typesPanel, statsPanel, evoPanel };
}

function getEvolutionPlaceholderTemplate() {
  return `<p>Evolution coming soon…</p>`;
}

function getStatsTemplate(stats, pokemon) {
  return `
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
}

function getTypesTemplate(pokemon, mainType, strongAgainst, weakAgainst) {
  return `
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
          ${strongAgainst
            .map(
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
          ${weakAgainst
            .map(
              (t) => `
            <li>
              <img src="./assets/types/${t.name}.png" alt="${t.name}" title="${t.name}">
              <strong>${capitalize(t.name)}</strong>
             </li>
          `,
            )
            .join("")}
        </ul>
      </div>
    </div>
  `;
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

  const html = getEvolutionTemplate(evoData);

  evoPanel.innerHTML = html;
}

function getEvolutionTemplate(evoData) {
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
  return html;
}

// helpers
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
