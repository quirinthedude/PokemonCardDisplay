export function renderPokemons(pokeArray, pageSize) {
  const container = document.getElementById("pokemon-container");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < pageSize; i++) {
    const p = pokeArray[i];
    const card = document.createElement("div");
    card.classList.add("pokemon-card");

    if (!p) {
      arrayFallback(card, container);
      continue;
    }
    const { name, img } = pokemonImageDef(p);
    card.dataset.name = name;
    // not adding data-name ${name} directly into innerHTML, helps
    // making the flexitive to changes and easyfies handling
    const types = getTypeNames(p);
    const primaryType = getPrimaryType(types);
    card.dataset.type = primaryType;
    // HTML: data-type="{element=type}"
    const typeText = formatTypes(types);
    renderImage(card, name, img, types);
    container.appendChild(card);
  }
}

function arrayFallback(card, container) {
  card.classList.add("empty");
  card.textContent = "-";
  container.appendChild(card);
  // appends a node (element) as the last child of an element
  // here appends the wrapper
}

function pokemonImageDef(p) {
  const name = p.name ?? "unknown";
  const img =
    p.sprites?.other?.["official-artwork"]?.front_default ??
    p.sprites?.front_default ??
    "";
  return { name, img };
}

function renderImage(card, name, img, types) {
  card.innerHTML = `
    <div class="poke-img-wrap">
    ${img ? `<img src="${img}" alt="${name}">` : `<div class="img-placeholder"></div>`}
    </div>
    <div class="poke-name">${name}</div>
    <div class="poke-types">
      ${renderTypeIcons(types)}
    </div>
    `;
}

function renderTypeIcons(types) {
  console.log("types in renderImage:", types, Array.isArray(types));
  let html = "";

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    html += `
      <img
        class="type-icon"
        src="assets/types/${type}.png"
        alt="${type}"
        title="${type}"
      >
    `;
  }

  return html;
}

function getTypeNames(pokemon) {
  const types = [];

  if (!pokemon.types) return types;

  for (let i = 0; i < pokemon.types.length; i++) {
    types.push(pokemon.types[i].type.name);
  }

  return types;
}

function getPrimaryType(types) {
  if (types.length === 0) return "unknown";
  return types[0];
}

function formatTypes(types) {
  let text = "";

  for (let i = 0; i < types.length; i++) {
    const name = types[i];
    text += (i === 0 ? "" : " · ") + capitalize(name);
  }
  return text;
}

export function renderDialog(p) {
  const typesPanel = document.querySelector("#dialog-body .tab-types");
  const statsPanel = document.querySelector("#dialog-body .tab-stats");
  const evoPanel = document.querySelector("#dialog-body .tab-evo");
  if (!typesPanel || !statsPanel || !evoPanel) return;

  const types = getTypeNames(p);

  // Types Panel (dein Mock: Liste mit Icons)
  typesPanel.innerHTML = `
    <div class="pokemon-box">
      <div class="dialog-img">
        <img src="${getDialogImage(p)}" alt="${p.name}">
      </div>

      <div class="poke-info">
        <ul>
          ${types.map(t => `<li><img src="./assets/types/${t}.png" alt="${t}"> ${t}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;

  // Platzhalter erstmal
  // stats
  const stats = p.stats;
  
  statsPanel.innerHTML = `
    <ul class="pokemon-stats">
      ${stats.map(s => `
        <li>
          <strong>${capitalize(s.stat.name)}</strong>: ${s.base_stat}
        </li>
      `).join("")}
    </ul>
  `;
  // evolution
  evoPanel.innerHTML = `<p>Evolution coming soon…</p>`;
}

function getDialogImage(p) {
  return (
    p.sprites?.other?.["official-artwork"]?.front_default ??
    p.sprites?.front_default ??
    ""
  );
}

// helpers
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}