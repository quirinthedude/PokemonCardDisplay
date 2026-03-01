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
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    text += (i === 0 ? "" : " · ") + capitalized;
  }
  return text;
}
