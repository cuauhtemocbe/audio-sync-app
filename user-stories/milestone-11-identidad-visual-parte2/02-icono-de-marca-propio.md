# Ícono de marca propio en vez de emoji/ícono de stock genérico

## User Story

```
As mantenedor único de audio-sync-app
I want un único ícono de marca propio, usado con disciplina en el título y el favicon
In order to tener un elemento visual memorable en vez de un emoji de placeholder o un ícono de stock sin relación con el producto
```

## Technical Context

- `src/App.jsx` usa un emoji (🎧) en el `<h1>`: `"🎧 Texto sincronizado con audio"`.
- `public/favicon.svg` **tampoco es un ícono propio**: es un SVG genérico descargado de svgrepo.com (el propio
  archivo trae el comentario `<!-- Uploaded to: SVG Repo -->`), y visualmente es un ícono de libro/marcador —
  sin relación evidente con "audio sincronizado con texto".
- El estándar de referencia (sección 10) pide "un solo elemento de marca memorable, usado con disciplina... en
  vez de un emoji de placeholder", con todo lo demás sobrio alrededor de esa única firma.
- Alcance sugerido: diseñar (o encargar) un ícono propio simple (ej. una forma de onda + un cursor de texto, o
  un motivo que combine audio y texto) y reusarlo tanto en el favicon como en el título — un solo asset, dos
  usos, no un ícono para el favicon y otro distinto para el título.

## Acceptance Criteria

```gherkin
Feature: Ícono de marca propio

  Scenario: El favicon ya no es el SVG de stock genérico
    Given reviso public/favicon.svg
    When busco el comentario "Uploaded to: SVG Repo" u otro indicio de ícono de stock
    Then no aparece — el archivo es un ícono propio del proyecto

  Scenario: El título usa el mismo ícono de marca en vez de un emoji
    Given reviso el <h1> en src/App.jsx
    When busco el emoji 🎧
    Then ya no está — en su lugar se referencia el mismo ícono usado en el favicon

  Scenario: El ícono se usa con disciplina, no decorando cada sección
    Given reviso todo App.jsx
    When cuento cuántas veces aparece el ícono de marca
    Then aparece una sola vez (el resto de la UI se mantiene sobrio, sin decoración adicional)
```

## Definition of Done

- Ícono propio creado (SVG), reemplazando tanto `public/favicon.svg` como el emoji del `<h1>`.
- Verificado visualmente en navegador que el favicon se ve correctamente en la pestaña.
- No se agregan más íconos/emojis decorativos en otras partes de la UI.

## Effort: S
