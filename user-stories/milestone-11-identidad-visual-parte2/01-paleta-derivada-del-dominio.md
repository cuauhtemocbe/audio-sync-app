# Paleta derivada del dominio del producto

## User Story

```
As mantenedor único de audio-sync-app
I want que la paleta de colores se derive de algo literal del dominio (audio + texto sincronizado), no de la paleta default de Tailwind
In order to que la identidad visual sea una decisión de producto y no el default genérico de cualquier scaffold de Tailwind
```

## Technical Context

- La paleta actual (`bg-gray-900`, `text-gray-100`, `text-orange-400`/`decoration-orange-500`, `text-gray-400`)
  es la paleta **default de Tailwind sin personalizar** (`tailwind.config.js` no tiene `theme.extend` con
  colores propios). Documentada con autocrítica en `CLAUDE.md` (milestone-6), pero esa autocrítica explica por
  qué la paleta *funciona* (contraste, legibilidad), no que esté *derivada del dominio* — son dos cosas
  distintas y el estándar de referencia (sección 10) pide lo segundo explícitamente, con el ejemplo concreto de
  AvocadoDash (paleta leída del corte transversal de un aguacate real, descartando tanto "cream + serif +
  terracota" como "casi-negro + acento neón" por genéricos).
- Ideas de dominio para este proyecto (a validar/iterar, no prescriptivas): tonos inspirados en una forma de
  onda de audio, en el resaltado tipo "karaoke"/lector de e-book, o en el espectro de un VU-meter — cualquier
  alternativa debe justificarse contra al menos dos paletas genéricas descartadas, como hace el ejemplo de
  referencia.
- Este trabajo probablemente amerita usar el skill `/frontend-design` antes de tocar CSS (recomendado
  explícitamente por la sección 10 del estándar).
- Es un restyle puro: no debe cambiar `getActiveWordIndex` ni ningún otro comportamiento — la suite de tests
  existente (12 tests) debe seguir pasando sin modificarse.

## Acceptance Criteria

```gherkin
Feature: Paleta derivada del dominio

  Scenario: tailwind.config.js define colores nombrados por su rol en el dominio
    Given reviso tailwind.config.js
    When busco la sección theme.extend.colors
    Then existen colores custom con nombres semánticos del dominio (ej. "waveform", "highlight"), no solo la paleta default sin configurar

  Scenario: App.jsx usa el tema custom en vez de los colores default de Tailwind
    Given reviso las clases de App.jsx
    When busco bg-gray-900, text-orange-400, decoration-orange-500 (los valores actuales)
    Then ya no aparecen esas clases default — aparecen las clases del tema custom definido

  Scenario: La tabla de design tokens en CLAUDE.md refleja los nuevos valores
    Given abro la tabla de tokens en CLAUDE.md
    When comparo cada valor hex contra tailwind.config.js
    Then coinciden, y la sección de autocrítica documenta qué paleta genérica (la actual gray+orange) se descartó y por qué

  Scenario: El restyle no rompe la suite de tests existente
    Given los 12 tests actuales (getActiveWordIndex, usePrefersReducedMotion)
    When aplico el nuevo tema y corro "npm test"
    Then los 12 tests siguen pasando sin modificarse
```

## Definition of Done

- Nueva paleta definida en `tailwind.config.js` (`theme.extend.colors`), derivada de un elemento literal del
  dominio (a definir en el diseño, no en esta historia).
- `App.jsx` migrado a las nuevas clases.
- Tabla de tokens y autocrítica en `CLAUDE.md` actualizadas (reemplaza la sección escrita en milestone-6).
- Verificado manualmente en navegador (checklist de `CLAUDE.md`) que el contraste y la legibilidad no empeoran
  respecto a la paleta actual.
- Suite de tests (12 tests) sin modificar y en verde.

## Effort: M
