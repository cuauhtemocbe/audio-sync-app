---
title: Implementation Plan: Milestone 11 — Identidad visual (parte 2)
status: approved
created: 2026-07-15
---

# Implementation Plan: Milestone 11 — Identidad visual (parte 2)

**Spec**: [milestone-11-identidad-visual-parte2.md](./milestone-11-identidad-visual-parte2.md)

## Components

### 1. Paleta VU-meter (#24)
- **Purpose**: colores derivados del dominio (medidor de nivel de audio) en vez del default de Tailwind.
- **Files**: `tailwind.config.js`, `src/App.jsx`, `index.html`.
- **Effort**: M

### 2. Ícono de marca (#25)
- **Purpose**: un SVG propio (waveform + pico + subrayado) reemplaza el ícono de stock y el emoji.
- **Files**: `public/favicon.svg`, `src/App.jsx`.
- **Effort**: S

### 3. Tipografía por función (#26)
- **Purpose**: display/body/mono con roles distintos en vez del font stack default.
- **Files**: `tailwind.config.js`, `src/index.css`, `src/App.jsx`.
- **Effort**: S

### 4. Documentación
- **Purpose**: tabla de tokens y autocrítica de `CLAUDE.md` reflejando la nueva paleta.
- **Files**: `CLAUDE.md`.
- **Effort**: XS

## Dependencies

### Build Order

1. Paleta (componente 1) — base para todo lo demás; el ícono usa los mismos colores (`vu-peak`/`vu-scale`).
2. Ícono (componente 2) — depende de los tokens de color ya definidos.
3. Tipografía (componente 3) — independiente de 1 y 2, pero se hace después para que el `<h1>` final (ícono +
   fuente display + color) se edite una sola vez.
4. Documentación (componente 4) — al final, una vez que los valores reales están en el código.

### External Dependencies

- Google Fonts (Space Grotesk, Inter, IBM Plex Mono) vía `@import` en `src/index.css` — sin instalar paquetes
  npm nuevos.

## Risks & Assumptions

### Riesgos

- **Contraste real vs. estimado**: los ratios de contraste en el spec son estimaciones manuales (no medidas con
  una herramienta). Mitigación: verificación en navegador real con DevTools antes de dar el milestone por
  completo (paso explícito en Testing Strategy del spec).
- **`@import` de Google Fonts en `index.css`**: agrega una dependencia de red en desarrollo/build (si Google
  Fonts no está disponible, cae a la fuente de fallback del stack). Riesgo bajo y aceptado explícitamente en
  Boundaries del spec (alternativa de self-host descartada por simplicidad).
- **Emoji 🎧 reemplazado por SVG inline**: cambiar de un carácter Unicode a un `<svg>` inline en JSX es un cambio
  de marcado, no de comportamiento — no debería afectar los tests existentes (no testean el render de `App.jsx`),
  pero se verifica corriendo la suite completa de todas formas.
- **Alcance grande para un solo milestone**: las 3 historias tocan `App.jsx` y `tailwind.config.js` en simultáneo.
  Mitigación: implementar en el orden de Build Order (paleta → ícono → tipografía) y correr `npm test` + revisión
  visual entre cada paso, no solo al final.

### Assumptions

- El usuario acepta el concepto VU-meter (paleta + ícono + tipografía) tal como está descripto en el spec — si
  no, este plan requiere revisión antes de tocar código.

## Milestones

- [ ] Paleta aplicada, 12 tests en verde, revisión visual de contraste en navegador.
- [ ] Ícono nuevo aplicado (favicon + `<h1>`), verificado visualmente en la pestaña del navegador.
- [ ] Tipografías aplicadas, verificado visualmente que el indicador de tiempo no "salta" de ancho.
- [ ] `CLAUDE.md` actualizado, `make validate` en verde.

## Tasks

### Foundation

- [ ] **Definir tokens de color**: agregar `theme.extend.colors.vu = { housing: '#0d1410', scale: '#d7e4d8',
      peak: '#ff5a36', dial: '#8fa190' }` en `tailwind.config.js`.
  - **Acceptance**: clases `bg-vu-housing`, `text-vu-scale`, `text-vu-peak`, `decoration-vu-peak`, `text-vu-dial`
    disponibles.
  - **Files**: `tailwind.config.js`.
  - **Tests**: `npm run build` no falla (Tailwind resuelve las clases nuevas).
  - **Effort**: XS

### Features

- [ ] **Migrar `App.jsx` y `index.html` a la paleta nueva**: reemplazar `bg-gray-900`→`bg-vu-housing`,
      `text-gray-100`→`text-vu-scale`, `text-orange-400`/`decoration-orange-500`→`text-vu-peak`/`decoration-vu-peak`,
      `text-gray-400`→`text-vu-dial`, en `App.jsx` y en la clase del `<body>` de `index.html`.
  - **Acceptance**: `grep` no encuentra ninguna clase `gray-900`/`gray-100`/`orange-400`/`orange-500`/`gray-400`
    en `App.jsx` ni `index.html`; los 12 tests siguen en verde.
  - **Files**: `src/App.jsx`, `index.html`.
  - **Tests**: `npm test`, revisión visual en `make dev`.
  - **Effort**: S

- [ ] **Crear ícono de marca**: nuevo `public/favicon.svg` (4 barras de altura creciente, la de pico en
      `#ff5a36`, resto en `#d7e4d8`, trazo horizontal bajo la barra de pico), reemplazando el SVG de stock.
      Reemplazar el emoji 🎧 del `<h1>` en `App.jsx` por el mismo ícono (`<img src="/favicon.svg" ... />` o SVG
      inline).
  - **Acceptance**: `public/favicon.svg` no contiene el comentario "Uploaded to: SVG Repo"; `App.jsx` no contiene
    🎧; el ícono aparece una sola vez en toda la UI; favicon visible correctamente en la pestaña del navegador.
  - **Files**: `public/favicon.svg`, `src/App.jsx`.
  - **Tests**: revisión visual en `make dev` (pestaña del navegador + `<h1>`).
  - **Effort**: S

- [ ] **Configurar y aplicar tipografías**: agregar `theme.extend.fontFamily = { display: [...Space Grotesk...],
      body: [...Inter...], mono: [...IBM Plex Mono...] }` en `tailwind.config.js`; `@import` de las 3 familias en
      `src/index.css`; aplicar `font-display` al `<h1>`, `font-body` al contenedor del transcript, `font-mono` al
      párrafo del indicador de tiempo en `App.jsx`.
  - **Acceptance**: las 3 clases de fuente aparecen en `App.jsx` en los elementos correctos; verificado
    visualmente que se cargan (Network tab o inspección de fuente aplicada) y que los dígitos del indicador de
    tiempo no cambian de ancho entre sí.
  - **Files**: `tailwind.config.js`, `src/index.css`, `src/App.jsx`.
  - **Tests**: revisión visual en `make dev`.
  - **Effort**: S

### Integration

- [ ] **Actualizar `CLAUDE.md`**: reemplazar la tabla de design tokens y la autocrítica (sección "Design tokens
      (tema oscuro)") con los valores VU-meter reales y las 2 paletas genéricas descartadas documentadas en el
      spec.
  - **Acceptance**: tabla coincide exactamente con `tailwind.config.js`; autocrítica menciona las 2 paletas
    descartadas y por qué.
  - **Files**: `CLAUDE.md`.
  - **Tests**: revisión manual de que los hex coinciden.
  - **Effort**: XS

- [ ] **Verificación final**: `npm test` (12 tests), `make dev` con checklist manual completo (contraste,
      favicon, tipografías, dígitos de ancho fijo, seek manual, pausa, fin de audio — golden path + edge cases
      del checklist existente de CLAUDE.md), `make validate`.
  - **Acceptance**: todo en verde, sin regresiones visuales ni de comportamiento.
  - **Files**: N/A (verificación).
  - **Tests**: `npm test`, `make validate`, checklist manual en navegador.
  - **Effort**: XS

## Effort Estimate

**Total**: M (paleta M, ícono S, tipografía S, docs+verificación XS+XS).

| Phase | Effort |
|-------|--------|
| Foundation | XS |
| Features | S + S + S |
| Integration | XS + XS |
