# Implementation Plan: Milestone 2 — Flujo de trabajo del desarrollador

**Spec**: [milestone-2-developer-workflow.md](./milestone-2-developer-workflow.md)
**Created**: 2026-07-15
**Status**: approved

## Components

### 1. Makefile
- **Purpose**: Interfaz única para dev/test/build/validate, autodocumentada.
- **Files**: `Makefile`
- **Effort**: S

### 2. Git hooks con Husky
- **Purpose**: Validación liviana en pre-commit, validación completa en pre-push hacia `main`.
- **Files**: `.husky/pre-commit`, `.husky/pre-push`, `package.json` (script `prepare`), `.lintstagedrc.json`
- **Effort**: S

## Dependencies

### Build Order
1. Makefile (componente 1) — el hook de pre-push del componente 2 invoca `make validate`.
2. Git hooks (componente 2), depende de 1.

### External Dependencies
- `husky`, `lint-staged` (devDependencies nuevas).

## Risks & Assumptions

### Risks
- **`make validate` sin lint todavía** — mitigado documentando explícitamente en el spec que se extiende en
  milestone-3 (US #6), no es un olvido.

### Assumptions
- El repo usa un solo branch protegido (`main`); no hay `develop` ni otras ramas de larga vida.

## Milestones

- [x] `make help/dev/test/build/validate` funcionan
- [x] Husky se instala automáticamente con `npm install`
- [x] Commit en rama de feature corre rápido (placeholder)
- [x] Push a `main` corre `make validate`; push a feature branch no

## Tasks

### Foundation (Build First)
- [x] **Task 1**: Crear `Makefile` con targets `help`, `dev`, `up-d`, `down`, `test`, `build`, `lint` (placeholder), `validate`
  - **Acceptance**: cada target funciona según los escenarios Gherkin de la US #3
  - **Files**: `Makefile`
  - **Tests**: ejecución manual de cada target
  - **Effort**: S

### Features (Build Second)
- [x] **Task 2**: Instalar Husky + lint-staged, script `prepare`
  - **Acceptance**: `npm install` configura `.husky/`
  - **Files**: `package.json`
  - **Effort**: XS

- [x] **Task 3**: Hook de pre-commit (lint-staged, placeholder hasta milestone-3)
  - **Acceptance**: un commit en cualquier rama corre el hook sin bloquear por lint real (aún no existe)
  - **Files**: `.husky/pre-commit`, `.lintstagedrc.json`
  - **Effort**: XS

- [x] **Task 4**: Hook de pre-push graduado por rama
  - **Acceptance**: push a `main` corre `make validate`; push a otra rama no
  - **Files**: `.husky/pre-push`
  - **Effort**: S

## Effort Estimate

**Total Estimated Days**: ~1 día

| Phase | Effort |
|-------|--------|
| Foundation | S |
| Features | XS + XS + S |
