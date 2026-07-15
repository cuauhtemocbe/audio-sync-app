# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Secret scanning en `pre-commit` con `gitleaks` como segunda barrera contra secretos (#7).
- Endurecimiento de la imagen de producción: `HEALTHCHECK`, usuario no-root, pinning por digest `sha256` (#9,
  #10, #11).
- `LICENSE` (MIT) y target `license-check` en `make validate` (#13).

### Changed

- Verificación documentada de que `SONARQUBE_PROJECT_KEY` no correspondía a un proyecto real en el servidor
  (#8) — pendiente crear el proyecto en SonarQube.

## [1.0.0] - 2026-07-15

### Added

- SPA en React + Vite que resalta palabra por palabra una transcripción sincronizada con un audio
  (`getActiveWordIndex`).
- Suite de tests con Vitest + React Testing Library, cubriendo la lógica de sincronización con los casos
  ZOMBIES (#1, #2).
- `Makefile` como interfaz única de desarrollo y git hooks graduados con Husky (pre-commit rápido, pre-push
  completo solo en `main`) (#3, #4).
- ESLint (flat config) + Prettier, con `make validate` encadenando `lint → test → build` (#5, #6).
- Tema oscuro y mejoras de UX en el resaltado de la palabra activa.

### Changed

- Puerto del entorno de desarrollo corregido en Docker Compose.

### Removed

- Configuración de devcontainer (no se usaba; el flujo pasa por Docker Compose vía `Makefile`).
- `node_modules/` dejó de trackearse en git (estaba trackeado desde antes de que existiera `.gitignore`).
