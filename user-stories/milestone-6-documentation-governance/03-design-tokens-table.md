# Tabla de design tokens y autocrítica de la UI

## User Story

```
As mantenedor único de audio-sync-app
I want documentar los tokens de color/tipografía del tema oscuro ya implementado y por qué se descartaron alternativas
In order to que un cambio futuro no "corrija" la paleta de vuelta a un default genérico sin contexto
```

## Technical Context

- El tema oscuro y el favicon ya están implementados (commits "Set to dark theme", "add favicon", "feat: Improve
  UX design", "Improve active text visualization", "Improve highlight for active word"). Esta historia documenta
  lo ya construido, no cambia el diseño visual.
- Ubicación sugerida: sección nueva en `CLAUDE.md` o un `docs/design.md` referenciado desde ahí.

## Acceptance Criteria

```gherkin
Feature: Documentación de identidad visual

  Scenario: Existe una tabla de tokens documentada
    Given reviso la documentación de UI del proyecto
    When busco la tabla de design tokens
    Then lista cada token con su valor hexadecimal y su uso (ej. fondo, texto activo, acento)

  Scenario: Existe una sección de autocrítica
    Given reviso la misma documentación
    When busco la sección de alternativas descartadas
    Then explica qué paletas o enfoques se consideraron y por qué se eligió el actual

  Scenario: Los tokens documentados coinciden con los valores reales en el CSS
    Given tomo un token de la tabla (ej. color de palabra activa)
    When lo busco en index.css o en la configuración de Tailwind
    Then el valor hexadecimal coincide con el documentado
```

## Definition of Done

- Tabla `token → hex → uso` en `CLAUDE.md` o `docs/design.md`.
- Sección de autocrítica con alternativas descartadas.
- Valores verificados contra `src/index.css` / `tailwind.config.js` reales, no inventados de memoria.

## Effort: XS
