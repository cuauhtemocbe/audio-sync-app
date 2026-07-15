# Respetar prefers-reduced-motion en el resaltado de palabra

## User Story

```
As mantenedor único de audio-sync-app
I want que la animación de transición al resaltar la palabra activa respete la preferencia de movimiento reducido del sistema operativo
In order to no imponer una animación no trivial a usuarios que la desactivaron explícitamente por motivos de accesibilidad
```

## Technical Context

- `src/App.jsx` anima hoy la transición de la palabra activa (ver commits "Improve highlight for active word",
  "Improve active text visualization"). No hay ninguna verificación de `prefers-reduced-motion` implementada.
- Requisito de accesibilidad no opcional según el README (sección 10): cualquier animación no trivial debe leer
  `window.matchMedia('(prefers-reduced-motion: reduce)')` o el equivalente `@media` en CSS y degradar a una
  versión instantánea.

## Acceptance Criteria

```gherkin
Feature: Accesibilidad de movimiento en el resaltado de palabra

  Scenario: La animación se muestra normalmente sin preferencia de movimiento reducido
    Given el sistema operativo no tiene activada la preferencia de movimiento reducido
    When una nueva palabra se vuelve activa
    Then la transición de resaltado se anima como hoy

  Scenario: La animación se desactiva con movimiento reducido activado
    Given el sistema operativo tiene activada "prefers-reduced-motion: reduce"
    When una nueva palabra se vuelve activa
    Then el resaltado cambia de forma instantánea, sin transición animada

  Scenario: El cambio de preferencia en caliente se respeta sin recargar la página
    Given la app está abierta y la preferencia de movimiento reducido está desactivada
    When el usuario la activa desde la configuración del sistema sin recargar la página
    Then las siguientes transiciones de palabra activa dejan de animarse
```

## Definition of Done

- Uso de `window.matchMedia('(prefers-reduced-motion: reduce)')` o el equivalente `@media` en CSS.
- Test con Vitest + jsdom mockeando `matchMedia` para los tres escenarios.
- Probado manualmente en navegador con la preferencia del sistema activada (checklist de `CLAUDE.md`).

## Effort: S
