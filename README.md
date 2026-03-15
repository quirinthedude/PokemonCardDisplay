# Pokémon Card Display

A JavaScript web application that displays Pokémon cards using the public PokéAPI.

The project focuses on building a clean frontend architecture with clear state management and a structured render pipeline.

---

## Screenshot

![Pokemon Card Display](assets/pokemon.png)

---

## Features

- paginated Pokémon card display (20 per page)
- dynamic API data fetching
- responsive card layout
- clean separation of controller, rendering and styling
- stable pagination based on a local index file

---

## Technologies

- JavaScript (ES6)
- HTML
- CSS
- REST API (PokéAPI)

---

## What I learned

This project helped me practice:

- working with REST APIs
- building a structured frontend architecture
- separating controller logic from rendering
- implementing stable pagination logic
- managing UI state in a predictable way

---

## Project Architecture

### index.html
Static layout and containers for the Pokémon cards and navigation.

### css/
Pure styling layer reacting to UI state.  
Type styling is handled via `data-type` attributes.

### js/main.js
Main controller logic.

Responsible for:

- pagination state
- API requests
- data orchestration

`pokeCount` acts as the **single source of truth** for pagination.

### js/render.js
Pure DOM rendering layer.

- no API logic
- no state management
- creates Pokémon cards and attaches UI attributes

### json/base_names.json
Local index file used for stable pagination.

This prevents the UI logic from depending on API availability.

### scripts/
Python helper scripts used to generate or analyze the JSON data.

These scripts are **not part of the runtime** and exist only for development and learning purposes.

---

## Design Decisions

- single pagination state (`pokeCount`)
- pagination derived from `PAGE_SIZE`
- strict separation between controller and rendering
- CSS reacts to attributes instead of JavaScript logic
- failed API requests are skipped (skip & continue)

---

## Data Source

PokéAPI  
https://pokeapi.co
