# Tipografía diferenciada por función

## User Story

```
As mantenedor único de audio-sync-app
I want tipografías distintas para título, cuerpo de texto y cifras
In order to que cada tipo de contenido use la fuente que mejor lo comunica, en vez de heredar el font stack default de Tailwind en todos lados
```

## Technical Context

- `tailwind.config.js` no define ninguna familia tipográfica custom (`theme.extend.fontFamily` vacío) — todo el
  texto (`<h1>`, palabras del transcript, indicador de tiempo) usa el font stack default del navegador vía
  Tailwind.
- El estándar de referencia (sección 10) pide: una tipografía de **display** (títulos, con moderación), una de
  **cuerpo** (texto/labels/UI), y si el producto muestra cifras, una **monoespaciada** solo para números — para
  alinear dígitos y facilitar comparar valores de un vistazo.
- Candidato concreto en este proyecto para la fuente monoespaciada: el indicador `"Tiempo actual: {currentTime.
  toFixed(2)} segundos"` en `src/App.jsx` — un número que cambia varias veces por segundo, hoy con una fuente
  proporcional donde el ancho del texto "salta" con cada dígito distinto.

## Acceptance Criteria

```gherkin
Feature: Tipografía por función

  Scenario: El título usa la tipografía de display configurada
    Given tailwind.config.js define una familia "display" en theme.extend.fontFamily
    When reviso la clase de fuente del <h1> en App.jsx
    Then usa esa familia, no el default

  Scenario: El cuerpo de texto usa la tipografía de body configurada
    Given tailwind.config.js define una familia "body"
    When reviso la clase de fuente del contenedor de la transcripción
    Then usa esa familia

  Scenario: El indicador de tiempo usa una fuente monoespaciada
    Given tailwind.config.js define una familia "mono" (o usa la utilidad font-mono de Tailwind)
    When reviso la clase de fuente del párrafo "Tiempo actual: ..."
    Then usa una fuente monoespaciada, y los dígitos no cambian de ancho entre sí al variar el valor
```

## Definition of Done

- `theme.extend.fontFamily` en `tailwind.config.js` con las tres familias (display/body/mono), cargadas vía
  Google Fonts (`@import` en `index.css` o `<link>` en `index.html`) o self-hosted, según se decida.
- `App.jsx` migrado para usar cada clase donde corresponde.
- Verificado manualmente en navegador (checklist de `CLAUDE.md`) que las tres tipografías se aplican y son
  legibles en el tema oscuro.
- Sin regresión en la suite de tests existente.

## Effort: S
