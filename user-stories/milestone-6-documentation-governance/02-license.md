# Archivo LICENSE

## User Story

```
As mantenedor único de audio-sync-app
I want un archivo LICENSE explícito en la raíz del repo
In order to dejar claros los términos de uso del código
```

## Technical Context

- No existe archivo `LICENSE` hoy en la raíz del repo.
- Prerequisito trivial para que un futuro `license-check` (mencionado en el README como job de CI, aquí
  simplificado a un chequeo dentro de `make validate`) tenga sentido.

## Acceptance Criteria

```gherkin
Feature: Archivo de licencia presente

  Scenario: El archivo LICENSE existe en la raíz
    Given reviso la raíz del repo
    When busco un archivo LICENSE
    Then existe y no está vacío

  Scenario: Un chequeo trivial de presencia pasa
    Given existe un target "license-check" dentro de make validate
    When lo ejecuto
    Then retorna código de salida 0 porque encuentra el archivo LICENSE
```

## Definition of Done

- `LICENSE` versionado en la raíz con la licencia elegida por el mantenedor.
- `license-check` trivial (`test -f LICENSE`) agregado a `make validate`.

## Effort: XS
