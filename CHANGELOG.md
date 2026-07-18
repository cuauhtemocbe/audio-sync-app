# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-07-18

### Added

- Secret scanning en `pre-commit` con `gitleaks` como segunda barrera contra secretos (#7).
- Endurecimiento de la imagen de producción: `HEALTHCHECK`, usuario no-root, pinning por digest `sha256` (#9,
  #10, #11).
- `LICENSE` (MIT) y target `license-check` en `make validate` (#13).
- Tabla de design tokens del tema oscuro documentada en `CLAUDE.md`, con autocrítica de por qué esa paleta (#14).
- Soporte a `prefers-reduced-motion` en el resaltado de la palabra activa, vía el hook
  `usePrefersReducedMotion` (#15).
- Proyecto `audio-sync-app` creado en el servidor de SonarQube y reporter `lcov` agregado a la cobertura de
  Vitest para que le llegue a Sonar (#16).
- `HEALTHCHECK` en `Dockerfile.dev` (#19).
- `.codegraph/` agregado a `.gitignore` (#22).
- Cobertura mínima *enforced*, no solo reportada: thresholds en `vite.config.js` sobre
  `getActiveWordIndex.js` y `usePrefersReducedMotion.js` (#23).
- Identidad visual propia derivada del dominio: paleta VU-meter (`theme.extend.colors.vu`), tipografía
  diferenciada por función (`font-display`/`font-body`/`font-mono`) e ícono de marca propio en
  `public/favicon.svg` (#24, #25, #26).
- Dependabot habilitado para actualizaciones de dependencias npm y de las imágenes base de Docker.
- Palabras del transcript operables por teclado y archivo de captions (`captions.vtt`) para el audio.

### Changed

- Puerto de nginx en producción inyectado por la variable de entorno `PORT` (Railway la asigna en runtime) en
  vez de quedar hardcodeado a `8080` (#18).
- Imagen `nginx:alpine` de producción auditada y reducida (~55.6 MiB → ~32.0 MiB de paquetes instalados),
  purgando `curl` y `nginx-module-image-filter`, que de paso resolvió los CVEs HIGH de c-ares/curl/libexpat
  reportados por Trivy (#17, #20).
- `worker_processes` de nginx fijado a `1` para evitar 502s de arranque; warnings de arranque/apagado
  silenciados.
- Imagen base de Node bumpeada de 20 a 22 (dev y build de producción) y luego a 26 (dev).
- `window.matchMedia` reemplazado por `globalThis.matchMedia` en `usePrefersReducedMotion` para no depender
  implícitamente del entorno browser.
- Versiones mayores actualizadas vía Dependabot: React 18 → 19, Vite 6 → 8, Tailwind CSS 3 → 4,
  `@vitejs/plugin-react`, `autoprefixer`, `esbuild`, imagen base `nginx`.

### Fixed

- `Dockerfile.dev` corre como usuario no-root: resolvía tanto el hallazgo HIGH de Trivy (`DS-0002`) como que
  `coverage/` quedara con dueño `root` en el host tras `make coverage`.
- Vulnerabilidad de bypass en `server.fs.deny` de Vite corregida vía bump de versión.

### Removed

- `user-stories/` (borrador del backlog previo a publicarlo en GitHub Issues) — GitHub Issues es la fuente de
  verdad desde 2026-07-16, no hacía falta duplicarlo en el repo.

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
