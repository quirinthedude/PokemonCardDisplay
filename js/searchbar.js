let searchInput;
let autocompleteDropdown;
let getSearchNames;
let openDialog;
let activeSuggestionIndex = -1;
let currentSuggestions = [];

// imports
import { capitalize } from "./helper.js";

export function initSearchBar(config) {
  // set here Eventlisteners, working intern with config
  searchInput = config.searchInput;
  autocompleteDropdown = config.autocompleteDropdown;
  getSearchNames = config.getSearchNames;
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
  activeSuggestionIndex = -1;
  currentSuggestions = [];

  if (query.length < 3) {
    hideSuggestions();
    return;
  }

  const searchNames = getSearchNames();
  if (!searchNames) return;

  const suggestions = getSearchSuggestions(query);

  if (suggestions.length === 0) {
    hideSuggestions();
    return;
  }

  currentSuggestions = suggestions;
  renderSuggestions(suggestions);
}

function performSearch(query) {
  const searchNames = getSearchNames();
  const pokemon = searchNames.find(function (name) {
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
  hideSuggestions();
  performSearch(name);
}

function handleSearchKeydown(event) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    updateActiveSuggestion(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    updateActiveSuggestion(-1);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();

    if (selectActiveSuggestion()) {
      return;
    }

    const query = searchInput.value.trim();
    hideSuggestions();

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
    hideSuggestions();
  }
}

function getSearchSuggestions(query) {
  const searchNames = getSearchNames();

  return searchNames
    .filter(function (name) {
      return name.toLowerCase().startsWith(query.toLowerCase());
    })
    .slice(0, 10);
}

function renderSuggestions(suggestions) {
  autocompleteDropdown.innerHTML = "";
  const suggestionList = document.createElement("ul");

  suggestions.forEach(function (name, index) {
    const suggestionItem = document.createElement("li");
    suggestionItem.textContent = capitalize(name);

    if (index === activeSuggestionIndex) {
      suggestionItem.classList.add("is-active");
    }

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
  activeSuggestionIndex = -1;
  currentSuggestions = [];
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

// =============================================================
// helper functions for keyboard navigation in suggestions
// =========================================================

function updateActiveSuggestion(direction) {
  if (currentSuggestions.length === 0) return;

  activeSuggestionIndex += direction;

  if (activeSuggestionIndex < 0) {
    activeSuggestionIndex = currentSuggestions.length - 1;
  } // Wrap around to the top
  else if (activeSuggestionIndex >= currentSuggestions.length) {
    activeSuggestionIndex = 0;
  } // Wrap around to the bottom

  renderSuggestions(currentSuggestions);
}

function selectActiveSuggestion() {
  if (activeSuggestionIndex < 0) return false;

  const selectedName = currentSuggestions[activeSuggestionIndex];
  if (!selectedName) return false;

  selectSuggestion(selectedName);
  return true;
}
