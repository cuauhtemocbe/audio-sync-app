---
title: Milestone 6 — Documentación y gobernanza
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#12, #13, #14"
---

# Milestone 6 — Documentación y gobernanza

## Objective

Agregar `CHANGELOG.md` (Keep a Changelog + SemVer), un archivo `LICENSE` explícito, y documentar en `CLAUDE.md`
la tabla de design tokens del tema oscuro ya implementado junto con la autocrítica de qué alternativas se
descartaron — cerrando la brecha de gobernanza documental del proyecto sin cambiar ningún comportamiento.

## Context

Historias de origen: [user-stories/milestone-6-documentation-governance](../user-stories/milestone-6-documentation-governance)
(issues #12, #13, #14). Independiente de M1-M5. Las tres historias son puramente documentales/de archivo — no
tocan `src/` ni requieren tests automatizados más allá de un chequeo trivial de presencia de archivo.

## Requirements

### Functional Requirements

- [x] `CHANGELOG.md` existe con secciones "Added"/"Changed"/"Fixed"/"Removed" para al menos una versión.
- [x] La versión del changelog coincide con `package.json` (`"version": "1.0.0"`).
- [x] Un `LICENSE` existe en la raíz y no está vacío (MIT, elegida por el usuario).
- [x] `make validate` incluye un chequeo trivial (`test -f LICENSE`) que falla si el archivo no existe.
- [x] `CLAUDE.md` incluye una tabla `token → hex → uso` cuyos valores coinciden con `src/App.jsx` reales, más una
      sección de autocrítica de alternativas descartadas.

## Architecture

### Components

- `CHANGELOG.md` — nuevo, formato Keep a Changelog. Entrada inicial: reconstruir el historial reciente
  (milestones 1-3 ya implementados, milestones 4-7 de este trabajo) bajo la versión vigente o `Unreleased`,
  según corresponda al momento de cerrar cada uno.
- `LICENSE` — nuevo. Requiere elegir la licencia (ver pregunta al usuario más abajo).
- `Makefile` — nuevo target `license-check` (o incorporado a un target existente), sumado a `validate`.
- `CLAUDE.md` — nueva sección con la tabla de tokens (colores reales usados en `App.jsx`: fondo `bg-gray-900`
  `#111827`, texto base `text-gray-100` `#f3f4f6`, acento activo `text-orange-400`/`decoration-orange-500`
  `#fb923c`/`#f97316`, texto secundario `text-gray-400` `#9ca3af` — paleta default de Tailwind, sin config
  custom en `tailwind.config.js`) y la autocrítica.

## User Stories

- [#12 — CHANGELOG.md siguiendo Keep a Changelog](../user-stories/milestone-6-documentation-governance/01-changelog.md)
- [#13 — Archivo LICENSE](../user-stories/milestone-6-documentation-governance/02-license.md)
- [#14 — Tabla de design tokens y autocrítica de la UI](../user-stories/milestone-6-documentation-governance/03-design-tokens-table.md)

## Testing Strategy

Verificación funcional, sin tests de unidad (son artefactos documentales):
- `license-check` (`test -f LICENSE`) corrido manualmente y dentro de `make validate`.
- Comparación manual de cada valor hex de la tabla de tokens contra `src/App.jsx` (los colores están inline como
  clases de Tailwind, no en `src/index.css` ni en `tailwind.config.js` que no tiene tema custom).
- Comparación manual de la versión del changelog contra `package.json`.

## Boundaries & Constraints

### In Scope
- `CHANGELOG.md`, `LICENSE`, `license-check`, tabla de tokens + autocrítica en `CLAUDE.md`.

### Out of Scope
- Automatizar la generación del changelog (ej. `conventional-changelog`) — se mantiene manual, acorde al tamaño
  del proyecto.
- Cambiar el diseño visual — esta historia documenta lo ya construido, no lo modifica.

## Success Criteria

- [x] Los 3 escenarios Gherkin de la US #12 pasan.
- [x] Los 2 escenarios Gherkin de la US #13 pasan.
- [x] Los 3 escenarios Gherkin de la US #14 pasan.

## Implementation Plan

Ver [milestone-6-documentation-governance-plan.md](./milestone-6-documentation-governance-plan.md).
