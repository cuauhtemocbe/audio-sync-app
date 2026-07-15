---
title: Milestone 3 — Baseline de calidad de código
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#5, #6"
---

# Milestone 3 — Baseline de calidad de código

## Objective

Configurar ESLint + Prettier con reglas explícitas para React/hooks, y extender `make validate` (creado en
milestone-2 como `test + build`) para que encadene `lint + test + build`, cerrando la brecha que se dejó
documentada explícitamente en el milestone anterior.

## Context

Historias de origen: [user-stories/milestone-3-code-quality-baseline](../user-stories/milestone-3-code-quality-baseline)
(issues #5 y #6). Depende de milestone-2 (`Makefile`, hooks de Husky) ya completado.

## Requirements

### Functional Requirements

- [x] `npm run lint` pasa sin errores sobre el código actual.
- [x] `eslint-plugin-react-hooks` detecta violaciones de reglas de hooks.
- [x] `npm run format:check` detecta archivos mal formateados sin modificarlos.
- [x] `npm run format` aplica el formato automáticamente.
- [x] `make validate` corre `lint → test → build` en orden y se detiene en el primer paso que falla.
- [x] El hook de pre-commit corre lint real (ya no el placeholder de milestone-2) sobre archivos staged.

## Architecture

### Components

- `eslint.config.js` — config flat de ESLint con `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh`.
- `.prettierrc` — config de formato.
- `Makefile` — target `lint` real, `validate` extendido a `lint test build`.
- `package.json` — `lint-staged` actualizado para correr `eslint --fix` en vez del placeholder.

## User Stories

- [#5 — Configurar ESLint y Prettier](../user-stories/milestone-3-code-quality-baseline/01-eslint-prettier.md)
- [#6 — Script de validación único](../user-stories/milestone-3-code-quality-baseline/02-script-validate.md)

## Testing Strategy

Verificación funcional: `npm run lint` sobre código limpio y sobre una violación introducida a propósito
(hook condicional); `format:check` sobre un archivo mal formateado a propósito. No aplica TDD de unidad.

## Boundaries & Constraints

### In Scope
- Lint + format + extensión de `make validate`.

### Out of Scope
- Type checking (proyecto en JS, no TS — fuera de alcance).
- Cobertura diferenciada por capa (descartado en el backlog).

## Success Criteria

- [x] Los 4 escenarios Gherkin de la US #5 pasan.
- [x] Los 3 escenarios Gherkin de la US #6 pasan.
- [x] `make validate` incluye lint y el hook de pre-push ya no corre la cadena incompleta de milestone-2.

## Implementation Plan

Ver [milestone-3-code-quality-baseline-plan.md](./milestone-3-code-quality-baseline-plan.md).
