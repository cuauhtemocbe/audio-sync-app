# Verificar SONARQUBE_PROJECT_KEY contra el proyecto real

## User Story

```
As mantenedor único de audio-sync-app
I want confirmar que el SONARQUBE_PROJECT_KEY configurado en .mcp.json corresponde al proyecto real de audio-sync-app en el servidor
In order to no confiar en métricas de calidad que en silencio pertenezcan a otro proyecto
```

## Technical Context

- `.mcp.json` ya tiene `SONARQUBE_PROJECT_KEY="audio-sync-app"`.
- El README (sección 5) señala que las tools del MCP de SonarQube sin parámetro de proyecto explícito (ej.
  `get_component_measures`, `search_files_by_coverage`) usan ese valor como default *sin avisar* si el key fue
  mal copiado de otro proyecto al bootstrapear este repo desde la plantilla de referencia.

## Acceptance Criteria

```gherkin
Feature: Verificación del project key de SonarQube

  Scenario: El project key configurado existe en el servidor
    Given SONARQUBE_PROJECT_KEY vale "audio-sync-app" en .mcp.json
    When consulto get_project_quality_gate_status con projectKey="audio-sync-app"
    Then la respuesta no es un error de "proyecto no encontrado"

  Scenario: Las métricas devueltas corresponden al proyecto correcto
    Given consulto una tool sin parámetro de proyecto explícito (ej. get_component_measures)
    When comparo el campo component.key de la respuesta
    Then coincide con "audio-sync-app" y no con otro proyecto
```

## Definition of Done

- Verificación documentada (nota en `CLAUDE.md` o commit dedicado) de que el key fue chequeado contra el
  servidor, no solo copiado de otro proyecto.

## Effort: XS
