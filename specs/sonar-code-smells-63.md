---
title: Corregir 5 code smells de Sonar (issue #63)
status: in-progress
created: 2026-09-26
updated: 2026-09-26
issue: '#63'
---

# Corregir 5 code smells de Sonar

## Objective

Dejar en 0 las `new_violations` del Quality Gate de `audio-sync-app` corrigiendo los 5 code smells
del issue #63, sin cambiar el comportamiento observable de la app.

## Context

El análisis de Sonar sobre el código de la reescritura TTS (Waves 1-4) reportó 5 code smells. Cobertura
(96.2%) y duplicación (0.0%) ya pasan; solo falla la condición de cero violaciones nuevas.

## Requirements

### Functional Requirements

- [ ] `src/chunkText.js:14` (S8786): reemplazar `/^(\s*)([\s\S]*)$/` por un match lineal (`/^\s*/`) más
      `slice`; misma salida `{ separator, content }` para cualquier entrada.
- [ ] `src/App.jsx:170` (S4084): el `<audio>` lleva un `<track kind="captions" />`.
- [ ] `src/generateNarration.js:36` y `:87` (S7758): `charCodeAt` → `codePointAt`.
- [ ] `src/alignmentToWords.js:14` (S7786): `new Error` → `new TypeError` en la validación de tipo del
      alignment (el `Error` de longitudes distintas no es un chequeo de tipo, no se toca).

### Non-Functional Requirements

- [ ] Sin cambios de comportamiento: la suite existente sigue en verde sin modificar aserciones.
- [ ] Cobertura no baja del umbral enforced en `vite.config.js`.

## Architecture

Cambios locales a cuatro archivos existentes; sin componentes ni dependencias nuevas.

## Testing Strategy

### Unit Tests

- `chunkText`: los tests existentes de separadores (`\n`, `\n\n`, oraciones pegadas) ya cubren la
  equivalencia del nuevo match; no se agrega test de timing (flaky, y la regex vieja siempre matchea).
- `alignmentToWords`: assert de que el alignment inválido lanza `TypeError`.
- `App`: assert de que el `<audio>` renderizado contiene `<track kind="captions">`.
- `generateNarration`: sin cambios; los tests de WAV/base64 existentes cubren `codePointAt`.

## Boundaries & Constraints

### In Scope

- Los 5 smells listados.

### Out of Scope

- Generar un VTT dinámico a partir de `words` (fuera de scope explícito en `specs/wave4-ui-rewrite.md`).
  El `<track>` no lleva `src`: satisface la regla S4084 pero no aporta pista de subtítulos; el
  transcript sincronizado en pantalla sigue siendo la alternativa textual.
- Cualquier otro issue de Sonar.

## Success Criteria

- [ ] `make validate` verde (lock-check, lint, coverage, build, license-check).
- [ ] Tras merge y nuevo scan: `new_violations` = 0 y Quality Gate `OK` (no verificable localmente).

## Implementation Plan

Slicing vertical: un commit por smell (o par de smells del mismo archivo), cada uno con su test.

1. `chunkText.js` regex + test — XS
2. `alignmentToWords.js` TypeError + test — XS
3. `generateNarration.js` codePointAt — XS
4. `App.jsx` track captions + test — XS
