---
title: Milestone 4 — Seguridad y secretos
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#7, #8"
---

# Milestone 4 — Seguridad y secretos

## Objective

Agregar una segunda barrera de detección de secretos en el hook de pre-commit (además del `.gitignore` ya
existente) y verificar que `SONARQUBE_PROJECT_KEY` en `.mcp.json` corresponde al proyecto real en el servidor,
para no confiar en métricas de calidad de otro proyecto por un copy-paste mal hecho.

## Context

Historias de origen: [user-stories/milestone-4-security-secrets](../user-stories/milestone-4-security-secrets)
(issues #7 y #8). Independiente de M1-M3. `.mcp.json` y `.claude/` ya están gitignoreados y verificados con
`git check-ignore -v`; esta historia no corrige un incidente existente, es defensa en profundidad.

## Requirements

### Functional Requirements

- [x] Un commit sin secretos pasa el hook de pre-commit sin fricción.
- [x] Un commit con un valor que matchea un patrón de credencial conocido (ej. `squ_` de SonarQube) es bloqueado,
      con mensaje indicando archivo y línea.
- [x] Existe un mecanismo de excepción versionado para falsos positivos documentados (`.gitleaks.toml`, no
      creado porque no hizo falta ninguna excepción).
- [x] `SONARQUBE_PROJECT_KEY="audio-sync-app"` se verifica contra el servidor real — resultado: el proyecto
      **no existe** en el servidor, documentado en `CLAUDE.md`.

## Architecture

### Components

- `.husky/pre-commit` — se agrega el paso de `gitleaks protect --staged` antes o después de `lint-staged`.
- `.gitleaks.toml` — config de excepciones (creada solo si hace falta alguna al correr el scan inicial).
- Verificación puntual (no un componente de código): consulta a las tools de SonarQube MCP
  (`get_project_quality_gate_status`, `get_component_measures`) comparando `component.key` contra
  `"audio-sync-app"`.

## User Stories

- [#7 — Secret scanning en pre-commit](../user-stories/milestone-4-security-secrets/01-secret-scanning-pre-commit.md)
- [#8 — Verificar SONARQUBE_PROJECT_KEY contra el proyecto real](../user-stories/milestone-4-security-secrets/02-verificar-sonarqube-project-key.md)

## Testing Strategy

Verificación funcional manual: commit limpio (pasa), commit con secreto sintético introducido a propósito en un
archivo temporal (bloqueado), luego revertido antes de push. No aplica test automatizado de unidad — es una
herramienta externa (`gitleaks`) invocada por el hook, no lógica propia.

## Boundaries & Constraints

### In Scope
- `gitleaks` en pre-commit sobre el diff staged.
- Verificación puntual del project key de SonarQube.

### Out of Scope
- Secret manager externo (Vault, Doppler) — descartado explícitamente en el backlog para este tamaño de proyecto.
- Escaneo de todo el historial de git (solo diff staged en cada commit).

### Technical Constraints
- `gitleaks` como binario standalone (sin dependencia de Python, a diferencia de `detect-secrets`).

## Success Criteria

- [x] Los 3 escenarios Gherkin de la US #7 pasan.
- [x] Los 2 escenarios Gherkin de la US #8 pasan (el segundo revela que el proyecto no existe en el servidor —
      resultado documentado, no bloqueante para cerrar la historia).
- [x] `gitleaks` corre en cada `git commit` vía `.husky/pre-commit`.

## Implementation Plan

Ver [milestone-4-security-secrets-plan.md](./milestone-4-security-secrets-plan.md).
