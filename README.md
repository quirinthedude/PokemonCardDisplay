# Pokémon Card Display – Pagination, Render Pipeline & UI State

Frontend-Projekt im Rahmen der **Developer Akademie – Modul 8**.  
Der Fokus liegt auf einer **stabilen Pagination-Logik**, klarer **Zustandsverwaltung** und einer sauberen **Trennung von Controller-Logik, Rendering und Styling**.

Das Projekt dient primär dem Lernen des strukturierten Umgangs mit einer externen API (PokéAPI) und nicht der vollständigen Abbildung aller Pokémon-Daten.

---

## Projektziel

Darstellung von Pokémon-Karten in **paginierten Schritten**  
(aktuell: **20 Pokémon pro Seite**), basierend auf:

- einer lokalen Index-Datei (`base_names.json`)
- der öffentlichen **PokéAPI**

Der Schwerpunkt liegt **nicht** auf komplexem Design,  
sondern auf:

- konsistenter Zustandsführung
- robuster Render-Pipeline
- gut lesbarer, wartbarer Frontend-Architektur

---

## Architekturüberblick

### `index.html`
- Statische Grundstruktur
- Container für Pokémon-Karten
- Navigation (Start / Last / Next)
- Scripts als ES-Module eingebunden

---

### `css/`
- Visuelles Styling
- Reine Reaktion auf Zustände (keine Logik)
- Typ-Darstellung über `data-type` Attribute
- UI-Zustände (`.disabled`, `.empty`) rein über CSS

---

### `js/main.js`
- Zentrale Applikations- & Controller-Logik
- `pokeCount` als **Single Source of Truth** für Pagination
- Fetch-Logik & Fehler-Policy
- Übergibt **Daten + PAGE_SIZE** an das Rendering (keine Globals)

---

### `js/render.js`
- Reines DOM-Rendering (keine Fetches, kein State)
- Erzeugt pro Pokémon eine eigene Card
- Setzt `data-type` für CSS-basierte Darstellung
- Klar strukturierte Helper-Funktionen (Lesbarkeit vor One-Linern)

---

### `json/base_names.json`
- Lokale Index-Datei für Pagination
- Entkoppelt UI-Logik von API-Verfügbarkeit
- Enthält **keine UI- oder Style-Daten**

---

### `scripts/`
- Python-Hilfsskripte zur Generierung / Analyse der JSON-Daten
- **Nicht Teil der Runtime**
- Dienen ausschließlich dem Build- und Lernprozess

---

## Zentrale Designentscheidungen

- **Ein Zustand** (`pokeCount`) statt verteilter Flags
- Pagination vollständig aus `PAGE_SIZE` abgeleitet
- Rendering strikt vom Controller getrennt
- CSS reagiert auf Attribute (`data-type`), nicht auf JS-Logik
- Fehler beim Fetch werden übersprungen (skip & continue), kein Retry

---

## Typ-Darstellung

- JavaScript bestimmt den **Primary Type** eines Pokémon
- Dieser wird als `data-type` an der Card gesetzt
- CSS übernimmt:
  - Hintergrundfarbe
  - Typ-Icon (CSS-only, Unicode)

Mehrfach-Typen sind aktuell **bewusst nicht visuell kombiniert**,  
um Rendering und Styling klar und nachvollziehbar zu halten.

---

## Datenquellen

- PokéAPI: https://pokeapi.co  
- Lokale, vorverarbeitete JSON-Dateien für stabile Pagination

---

## Hinweis

Dieses Projekt dient dem Lernen und der strukturellen Klarheit.  
Erweiterungen wie Multi-Type-Rendering, Suche, Accessibility-Feinschliff  
oder weitergehende UI-Themes sind bewusst offen gelassen.
