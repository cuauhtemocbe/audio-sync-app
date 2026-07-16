---
title: Milestone 9 — Configuración e higiene del repo
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#22 (#21 descartada, ver Objective)"
---

# Milestone 9 — Configuración e higiene del repo

## Objective

Agregar `.codegraph/` (cache local de indexado, no secreta pero local-only) a `.gitignore` para que un
`git add -A` descuidado nunca la trackee por error.

**#21 (`.env.example`) descartada por decisión del usuario** (2026-07-15): no hace falta una plantilla de
variables de entorno para este proyecto — ver Boundaries. Este spec cubre solo #22.

## Context

Historia de origen: [user-stories/milestone-9-configuracion-e-higiene](../user-stories/milestone-9-configuracion-e-higiene)
(issue #22; #21 documentada ahí pero descartada, ver Boundaries).

Investigación previa a este spec:

- `git status --porcelain` confirma que `.codegraph/` aparece como `??` (untracked) porque no hay ninguna entrada
  para `.codegraph/` en el `.gitignore` raíz — a diferencia de `.claude/` y `.mcp.json`, que sí están.
  `.codegraph/.gitignore` (interno a la carpeta) ya ignora todo su contenido salvo sí mismo, pero eso no evita
  que la carpeta completa aparezca como untracked en el repo padre si no hay una entrada en el `.gitignore` raíz.
  `git ls-files .codegraph/` no devuelve nada — nunca se trackeó por error.

## Requirements

### Functional Requirements

- [ ] `.codegraph/` agregado a `.gitignore` raíz.
- [ ] `git status --porcelain` no reporta ninguna línea para `.codegraph/` ni su contenido.

## Architecture

### Components

- `.gitignore`: agregar una entrada `.codegraph/` (junto al bloque existente de `.claude/`/`.mcp.json`, mismo
  criterio: config/cache local-only).

## User Stories

- [#22 — .codegraph/ en .gitignore](../user-stories/milestone-9-configuracion-e-higiene/02-codegraph-en-gitignore.md)
- ~~#21 — .env.example versionado~~ (descartada, ver Boundaries)

## Testing Strategy

Sin unit tests aplicables (es un archivo de configuración, no código). Verificación manual:

- `git status --porcelain` antes y después de agregar `.codegraph/` a `.gitignore`.
- `git add -A && git status --porcelain` para confirmar que ningún archivo de `.codegraph/` queda staged.

## Boundaries & Constraints

### In Scope

- #22 (.codegraph/ en .gitignore), esfuerzo XS.

### Out of Scope

- **#21 (.env.example)**: descartada por decisión explícita del usuario (2026-07-15) — no hace falta una
  plantilla de variables de entorno para este proyecto. Queda pendiente decidir con el usuario si el issue #21
  se cierra en GitHub como "won't do" o se re-prioriza a otro milestone.
- Remover otros módulos/caches locales no mencionados en la historia (ej. `.vite/` ya está en `.gitignore`).

## Success Criteria

- [x] Los 2 escenarios Gherkin de la US #22 pasan.
- [x] `make validate` en verde (sin regresión).

## Verificación (2026-07-15)

- `.codegraph/` agregado a `.gitignore`. `git status --porcelain` ya no reporta la carpeta; `git add -A -n`
  (dry-run) confirma que no se stagea ningún archivo de `.codegraph/`.
- Issue #22 cerrada en GitHub con el detalle de verificación.
- Issue #21 (`.env.example`) cerrada como won't-do por decisión explícita del usuario (2026-07-15): no hace
  falta una plantilla de variables de entorno para este proyecto.

## Implementation Plan

Ver [milestone-9-configuracion-e-higiene-plan.md](./milestone-9-configuracion-e-higiene-plan.md).
