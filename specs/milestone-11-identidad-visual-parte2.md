---
title: Milestone 11 — Identidad visual (parte 2)
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#24, #25, #26"
---

# Milestone 11 — Identidad visual (parte 2)

## Objective

Reemplazar la paleta default de Tailwind, el ícono de stock genérico y la tipografía default del navegador por
una identidad visual derivada de un artefacto literal del dominio de audio — el **VU-meter** (medidor de nivel
analógico usado en producción de radio/podcast para monitorear voz grabada) — de forma que el restyle sea una
decisión de producto justificada, no un ajuste cosmético aislado. Las tres historias se implementan juntas
porque comparten una única decisión de diseño de origen (el concepto VU-meter) que debe ser consistente entre
paleta, ícono y tipografía.

## Context

Historias de origen: [user-stories/milestone-11-identidad-visual-parte2](../user-stories/milestone-11-identidad-visual-parte2)
(issues #24, #25, #26). Es un restyle puro: no debe cambiar `getActiveWordIndex`, `usePrefersReducedMotion` ni
ningún otro comportamiento — la suite de 12 tests existente debe seguir pasando sin modificarse.

Estado actual (código real, verificado):

- Paleta: `bg-gray-900`/`text-gray-100`/`text-orange-400`/`decoration-orange-500`/`text-gray-400` — paleta
  default de Tailwind sin `theme.extend.colors` (`tailwind.config.js` no tiene tema custom).
- Ícono: `public/favicon.svg` es un SVG de stock de svgrepo.com (contiene el comentario
  `<!-- Uploaded to: SVG Repo -->`, visualmente un libro/marcador sin relación con audio). El `<h1>` de
  `src/App.jsx` usa el emoji 🎧.
- Tipografía: `tailwind.config.js` no define `theme.extend.fontFamily` — todo el texto usa el font stack default
  del navegador vía Tailwind.

### Plan de diseño (brainstorm previo a la implementación)

**Concepto (signature)**: el VU-meter es el instrumento históricamente usado para monitorear el nivel de una
señal de voz grabada — el dominio exacto de esta app (audio hablado + transcripción sincronizada). Se traduce
así: el estado "en reposo" de la app (nada resaltado) es la zona segura/verde del medidor; la palabra activa es
la aguja llegando al pico — la zona roja. El ícono de marca es una miniatura literal de lo que la propia UI ya
hace: barras de nivel con un pico resaltado y un subrayado, igual que una palabra activa.

**Color** — 4 tokens con nombre semántico de dominio, namespace `vu` en `theme.extend.colors`:

| Token | Hex | Uso | Origen del nombre |
| --- | --- | --- | --- |
| `vu-housing` | `#0d1410` | Fondo de toda la app | Carcasa oscura del medidor analógico |
| `vu-scale` | `#d7e4d8` | Texto base (título, palabras inactivas) | Marcas de escala iluminadas del dial |
| `vu-peak` | `#ff5a36` | Acento de la palabra activa (texto + subrayado) | Zona roja/pico del medidor |
| `vu-dial` | `#8fa190` | Texto secundario (indicador de tiempo) | Zona no iluminada del dial |

Contraste estimado (a confirmar en navegador, ver Testing Strategy): `vu-scale` sobre `vu-housing` ≈ 14.5:1;
`vu-peak` sobre `vu-housing` ≈ 6.4:1; `vu-dial` sobre `vu-housing` ≈ 6:1 — los tres superan el mínimo AA (4.5:1
texto normal).

**Paletas genéricas descartadas** (requisito explícito de la historia #24):

1. *Cream + serif + terracota* (el default de scaffold-con-buen-gusto): fondo claro. Se descarta porque
   contradice la decisión ya tomada y documentada en milestone-6 (fondo oscuro para sesiones de lectura largas)
   y no tiene ninguna relación con el dominio de audio.
2. *Casi-negro + acento neón único* (verde ácido o similar, el cliché "modo terminal/hacker"): aunque es oscuro
   (compatible con la razón de milestone-6), es un acento genérico sin relación específica con *este* producto
   — el mismo acento serviría para cualquier app de terminal, IDE o dashboard. Se descarta por no ser literal del
   dominio (audio hablado + VU-meter), a diferencia de la paleta elegida.

**Tipografía** — 3 familias con rol distinto, `theme.extend.fontFamily`:

| Rol | Familia | Uso | Por qué |
| --- | --- | --- | --- |
| Display | Space Grotesk (600/700) | `<h1>` únicamente | Geométrica con carácter técnico, moderada — para un solo título, no satura |
| Body | Inter | Palabras del transcript, controles | Alta legibilidad para lectura prolongada de texto corrido — el caso de uso central de la app |
| Mono | IBM Plex Mono | Indicador de tiempo (`Tiempo actual: X.XX segundos`) | Cifras tabulares que no cambian de ancho entre sí al variar el dígito — evita el "salto" visual en un número que se actualiza 10x/seg; Plex tiene un carácter de panel de instrumento coherente con el concepto VU-meter |

Carga vía `@import` de Google Fonts en `src/index.css` (consistente con el `index.css` actual, minimalista sin
build step adicional).

**Ícono de marca**: SVG monolineal — 4 barras verticales de altura creciente (estilo ecualizador/waveform), la
tercera barra (la más alta, posición de "pico") en `vu-peak`, el resto en `vu-scale`, con un trazo horizontal
corto debajo de la barra de pico (el mismo lenguaje visual que el subrayado de la palabra activa en la UI). Es
una miniatura literal de la interacción real de la app, no un ícono decorativo genérico. Reemplaza tanto
`public/favicon.svg` como el emoji 🎧 del `<h1>` — un solo asset, dos usos, sin agregar íconos en ningún otro
lugar de la UI (la historia #25 pide disciplina: un solo uso visible por render, no un ícono repetido).

## Requirements

### Functional Requirements

- [ ] `tailwind.config.js` define `theme.extend.colors.vu` con los 4 tokens (`housing`, `scale`, `peak`, `dial`).
- [ ] `App.jsx` migrado: `bg-gray-900`→`bg-vu-housing`, `text-gray-100`→`text-vu-scale`,
      `text-orange-400`/`decoration-orange-500`→`text-vu-peak`/`decoration-vu-peak`, `text-gray-400`→`text-vu-dial`.
- [ ] `index.html` (`<body class="bg-gray-900 text-gray-100 ...">`) migrado a las mismas clases custom, para que
      no haya un flash del tema viejo antes de que React monte.
- [ ] `tailwind.config.js` define `theme.extend.fontFamily` con `display` (Space Grotesk), `body` (Inter) y
      `mono` (IBM Plex Mono).
- [ ] `src/index.css` importa las 3 familias desde Google Fonts.
- [ ] `<h1>` usa `font-display`; el contenedor del transcript usa `font-body` (o se deja como body default si
      Tailwind ya resuelve `font-sans` a la familia body — a decidir en plan); el párrafo del indicador de tiempo
      usa `font-mono`.
- [ ] Nuevo `public/favicon.svg` (ícono de marca propio, ver diseño arriba) reemplaza el SVG de stock.
- [ ] `<h1>` reemplaza el emoji 🎧 por el mismo ícono (inline SVG o `<img src="/favicon.svg">`).
- [ ] El ícono de marca aparece una sola vez en toda la UI.
- [ ] Tabla de design tokens en `CLAUDE.md` (sección "Design tokens (tema oscuro)") actualizada con los nuevos
      valores y la autocrítica reemplazada por la justificación del concepto VU-meter (incluyendo las 2 paletas
      genéricas descartadas).

### Non-Functional Requirements

- [ ] Accesibilidad: contraste texto/fondo ≥ 4.5:1 para `vu-scale`, `vu-peak` y `vu-dial` sobre `vu-housing`,
      verificado en navegador real (no solo estimado).
- [ ] Sin regresión: los 12 tests existentes pasan sin modificarse.

## Architecture

### Components

- `tailwind.config.js`: `theme.extend.colors.vu.{housing,scale,peak,dial}`,
  `theme.extend.fontFamily.{display,body,mono}`.
- `src/index.css`: `@import` de Google Fonts (Space Grotesk, Inter, IBM Plex Mono) antes de las directivas
  `@tailwind`.
- `src/App.jsx`: clases migradas (colores + fuentes), emoji reemplazado por ícono inline.
- `index.html`: clases del `<body>` migradas, `<title>` sin cambios (fuera de alcance).
- `public/favicon.svg`: ícono de marca nuevo (waveform + pico + subrayado).
- `CLAUDE.md`: tabla de tokens y autocrítica reemplazadas.

## User Stories

- [#24 — Paleta derivada del dominio del producto](../user-stories/milestone-11-identidad-visual-parte2/01-paleta-derivada-del-dominio.md)
- [#25 — Ícono de marca propio en vez de emoji/ícono de stock genérico](../user-stories/milestone-11-identidad-visual-parte2/02-icono-de-marca-propio.md)
- [#26 — Tipografía diferenciada por función](../user-stories/milestone-11-identidad-visual-parte2/03-tipografia-por-funcion.md)

## Testing Strategy

- `npm test` (12 tests) sin modificar — deben seguir en verde tras el restyle completo.
- Verificación manual en navegador (`make dev`, checklist de CLAUDE.md): contraste legible en las tres
  combinaciones de color, favicon visible correctamente en la pestaña, las tres tipografías aplicadas y
  legibles, el indicador de tiempo con dígitos de ancho fijo (mono) sin "salto" visual al actualizarse.
- Verificación de contraste con las DevTools del navegador (o una herramienta de contraste) sobre los 3 pares
  texto/fondo, confirmando ≥ 4.5:1 (no solo el estimado del spec).
- Grep manual sobre `App.jsx` para confirmar que no quedan clases `gray-900`/`text-orange-400`/`decoration-orange-500`
  ni el emoji 🎧.

## Boundaries & Constraints

### In Scope

- Las tres historias (#24, #25, #26), implementadas juntas por compartir el mismo concepto de diseño y tocar
  archivos superpuestos (`tailwind.config.js`, `App.jsx`, `CLAUDE.md`).

### Out of Scope

- Rediseño de layout/estructura de la UI — solo color, tipografía e ícono, sin tocar la disposición de
  elementos.
- Un selector de tema claro/oscuro — el proyecto sigue siendo dark-only (decisión de milestone-6, no revisada
  acá).
- Self-hosting de las fuentes (vs. Google Fonts vía `@import`) — se decide `@import` por simplicidad; si en el
  futuro se quiere evitar la dependencia de Google Fonts por privacidad/performance, es un issue nuevo.
- Cambiar `getActiveWordIndex.js`, `usePrefersReducedMotion.js` o cualquier lógica — restyle puro.

## Success Criteria

- [x] Los 4 escenarios Gherkin de la US #24 pasan.
- [x] Los 3 escenarios Gherkin de la US #25 pasan.
- [x] Los 3 escenarios Gherkin de la US #26 pasan.
- [x] Los 12 tests existentes pasan sin modificarse.
- [x] Verificación manual en navegador completada (contraste, favicon, tipografías, dígitos de ancho fijo).
- [x] `CLAUDE.md` actualizado (tabla de tokens + autocrítica con las paletas descartadas).

## Verificación (2026-07-15)

- **Paleta (#24)**: `theme.extend.colors.vu` en `tailwind.config.js` (housing/scale/peak/dial). `App.jsx` e
  `index.html` migrados; `grep` confirma ausencia total de `gray-900`/`gray-100`/`orange-400`/`orange-500`/
  `gray-400`/🎧 en ambos archivos.
- **Ícono (#25)**: `public/favicon.svg` reemplazado (barras + pico + subrayado), reusado inline en el `<h1>` de
  `App.jsx` con las mismas clases `fill-vu-*`/`stroke-vu-peak`. Aparece una sola vez en la UI.
- **Tipografía (#26)**: `theme.extend.fontFamily` + `@import` de Google Fonts en `src/index.css`. Verificado con
  Playwright (`getComputedStyle` real en navegador, no solo lectura de clases): `h1` → `"Space Grotesk", sans-serif`;
  contenedor del transcript → `Inter, sans-serif`; indicador de tiempo → `"IBM Plex Mono", monospace`.
- **Sin regresión**: `npm test` — 12 tests en verde sin modificar. `npm run test:coverage` respeta el umbral de
  milestone 10 (88.88/90/87.5/100).
- **Verificación visual en navegador** (Playwright headless contra `make dev`, capturas revisadas manualmente):
  contraste legible en las 3 combinaciones de color, ícono de marca visible en el `<h1>`, palabra activa
  resaltada y sincronizada correctamente durante la reproducción (capturas en 0:00, 0:01 con play, y tras un seek
  manual por click a 3.12s), sin errores en consola del navegador.
- **`make validate`** completo (lint → coverage → build → license-check): `validate OK`.
- `CLAUDE.md` actualizado: tabla de tokens, tipografía por función e ícono de marca documentados; autocrítica con
  las 2 paletas genéricas descartadas.
- Issues #24, #25, #26 cerradas en GitHub con el detalle de verificación.

## Implementation Plan

Ver [milestone-11-identidad-visual-parte2-plan.md](./milestone-11-identidad-visual-parte2-plan.md).
