# Implementation Plan: Milestone 3 — Baseline de calidad de código

**Spec**: [milestone-3-code-quality-baseline.md](./milestone-3-code-quality-baseline.md)
**Created**: 2026-07-15
**Status**: approved

## Components

### 1. ESLint + Prettier
- **Purpose**: Lint y formato consistente, con reglas de hooks de React.
- **Files**: `eslint.config.js`, `.prettierrc`, `package.json` (scripts + devDependencies)
- **Effort**: S

### 2. Extensión de `make validate`
- **Purpose**: Cerrar la brecha documentada en milestone-2 — sumar `lint` a la cadena.
- **Files**: `Makefile`, `package.json` (`lint-staged` real)
- **Effort**: XS

## Dependencies

### Build Order
1. ESLint + Prettier (componente 1)
2. Extensión de Makefile y lint-staged (componente 2), depende de 1

### External Dependencies
- `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier`, `eslint-config-prettier`

## Risks & Assumptions

### Risks
- **El código actual podría no pasar lint a la primera** — mitigado corriendo `npm run lint` apenas se instala
  la config y corrigiendo antes de cerrar la historia, no después.

## Milestones

- [x] `npm run lint` en verde sobre el código actual
- [x] `npm run format:check` / `npm run format` funcionan
- [x] `make validate` corre lint → test → build
- [x] Pre-commit corre lint real (ya no placeholder)

## Tasks

### Foundation (Build First)
- [x] **Task 1**: Instalar y configurar ESLint (flat config) + Prettier
  - **Acceptance**: `npm run lint` y `npm run format:check`/`format` funcionan según los escenarios de la US #5
  - **Files**: `eslint.config.js`, `.prettierrc`, `package.json`
  - **Effort**: S

### Features (Build Second)
- [x] **Task 2**: Extender `Makefile` (`lint` real, `validate: lint test build`)
  - **Acceptance**: `make validate` corre los tres pasos en orden y se detiene en el primero que falla
  - **Files**: `Makefile`
  - **Effort**: XS

- [x] **Task 3**: Reemplazar el placeholder de `lint-staged` por `eslint --fix`
  - **Acceptance**: un commit con una violación de lint en un archivo staged es bloqueado por el pre-commit
  - **Files**: `package.json`
  - **Effort**: XS

## Effort Estimate

**Total Estimated Days**: ~0.5-1 día
