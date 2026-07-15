# .codegraph/ en .gitignore

## User Story

```
As mantenedor único de audio-sync-app
I want que .codegraph/ (la cache de indexado local de CodeGraph) esté en .gitignore
In order to no arriesgarme a trackear por error una cache binaria que solo tiene sentido en mi máquina, ante un "git add -A" descuidado
```

## Technical Context

- `.codegraph/` es la carpeta de índice de CodeGraph (herramienta de exploración de código configurada
  globalmente para Claude Code, ver `CLAUDE.md` global del usuario). Aparece como `??` (untracked) en
  `git status` en cada sesión, pero **no está en `.gitignore`** — a diferencia de `.claude/` y `.mcp.json`, que
  sí lo están.
- El estándar de referencia (sección 7) nombra `.codegraph/` explícitamente como ejemplo de "config/cache
  local-only que se gitignorea por el mismo motivo que `.env`" — no es secreto, pero acopla el repo a una
  herramienta que no todos los colaboradores (ni el propio CI, si existiera) tienen garantizada.

## Acceptance Criteria

```gherkin
Feature: Cache de CodeGraph ignorada por git

  Scenario: .codegraph/ no aparece en git status
    Given .codegraph/ existe en el working directory (generado por un init previo de CodeGraph)
    When ejecuto "git status --porcelain"
    Then no aparece ninguna línea referida a archivos dentro de .codegraph/

  Scenario: Un git add -A no stagea archivos de .codegraph/
    Given .codegraph/ existe con contenido
    When ejecuto "git add -A" seguido de "git status --porcelain"
    Then ningún archivo de .codegraph/ queda en el área de staging
```

## Definition of Done

- Entrada `.codegraph/` agregada a `.gitignore`.
- Verificado con `git status` que ya no aparece como untracked.
- Si `.codegraph/` llegó a trackearse por error en algún momento, correr `git rm -r --cached .codegraph/` para
  destrackearlo (verificar primero con `git ls-files .codegraph/` si aplica).

## Effort: XS
