---
title: Milestone 2 — Flujo de trabajo del desarrollador
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#3, #4"
---

# Milestone 2 — Flujo de trabajo del desarrollador

## Objective

Dar a `audio-sync-app` un `Makefile` autodocumentado como interfaz única de comandos, y git hooks versionados
(Husky) con validación graduada por rama, para detectar errores antes de que lleguen a `main` sin pagar el
costo de una validación completa en cada commit chico.

## Context

Historias de origen: [user-stories/milestone-2-developer-workflow](../user-stories/milestone-2-developer-workflow)
(issues #3 y #4).

**Dependencia cruzada con milestone-3**: el target `lint` del Makefile y el paso de lint del hook de pre-commit
son placeholders hasta que la US #5 (ESLint+Prettier, milestone-3) exista. El target `validate` se implementa
aquí como `test + build` y se extiende en la US #6 (milestone-3) para incluir `lint`. Esto se documenta
explícitamente para que no se lea como un olvido — es la secuencia que pidió el usuario (Fase 2 antes que Fase 3).

## Requirements

### Functional Requirements

- [x] `make` sin argumentos muestra la ayuda autodocumentada, sin ejecutar nada.
- [x] `make dev` levanta `docker-compose.dev.yml`.
- [x] `make test` corre la suite de Vitest dentro de Docker, levantando el servicio si hace falta.
- [x] `make build` construye la imagen de producción.
- [x] `make validate` corre `test` + `build` (lint se suma en milestone-3) y se detiene en el primer paso que falla.
- [x] Husky se instala automáticamente vía el script `prepare` al correr `npm install`.
- [x] El hook de pre-commit corre rápido en cualquier rama (placeholder de lint hasta milestone-3).
- [x] El hook de pre-push ejecuta `make validate` solo cuando la rama actual es `main`.

## Architecture

### Components

- `Makefile` — interfaz única, target `help` por default.
- `.husky/pre-commit`, `.husky/pre-push` — hooks versionados.
- `package.json` — script `prepare`, devDependency `husky` y `lint-staged`.
- `.lintstagedrc.json` (o sección en `package.json`) — config de pre-commit, placeholder hasta milestone-3.

## User Stories

- [#3 — Makefile como interfaz única](../user-stories/milestone-2-developer-workflow/01-makefile-entrypoint.md)
- [#4 — Git hooks graduados por rama](../user-stories/milestone-2-developer-workflow/02-git-hooks-graduados.md)

## Testing Strategy

Verificación funcional directa de cada target (`make dev`, `make test`, `make build`) y de los hooks
(simular un commit/push en una rama de feature vs. `main`). No aplica TDD de unidad — son scripts de
infraestructura, no lógica de negocio.

## Boundaries & Constraints

### In Scope
- Makefile + hooks Husky con validación graduada.

### Out of Scope
- Contenido real del lint (milestone-3).
- CI hosteado (descartado explícitamente para este proyecto).

## Success Criteria

- [x] Los 4 escenarios Gherkin de la US #3 (Makefile) pasan.
- [x] Los 4 escenarios Gherkin de la US #4 (git hooks) pasan.
- [x] `make validate` existe y encadena `test` + `build`, documentado como pendiente de extender en milestone-3.

## Implementation Plan

Ver [milestone-2-developer-workflow-plan.md](./milestone-2-developer-workflow-plan.md).
