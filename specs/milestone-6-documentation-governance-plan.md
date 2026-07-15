# Implementation Plan: Milestone 6 — Documentación y gobernanza

**Spec**: [milestone-6-documentation-governance.md](./milestone-6-documentation-governance.md)
**Created**: 2026-07-15
**Status**: completed

## Components

### 1. `CHANGELOG.md`
- **Purpose**: Historial legible de qué cambió entre versiones.
- **Files**: `CHANGELOG.md`
- **Effort**: XS

### 2. `LICENSE`
- **Purpose**: Términos de uso explícitos del código.
- **Files**: `LICENSE`, `Makefile` (`license-check`)
- **Effort**: XS

### 3. Tabla de design tokens + autocrítica
- **Purpose**: Documentar el tema oscuro ya implementado para que no se "corrija" sin contexto a futuro.
- **Files**: `CLAUDE.md`
- **Effort**: XS

## Dependencies

### Build Order
Las tres son independientes entre sí; se implementan en el orden que aparecen en el spec.

### External Dependencies
Ninguna.

## Risks & Assumptions

### Risks
- **Elegir la licencia es una decisión del usuario, no una decisión técnica** — no se asume MIT por default;
  se confirma con el mantenedor antes de crear el archivo.

### Assumptions
- El changelog reconstruye el historial reciente (milestones 1-7) como una única entrada de versión, ya que no
  hubo releases versionados previamente distintos de `1.0.0`.

## Milestones

- [x] `CHANGELOG.md` con al menos una versión documentada, sincronizada con `package.json`
- [x] `LICENSE` presente y `license-check` en verde dentro de `make validate`
- [x] Tabla de tokens + autocrítica en `CLAUDE.md`, valores verificados contra `src/App.jsx`

## Tasks

### Foundation (Build First)
- [x] **Task 1**: Confirmar con el usuario qué licencia usar, luego crear `LICENSE`
  - **Acceptance**: Archivo `LICENSE` no vacío con el texto de la licencia elegida
  - **Files**: `LICENSE`
  - **Effort**: XS
  - **Resultado**: MIT, confirmado con el usuario.

- [x] **Task 2**: Agregar `license-check` a `Makefile` y a `validate`
  - **Acceptance**: `make license-check` retorna 0 si `LICENSE` existe, falla si no
  - **Files**: `Makefile`
  - **Effort**: XS

### Features (Build Second)
- [x] **Task 3**: Crear `CHANGELOG.md`
  - **Acceptance**: Los 3 escenarios Gherkin de la US #12 pasan
  - **Files**: `CHANGELOG.md`
  - **Effort**: XS
  - **Resultado**: `[Unreleased]` con el trabajo de M4/M5/M6 de esta sesión; `[1.0.0]` reconstruye el baseline
    (M1-M3 + features originales), coincide con `package.json`.

- [x] **Task 4**: Documentar tabla de tokens + autocrítica en `CLAUDE.md`
  - **Acceptance**: Los 3 escenarios Gherkin de la US #14 pasan; valores hex verificados contra `App.jsx`, no
    inventados
  - **Files**: `CLAUDE.md`
  - **Effort**: XS

## Effort Estimate

**Total Estimated Days**: ~0.5 día
