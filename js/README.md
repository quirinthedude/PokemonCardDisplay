# Pokémon Card Display – Pagination & UI State

Frontend-Projekt im Rahmen der **Developer Akademie – Modul 8**.  
Fokus liegt auf sauberer **Pagination-Logik**, **UI-State-Handling** und klarer Trennung von Struktur, Stil und Logik.

## Projektziel

Darstellung von Pokémon-Karten in paginierten Schritten (jeweils 10 Pokémon),  
basierend auf einer lokalen Index-Datei und der öffentlichen **PokéAPI**.

Der Schwerpunkt liegt **nicht** auf Design oder Vollständigkeit der Daten,  
sondern auf:

- konsistenter Zustandsverwaltung
- klarer Button-Logik (Next / Last)
- robuster Render-Pipeline im Frontend

## Architekturüberblick

**index.html**
- Statische Grundstruktur
- Container & Navigationselemente (Next / Last / Start)

**css/**
- Visuelles Styling
- UI-States über Klassen (`.disabled`)
- bewusste Hover-Effekte im Pokémon-Kontext

**js/main.js**
- Zentrale Applikationslogik
- `pokeCount` als *single source of truth* für Pagination
- Event-Handling ohne Inline-Handler

**json/base_names.json**
- Lokale Index-Datei für Pagination
- Entkoppelt UI-Logik von API-Abhängigkeiten

**scripts/**
- Python-Hilfsskripte zur Generierung der JSON-Daten
- Nicht Teil der Runtime, nur Build-/Analyse-Werkzeuge

## Zentrale Designentscheidungen

- **Ein Zustand** (`pokeCount`) statt mehrerer Flags
- Buttons sind *abgeleitete UI-Zustände*, keine Logikträger
- JavaScript steuert Logik, CSS reagiert visuell
- Projekt bewusst klein und explizit gehalten

## Datenquellen

- https://pokeapi.co  
- Lokale, vorverarbeitete JSON-Dateien für stabile Pagination

## Hinweis

Dieses Projekt dient dem Lernen und der strukturellen Klarheit.  
Optimierungen (Search-Integration, Accessibility-Feinschliff, Refactors) sind bewusst offen gelassen.
