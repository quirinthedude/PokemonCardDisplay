// ==========================
// SEARCH / AUTOCOMPLETE
// ==========================

let searchInput;
let autocompleteDropdown;
let getBaseNames;
let openDialog;

export function initSearchBar(config) {
  // set her Eventlisteners, working intern with config
  searchInput = config.searchInput;
  autocompleteDropdown = config.autocompleteDropdown;
  getBaseNames = config.getBaseNames;
  openDialog = config.openDialog;

  if (!searchInput || !autocompleteDropdown) {
    console.error("Search input or autocomplete dropdown not found.");
    return;
  }

  searchInput.addEventListener("input", handleSearchInput);
  searchInput.addEventListener("keydown", handleSearchKeydown);
  document.addEventListener("click", handleOutsideClick);
}

function handleSearchInput() {
  hideSearchFeedback();
  if (!autocompleteDropdown || !searchInput) return;

  const query = searchInput.value.trim().toLowerCase();
  autocompleteDropdown.innerHTML = "";

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
  const baseNames = getBaseNames();
  const pokemon = baseNames.find(function (name) {
    return name.toLowerCase() === query.toLowerCase();
  });

  if (pokemon) {
    openDialog(pokemon);
  } else {
    showSearchFeedback("No Pokémon found with that name.");
  }
}

function selectSuggestion(name) {
  searchInput.value = name;
  autocompleteDropdown.style.display = "none";
  performSearch(name);
}

function handleSearchKeydown(event) {
  if (event.key === "Enter") {
    const query = searchInput.value.trim();
    autocompleteDropdown.style.display = "none";

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
    autocompleteDropdown.style.display = "none";
  }
}

function getSearchSuggestions(query) {
  const baseNames = getBaseNames();

  return baseNames
    .filter(function (name) {
      return name.toLowerCase().startsWith(query.toLowerCase());
    })
    .slice(0, 10);
}

function renderSuggestions(suggestions) {
  const suggestionList = document.createElement("ul");

  suggestions.forEach(function (name) {
    const suggestionItem = document.createElement("li");
    suggestionItem.textContent = capitalize(name);
    suggestionItem.addEventListener("click", function () {
      selectSuggestion(name);
    });
    suggestionList.appendChild(suggestionItem);
  });

  autocompleteDropdown.appendChild(suggestionList);
  autocompleteDropdown.style.display = "block";
  searchInput.classList.add("dropdown-open");
}

function hideSuggestions() {
  autocompleteDropdown.style.display = "none";
  searchInput.classList.remove("dropdown-open");
}


function showSearchFeedback(message) {
  const feedback = document.getElementById("search-feedback");
  if (!feedback) return;

  feedback.textContent = message;
  feedback.classList.remove("hidden");

  setTimeout(function () {
    feedback.classList.add("hidden");
  }, 3000);
}

function hideSearchFeedback() {
  const feedback = document.getElementById("search-feedback");
  if (!feedback) return;

  feedback.classList.add("hidden");
}
