# Secret scanning en pre-commit

## User Story

```
As mantenedor único de audio-sync-app
I want que un hook de pre-commit escanee el diff en busca de secretos antes de commitear
In order to evitar que un token (ej. el de SonarQube en .mcp.json) llegue al historial de git aunque el archivo quede gitignoreado por error humano
```

## Technical Context

- `.mcp.json` y `.claude/` ya están en `.gitignore` (verificado: `git check-ignore -v .mcp.json` los confirma
  ignorados y no trackeados). Esta historia es una segunda barrera, no una corrección de un problema existente.
- Herramienta sugerida: `gitleaks` (binario standalone, sin dependencia de Python).
- Depende de que exista `.husky/pre-commit` ([M2-02](../milestone-2-developer-workflow/02-git-hooks-graduados.md)).

## Acceptance Criteria

```gherkin
Feature: Detección de secretos antes de commitear

  Scenario: Un commit sin secretos pasa el hook sin problemas
    Given el diff staged no contiene patrones de credenciales conocidos
    When hago "git commit"
    Then el hook de pre-commit ejecuta gitleaks
    And el commit se completa normalmente

  Scenario: Un commit con un token conocido es bloqueado
    Given el diff staged incluye un archivo con un valor que matchea el patrón de un token (ej. "squ_" de SonarQube)
    When hago "git commit"
    Then el hook de pre-commit aborta el commit
    And el mensaje indica el archivo y la línea donde se detectó el secreto

  Scenario: Un falso positivo documentado se puede exceptuar
    Given existe una excepción documentada en la config de gitleaks para un patrón específico
    When ese patrón aparece en el diff staged
    Then el hook no bloquea el commit
```

## Definition of Done

- `gitleaks` (o `detect-secrets`) integrado en `.husky/pre-commit`.
- Config de excepciones versionada (`.gitleaks.toml` o equivalente) si hace falta alguna.

## Effort: XS
