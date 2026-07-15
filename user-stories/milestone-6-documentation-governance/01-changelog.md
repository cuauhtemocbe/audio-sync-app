# CHANGELOG.md siguiendo Keep a Changelog

## User Story

```
As mantenedor único de audio-sync-app
I want un CHANGELOG.md siguiendo el formato Keep a Changelog
In order to tener un historial legible para humanos de qué cambió entre versiones, más allá del git log
```

## Technical Context

- No existe `CHANGELOG.md` hoy. `package.json` tiene `"version": "1.0.0"`.
- Formato: [Keep a Changelog](https://keepachangelog.com/) + [SemVer](https://semver.org/), sincronizado con el
  campo `version` de `package.json`.

## Acceptance Criteria

```gherkin
Feature: Changelog versionado

  Scenario: El changelog existe con la estructura esperada
    Given reviso la raíz del repo
    When abro CHANGELOG.md
    Then contiene las secciones "Added", "Changed", "Fixed" o "Removed" para al menos una versión

  Scenario: La versión del changelog coincide con package.json
    Given la última entrada versionada del changelog tiene un número de versión
    When comparo ese número contra el campo "version" de package.json
    Then coinciden

  Scenario: Un cambio nuevo se agrega bajo "Unreleased" antes de versionar
    Given se implementa un cambio que aún no fue versionado
    When se documenta en el changelog
    Then aparece bajo una sección "Unreleased" hasta el próximo release
```

## Definition of Done

- `CHANGELOG.md` en la raíz, formato Keep a Changelog + SemVer.
- Versión sincronizada con `package.json`.

## Effort: XS
