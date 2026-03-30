# Advanced Feature Roadmap – Dialog Expansion (Types, About, Moves)

## Context

The current dialog implementation focuses on three tabs:

* Types
* Stats
* Evolution

This is a strong and focused scope for the current project stage.
Several additional ideas emerged during development, especially around:

* dual-type matchup calculation
* richer Pokémon metadata
* move-related presentation

These features are intentionally postponed to keep the project clean, presentable, and realistically completable.

---

## Current Scope

### Implemented / planned for current version

* **Types**

  * display current Pokémon types
  * show API-based strengths / weaknesses for main type
* **Stats**

  * render base stats
* **Evolution**

  * lazy-load and display evolution chain

---

## Future Expansion Goals

### 1. Advanced Types Tab

### Goal

Upgrade the current simplified type system into a **fully accurate dual-type matchup system**.

### Current simplified version

* Uses `types[0]`
* Fetches `damage_relations` from the type endpoint
* Displays:

  * Strong Against
  * Weak Against

### Future version

Should:

* consider **both types**
* combine defensive multipliers correctly
* display:

  * Weak Against
  * Resistant To
  * Immune To
* optionally show exact multipliers:

  * `×2`
  * `×4`
  * `×0.5`
  * `×0.25`
  * `×0`

---

## Advanced Types – Architecture Plan

### Step 1 – Fetch both type endpoints

```js
const typeUrls = p.types.map(t => t.type.url);

const typeDataList = await Promise.all(
  typeUrls.map(url => fetch(url).then(res => res.json()))
);
```

### Step 2 – Extract damage relations

Relevant API fields:

* `double_damage_from`
* `half_damage_from`
* `no_damage_from`

### Step 3 – Build multiplier map

```js
const multipliers = {};
```

Initialize all type multipliers with `1`.

For each Pokémon type:

* `double_damage_from` → `* 2`
* `half_damage_from` → `* 0.5`
* `no_damage_from` → `* 0`

### Step 4 – Categorize final results

```js
weak = multiplier > 1
resist = multiplier < 1 && multiplier > 0
immune = multiplier === 0
```

### Main challenge

Dual-type relations are **multiplicative**, not additive.

Examples:

* `2 * 0.5 = 1` → neutral
* `2 * 2 = 4` → strong weakness
* `0 * anything = 0` → immunity

### Suggested helper

```js
getCombinedTypeRelations(typeDataList)
```

Return shape:

```js
{
  weak: [],
  resist: [],
  immune: []
}
```

---

## 2. Future About Tab

### Goal

Introduce a dedicated **About** tab for general Pokémon information that is not primarily combat-focused.

### Reason

During development, it became clear that:

* type matchups already fill one full tab meaningfully
* general metadata should not overcrowd the current UI
* a separate About tab would improve clarity

### Candidate content

* species
* height
* weight
* abilities
* optional flavor text / Pokédex entry

### Data source notes

Some of this information is already available in `p`, for example:

* `p.height`
* `p.weight`
* `p.abilities`

Other information requires additional fetches, especially from:

```js
p.species.url
```

### Possible helper functions

```js
formatHeight(height)
formatWeight(weight)
formatAbilities(abilities)
getSpeciesInfo(speciesUrl)
```

### UI idea

The About tab should feel more like:

* general info
* descriptive metadata
* flavor and identity

Not:

* pure combat logic

### Challenge

This data is easier to fetch than dual-type logic, but it can still increase dialog complexity if too much is shown at once.

### Recommendation for future implementation

Keep the About tab compact:

* 3–5 info blocks maximum
* no long walls of text
* use simple visual grouping

---

## 3. Future Moves Tab

### Goal

Introduce a dedicated **Moves** tab as an optional advanced feature.

### Reason

Moves were considered during current development, but they quickly increased complexity:

* many moves per Pokémon
* different learn methods
* different version groups
* unclear definition of “best” or “most relevant” moves

For this reason, Moves should be treated as a **separate expansion**, not as part of the current scope.

### Possible versions

#### Version A – Simple

Show:

* 3–5 selected moves
* formatted as readable labels

Example:

* Tackle
* Vine Whip
* Razor Leaf
* Sleep Powder

#### Version B – Enriched

Show:

* move name
* type
* power
* accuracy
* category (physical / special / status)

#### Version C – Smart Selection

Use a selection heuristic:

* 1–2 strong attack moves
* 1 reliable move
* 1 status / utility move

### Suggested helper functions

```js
getFeaturedMoves(moves)
formatMoveName(name)
getMoveDetails(moveUrl)
```

### Main challenge

Moves are technically available, but choosing meaningful ones requires design decisions:

* latest moves?
* level-up moves only?
* strongest moves?
* beginner-friendly moves?

This makes the tab interesting, but also significantly more complex than it first appears.

### Recommendation

If implemented later:

* start with a **simple curated move list**
* avoid “optimal move calculation” in the first iteration

---

## Suggested Dialog Evolution Path

### Current stage

* Types
* Stats
* Evolution

### Stage 2

* Types
* Stats
* Evolution
* About

### Stage 3

* Types
* Stats
* Evolution
* About
* Moves

---

## Code Structure Recommendation

To avoid a bloated `renderDialog()` function:

### Keep clear separation

#### Data layer

* fetch Pokémon details
* fetch type data
* fetch species data
* fetch move data

#### Processing layer

* compute matchups
* format abilities / measures
* select featured moves

#### Render layer

* render current tab content only

### Suggested helper functions

```js
getTypeAttributes(typeUrl)
getCombinedTypeRelations(typeDataList)
getSpeciesInfo(speciesUrl)
getFeaturedMoves(moves)
formatHeight(height)
formatWeight(weight)
formatAbilities(abilities)
```

---

## Performance / UX Considerations

### Future issue

The dialog may eventually trigger several fetches at once:

* Pokémon fetch
* evolution chain fetch
* one or two type fetches
* species fetch
* move detail fetches

### Recommendation

If the dialog is expanded later, introduce caching for:

* type data
* species data
* move data

This would reduce repeated network requests and improve responsiveness.

---

## Why These Features Matter

These postponed features are valuable because they demonstrate:

* deeper API understanding
* async orchestration across multiple endpoints
* data transformation and combination
* separation of concerns
* scalable UI design

They are therefore good candidates for:

* later refactoring practice
* portfolio polishing
* deeper frontend/system-design learning

---

## Current Decision

The following features are intentionally postponed:

* full dual-type matchup logic
* dedicated About tab
* dedicated Moves tab

This is done to:

* protect current project focus
* prevent overengineering
* keep the app presentable and submittable
* preserve strong future upgrade potential

---

## Current Status Summary

### Now

* simplified Types tab
* Stats tab
* Evolution tab

### Later

* advanced dual-type logic
* About tab
* Moves tab

---

## Final Note

This roadmap is not a sign of unfinished thinking.
It is a deliberate design decision:

Build a strong, clean version now.
Document the deeper architecture for future expansion.
