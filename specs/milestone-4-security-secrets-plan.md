# Implementation Plan: Milestone 4 — Seguridad y secretos

**Spec**: [milestone-4-security-secrets.md](./milestone-4-security-secrets.md)
**Created**: 2026-07-15
**Status**: completed

## Components

### 1. `gitleaks` en pre-commit
- **Purpose**: Segunda barrera contra secretos que lleguen al historial de git.
- **Files**: `.husky/pre-commit`, `.gitleaks.toml` (si hace falta alguna excepción)
- **Effort**: XS

### 2. Verificación de `SONARQUBE_PROJECT_KEY`
- **Purpose**: Confirmar que las métricas de SonarQube consultadas pertenecen a este proyecto y no a otro.
- **Files**: ninguno de código — nota de verificación en `CLAUDE.md` (sección Testing o una nueva sección breve)
- **Effort**: XS

## Dependencies

### Build Order
1. `gitleaks` en pre-commit (componente 1) — independiente
2. Verificación del project key (componente 2) — independiente, puede ir en paralelo

### External Dependencies
- `gitleaks` (binario, instalado en el `Dockerfile.dev`/imagen de desarrollo o corrido vía `docker run` puntual
  si no conviene instalarlo en la imagen)

## Risks & Assumptions

### Risks
- **`gitleaks` no está disponible como paquete npm** — se resuelve documentando su instalación (binario o imagen
  Docker oficial `zricethezav/gitleaks`) e invocándolo desde el hook sin agregarlo a `package.json`.
- **Falso positivo en el scan inicial** (ej. un hash o UUID en `aligned_transcript.json`) — mitigado corriendo
  `gitleaks detect` sobre el repo completo antes de cablear el hook, y agregando la excepción a `.gitleaks.toml`
  si aparece.

### Assumptions
- El servidor de SonarQube usado en `.mcp.json` (`http://localhost:9000`) está accesible al momento de verificar
  el project key; si no lo está, la verificación queda documentada como "pendiente de repetir cuando el servidor
  esté arriba" en vez de asumida como exitosa.

## Milestones

- [x] `gitleaks` bloquea un commit con un secreto sintético de prueba
- [x] `gitleaks` no bloquea un commit limpio
- [x] Project key de SonarQube verificado contra el servidor real — resultado: no existe, documentado

## Tasks

### Foundation (Build First)
- [x] **Task 1**: Correr `gitleaks detect` sobre el repo completo y resolver falsos positivos
  - **Acceptance**: El scan corre sin bloquear en secretos legítimos ya gitignoreados (no deberían aparecer
    porque no están trackeados); cualquier falso positivo real se documenta en `.gitleaks.toml`
  - **Files**: `.gitleaks.toml` (solo si hace falta)
  - **Effort**: XS
  - **Resultado**: `16 commits scanned`, `no leaks found`. No hizo falta `.gitleaks.toml`.

### Features (Build Second)
- [x] **Task 2**: Cablear `gitleaks protect --staged` en `.husky/pre-commit`
  - **Acceptance**: Los 3 escenarios Gherkin de la US #7 pasan (commit limpio pasa, commit con secreto sintético
    bloquea con archivo+línea, excepción documentada no bloquea)
  - **Files**: `.husky/pre-commit`
  - **Effort**: XS

- [x] **Task 3**: Verificar `SONARQUBE_PROJECT_KEY` contra el servidor
  - **Acceptance**: `get_project_quality_gate_status` con `projectKey="audio-sync-app"` no devuelve error de
    "proyecto no encontrado"; `component.key` de una consulta sin parámetro explícito coincide con
    `"audio-sync-app"`. Documentar el resultado (aunque sea "servidor no accesible, pendiente") en `CLAUDE.md`.
  - **Files**: `CLAUDE.md`
  - **Effort**: XS
  - **Resultado**: 404 — el proyecto no existe en el servidor. Documentado en `CLAUDE.md`, sección "Seguridad
    y secretos". Requiere acción manual de administración (crear el proyecto) fuera de este repo.

## Effort Estimate

**Total Estimated Days**: ~0.5 día
