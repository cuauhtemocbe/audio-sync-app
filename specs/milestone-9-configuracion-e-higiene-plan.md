---
title: Implementation Plan: Milestone 9 — Configuración e higiene del repo
status: approved
created: 2026-07-15
---

# Implementation Plan: Milestone 9 — Configuración e higiene del repo

**Spec**: [milestone-9-configuracion-e-higiene.md](./milestone-9-configuracion-e-higiene.md)

## Components

### 1. `.codegraph/` en `.gitignore` (#22)
- **Purpose**: que un `git add -A` nunca trackee la cache local de CodeGraph.
- **Files**: `.gitignore`.
- **Effort**: XS

## Dependencies

Ninguna — cambio de un solo archivo, sin orden que respetar.

## Risks & Assumptions

- Ninguno relevante — es un cambio de una línea, ya verificado que `.codegraph/` nunca se trackeó
  (`git ls-files .codegraph/` vacío).

## Milestones

- [ ] `.gitignore` actualizado y verificado con `git status --porcelain`.

## Tasks

### Foundation

- [ ] **Agregar `.codegraph/` a `.gitignore`**: nueva entrada junto al bloque de `.claude/`/`.mcp.json`.
  - **Acceptance**: `git status --porcelain` no reporta `.codegraph/`; `git add -A` no stagea nada de esa carpeta.
  - **Files**: `.gitignore`.
  - **Tests**: `git status --porcelain` antes/después, `git add -A && git status --porcelain`.
  - **Effort**: XS

## Effort Estimate

**Total**: XS.
