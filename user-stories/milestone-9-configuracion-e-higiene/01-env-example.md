# .env.example versionado

## User Story

```
As mantenedor único de audio-sync-app
I want un .env.example versionado con las claves que el proyecto espera (sin valores reales)
In order to poder recrear un .env local funcional sin tener que adivinar qué variables hacen falta
```

## Technical Context

- Existe un `.env` real en la raíz del repo (gitignoreado, correcto), pero no hay ninguna plantilla versionada
  que documente qué claves espera. Si el `.env` local se pierde, no hay forma de reconstruirlo sin adivinar.
- El estándar de referencia (`/home/kuautli/Projects/README.md`, sección 7) pide explícitamente `.env.example`
  versionado como contraparte del `.env` gitignoreado.

## Acceptance Criteria

```gherkin
Feature: Plantilla de variables de entorno

  Scenario: .env.example existe y está versionado
    Given reviso la raíz del repo
    When busco un archivo .env.example
    Then existe y está trackeado en git

  Scenario: .env.example no contiene valores reales
    Given abro .env.example
    When reviso cada línea
    Then los valores son placeholders (ej. "changeme", cadena vacía) y no credenciales ni datos reales

  Scenario: Las claves de .env.example coinciden con las que usa el proyecto
    Given tomo cada clave declarada en .env.example
    When busco esa clave en el código o la configuración (Docker Compose, Vite, etc.)
    Then cada clave está efectivamente en uso — no hay claves obsoletas ni faltantes
```

## Definition of Done

- `.env.example` creado en la raíz, con las mismas claves que `.env` pero con placeholders.
- Claves verificadas contra el uso real en el código (no copiadas de memoria).
- `.gitignore` sigue ignorando `.env` y `.env.*` — confirmar que el patrón actual (`.env.*`) no ignora también
  `.env.example` sin querer (ajustar a `.env.local`/`.env.*.local` si hiciera falta distinguir).

## Effort: XS
