---
title: Wave 4 — UI rewrite (App.jsx dinámico)
status: approved
created: 2026-09-13
updated: 2026-09-13
issue:
---

# Wave 4 — UI rewrite (App.jsx dinámico)

## Objective

Reemplazar el modo demo estático de `App.jsx` (mp3 + JSON fijos) por el flujo completo de generación
dinámica: textarea + selector de voz + botón Generar que invoca `generateNarration` (Wave 3, ya
implementado y verificado manualmente por el usuario) y reproduce el resultado con el mismo
highlighting palabra-por-palabra que ya existe hoy.

## Context

Ver `specs/elevenlabs-tts-plan.md` (Wave 4, líneas 150-166) para el plan aprobado original. Waves 0-3
ya están completadas y verificadas manualmente (`specs/wave3-orchestration-audio.md`, Task 7 cerrada
por el usuario): el pipeline `generateNarration({ text, voiceId, onProgress }) →
Promise<{ audioUrl, words }>` produce audio reproducible con `words` en formato Rev.ai, ya sea Blob
`audio/mpeg` (caso normal) o `audio/wav` (fallback si diverge la duración en las juntas de chunk).

Esta es la última wave de UI del plan (Wave 5 es solo deploy). No hay lógica nueva de sincronización
que escribir — `getActiveWordIndex.js` y el renderer de palabras de `App.jsx` ya funcionan correctamente
contra cualquier array `words` en formato Rev.ai, generado estáticamente (como hoy) o dinámicamente
(como después de esta wave). El trabajo es exclusivamente de estado de UI: envolver
`generateNarration` en un flujo `idle → generating → ready` (o `error`), y eliminar el modo demo.

**Decisión de arquitectura**: un solo componente `App.jsx`, sin splitting en subcomponentes nuevos.
Sigue el criterio ya establecido en `CLAUDE.md` ("KISS: preferir funciones simples y directas...
Este es un proyecto chico — no over-engineer" + "Todo vive en `src/`... no introducir estructura de
carpetas compleja") y el propio plan original (`elevenlabs-tts-plan.md:154` describe todo dentro de
`App.jsx`). La única lógica pura de riesgo ya vive extraída (`getActiveWordIndex.js`); el nuevo estado
`idle/generating/ready/error` es orquestación de UI, no lógica de sincronización — no amerita la misma
excepción de extracción.

## Requirements

### Functional Requirements

- [x] Estado de la app como máquina de 4 estados explícitos: `idle` (nada generado todavía),
      `generating` (pipeline en curso, con progreso `{ completed, total }`), `ready` (audio + words
      disponibles, reproductor visible), `error` (el último intento falló, con `message`).
      Implementado en `App.jsx` (`status` state) y `590c965`.
- [x] Textarea controlado para el texto a narrar, con contador de caracteres visible (`{n}
      caracteres`) actualizado en cada keystroke. Sin límite máximo hard-coded en la UI — el chunking
      de `generateNarration` ya maneja textos de cualquier longitud (ver "Fuera de scope" de
      `elevenlabs-tts-plan.md`: no se agregan límites nuevos no pedidos).
- [x] `<select>` de voz con las opciones de `VOICES` (`src/voices.js`), valor inicial
      `DEFAULT_VOICE_ID`. El `value` del select es el `id` de cada voz, la etiqueta visible es `name`.
- [x] Botón "Generar": deshabilitado cuando el texto está vacío o es solo whitespace (`text.trim()
      === ''`), o cuando el estado es `generating` (evita doble submit). Al hacer click, invoca
      `generateNarration({ text, voiceId, onProgress })` y transiciona a `generating`.
- [x] Durante `generating`, mostrar el progreso recibido vía `onProgress(completed, total)` como texto
      (p.ej. "Generando… (1/3)"); la primera llamada es `(0, total)` — mostrarla como "Generando…
      (0/3)", no ocultar el contador hasta el primer chunk completado.
- [x] En éxito (`generateNarration` resuelve `{ audioUrl, words }`): transicionar a `ready`, guardar
      `audioUrl`/`words` en estado, y renderizar el reproductor actual (audio + palabras resaltadas +
      seek + indicador de tiempo) tal como existe hoy, mapeado sobre las `words` dinámicas en vez del
      transcript estático.
- [x] En fallo (`generateNarration` rechaza): transicionar a `error` con el `message` del error
      (`TtsRequestError.message` si aplica, o `error.message` genérico) visible en la UI; el
      formulario (textarea + select + botón) permanece visible y editable para reintentar — `error` no
      es un estado terminal, el usuario puede corregir el texto/voz y volver a generar.
- [x] Regenerar (click en "Generar" estando en `ready` o `error`, con texto/voz iguales o distintos):
      permitido siempre que el botón no esté deshabilitado. Antes de asignar el nuevo `audioUrl`,
      liberar el anterior con `URL.revokeObjectURL` si existía uno (evita acumular Blobs en memoria
      entre generaciones sucesivas de la misma sesión).
- [x] Al desmontar el componente, si hay un `audioUrl` activo, liberarlo también con
      `URL.revokeObjectURL` (mismo criterio de limpieza, vía cleanup de `useEffect`).
- [x] Reutilizar sin modificar: `getActiveWordIndex.js` (cálculo de palabra activa), el polling de
      `currentTime` cada 100ms, `seekTo` (click/Enter/Espacio en palabra → seek + play), el indicador
      de tiempo en `font-mono`, y `usePrefersReducedMotion` para la transición de color condicional.
- [x] Eliminar el modo demo estático: `public/daily_job.mp3`, `src/aligned_transcript.json`,
      `public/captions.vtt`, el `import transcript from './aligned_transcript.json'`, y el `<track>`
      de captions (ya no aplica — no hay VTT dinámico, fuera de scope explícito del plan original).
      Estos archivos son recuperables de git si hiciera falta (ya documentado en
      `elevenlabs-tts-plan.md`). Confirmado: ninguno de los tres existe en el árbol de trabajo.
- [x] El elemento `<audio>` usa `key={audioUrl}` (o equivalente) para forzar remount cuando cambia la
      fuente en una regeneración — evita estado stale del elemento nativo (posición de reproducción,
      buffering) entre un audio y el siguiente.

### Non-Functional Requirements

- [x] Accesibilidad: mantener los mismos atributos ya presentes (`role="button"`, `tabIndex`,
      manejo de teclado en palabras clickeables); agregar `<label>` asociado a la textarea y al
      `<select>` de voz (hoy no hay ningún form control en `App.jsx`, esta wave introduce los primeros).
      El progreso de `generating` debe ser anunciado a lectores de pantalla (`aria-live="polite"` en el
      contenedor de estado/progreso/error).
- [x] Cobertura: revisar explícitamente los thresholds de `src/App.jsx` en `vite.config.js` (hoy
      `statements:100, branches:85, functions:100, lines:100`, calibrados para el componente estático
      actual) una vez implementado — medir con `make coverage` y fijar los números reales, no
      asumirlos de antemano (mismo criterio que Wave 2/Wave 3: "no adivinar antes de ver el archivo
      final"). Recalibrado: medido en `100/88.23~91.17/100/100` sobre el `App.jsx` final; thresholds
      quedaron en `statements:100, branches:85, functions:100, lines:100` (mismos números, comentario
      actualizado con las ramas reales sin cubrir — ver `vite.config.js`).
- [x] Ningún test de `App.test.jsx` llama a la red real ni a Web Audio real — `generateNarration` se
      mockea a nivel de módulo (mismo patrón que hoy se mockea `./aligned_transcript.json`), igual que
      `generateNarration.test.js` (Wave 3) mockea `requestTts`/`decodeAudio` en vez de la red/Web Audio
      reales.

## Architecture

### Components

Un único componente, sin archivos nuevos más allá del propio `App.jsx` y su test:

```
App.jsx
  estado: text, voiceId, status ('idle'|'generating'|'ready'|'error'),
          progress ({completed,total}|null), errorMessage (string|null),
          audioUrl (string|null), words (Word[])
  handleGenerate() → revoca audioUrl previo si existe → generateNarration(...) → set status
  seekTo(time) → sin cambios respecto a hoy
  render:
    - form: textarea + contador + <select> de voces + botón Generar
    - región de estado (aria-live): progreso durante 'generating', mensaje durante 'error'
    - reproductor (solo si status === 'ready'): <audio key={audioUrl}> + palabras + tiempo
      (estructura JSX idéntica a la actual, words viene de estado en vez de un import estático)
```

- `generateNarration` se importa igual que cualquier otro módulo (`import { generateNarration } from
  './generateNarration'`) — no se inyecta por props/parámetro; el test lo mockea con `vi.mock` a nivel
  de módulo, mismo patrón que el mock actual de `./aligned_transcript.json` y de
  `./usePrefersReducedMotion`.
- `onProgress` pasado a `generateNarration` es una función que hace `setProgress({ completed, total
  })` — no necesita estar en una variable de estado separada de `status`, pero si `status !==
  'generating'` cuando llega un callback de progreso tardío (no debería ocurrir dado que
  `generateNarration` es una promesa única por invocación, pero ver Risks del plan) se ignora.

### Data Model

Sin cambios de formato: `words` sigue siendo el mismo array Rev.ai (`{type, value, ts, end_ts}`) que
ya consume `getActiveWordIndex.js` y el renderer — ahora viene de `generateNarration(...).words` en vez
de `transcript.monologues.flatMap(...)`. Se le sigue asignando `id: i` estable al mapear, igual que hoy
(línea 17 de `App.jsx` actual).

### External Dependencies

Ninguna nueva. Consume `generateNarration.js` y `voices.js` (Wave 3, ya implementados).

## User Stories

No aplica formato Gherkin dedicado — es una wave de UI sobre un flujo ya validado en las waves
anteriores (texto → audio), sin nuevas reglas de negocio más allá de la máquina de estados descrita en
Requirements.

## Testing Strategy

### Unit / Component Tests (Vitest + Testing Library, `src/App.test.jsx`)

Reemplaza los 9 tests actuales (asumen el transcript estático) por una suite equivalente sobre el
nuevo flujo, mockeando `generateNarration` a nivel de módulo:

- **Estado inicial (`idle`)**: se renderiza la textarea vacía, el contador en "0 caracteres", el
  `<select>` de voces con `DEFAULT_VOICE_ID` seleccionado, y el botón "Generar" deshabilitado; no hay
  reproductor visible.
- **Contador de caracteres**: escribir texto en la textarea actualiza el contador y habilita el botón;
  borrar todo el texto (o dejar solo espacios) vuelve a deshabilitarlo.
- **Click en Generar → `generating`**: llama a `generateNarration` con `{ text, voiceId, onProgress }`
  (verificar los argumentos exactos, incluida la voz seleccionada); mientras la promesa está pendiente,
  el botón se deshabilita y se muestra el progreso; invocar manualmente el `onProgress` capturado del
  mock con `(0, 2)` y luego `(1, 2)` y verificar que el texto de progreso se actualiza en cada llamada.
- **Éxito → `ready`**: resolver el mock con `{ audioUrl: 'blob:fake', words: [...] }` (fixture con las
  mismas 4 palabras que usaba `TRANSCRIPT_FIXTURE` hoy, adaptadas a la forma `Word`) → se renderiza el
  `<audio>` con esa fuente y las palabras con highlighting — reutilizar los casos ya cubiertos hoy
  (resalta la primera palabra por `ts=0`, click/Enter/Espacio hacen seek+play, elementos no-`text` no
  son interactivos, el highlighting sigue el `currentTime` vía polling, el tiempo mostrado se
  actualiza, no hay `transition-colors` con `prefersReducedMotion`).
- **Fallo → `error`**: rechazar el mock con un error con `.message` → se muestra ese mensaje, el
  formulario sigue habilitado, no se renderiza el reproductor.
- **Reintento después de error**: tras un fallo, click en Generar de nuevo (con el mock ahora resuelto)
  → limpia el mensaje de error anterior y llega a `ready` normalmente.
- **Regeneración libera el `audioUrl` previo**: con la app ya en `ready`, click en Generar de nuevo →
  antes de fijar el nuevo `audioUrl`, se llama `URL.revokeObjectURL` con el anterior (mock/spy sobre
  `URL.revokeObjectURL`).
- **Cleanup al desmontar**: con la app en `ready`, desmontar el componente → se llama
  `URL.revokeObjectURL` con el `audioUrl` activo.

### Integration Tests

No aplica un framework separado — la propia suite de `App.test.jsx` con `generateNarration` mockeado ya
cubre la integración entre el formulario, la máquina de estados y el reproductor.

### E2E Tests

No aplica (no hay framework E2E en el proyecto, ver `CLAUDE.md`).

### Verificación manual (browser real, `make dev`)

- Golden path: escribir un texto corto, elegir una voz, generar, escuchar el audio con el highlighting
  sincronizado.
- Seek manual (arrastrar la barra del `<audio>`), pausa, click en una palabra, fin del audio.
- Regenerar con un texto distinto sin recargar la página — confirmar que no queda audio "fantasma" del
  intento anterior reproduciéndose ni memory leak evidente (Blobs no liberados) en DevTools.
- Error real: forzar una key inválida (o detener el proxy) y confirmar que el mensaje de error mostrado
  es legible y accionable, no un mensaje genérico opaco.
- `prefers-reduced-motion` activado en el sistema operativo/DevTools → confirmar que no hay transición
  de color en el highlighting (igual que hoy).
- Confirmar que `public/daily_job.mp3`, `src/aligned_transcript.json` y `public/captions.vtt` ya no se
  sirven ni se importan (sin 404 esperados en Network tab más que por su ausencia intencional).

### Performance Tests

No aplica — fuera de scope (la latencia por chunk secuencial ya se resolvió en Wave 3 vía progreso).

## Boundaries & Constraints

### In Scope

- Reescritura de `App.jsx` con la máquina de estados `idle/generating/ready/error`.
- Eliminación de los assets/archivos del modo demo estático.
- Actualización completa de `src/App.test.jsx`.
- Revisión (y ajuste si hace falta) de los coverage thresholds de `src/App.jsx` en `vite.config.js`.
- Accesibilidad mínima de los nuevos form controls (labels, `aria-live` del estado).

### Out of Scope

- Cualquier cambio a `generateNarration.js`, `elevenLabsApi.js`, `voices.js`, o las 4 funciones puras
  de Wave 2 — se consumen tal cual.
- Deploy a producción, `Dockerfile` prod, variables de Railway (Wave 5).
- Historial de generaciones, cancelación de una generación en curso, reintentos automáticos de un
  chunk fallido, voice settings (stability/similarity), generación de `captions.vtt` dinámico — mismo
  "Fuera de scope" ya explícito en `elevenlabs-tts-plan.md`.
- Streaming de progreso vía WebSocket — el progreso es solo el callback síncrono ya definido en Wave 3.
- Validación de longitud máxima de texto en la UI (sin límite pedido; el chunking ya maneja cualquier
  longitud).

### Technical Constraints

- JS plano, sin TypeScript.
- Un solo componente `App.jsx` — sin subcomponentes nuevos (ver "Decisión de arquitectura" en Context).
- Vitest + Testing Library, tests colocados junto al archivo (`App.jsx` + `App.test.jsx`).
- Tailwind existente (paleta `vu-*`, tipografías `font-display/body/mono`) — sin nuevas clases de color
  fuera de ese sistema de tokens.

## Success Criteria

- [x] Flujo completo usable en `make dev`: escribir texto, elegir voz, generar, escuchar con
      highlighting sincronizado, sin el modo demo estático presente en el bundle ni en `public/`.
- [x] `make test` verde con la suite de `App.test.jsx` reescrita cubriendo los 4 estados (78 tests).
- [x] `make validate` completo verde (lock-check → lint → coverage → build → license-check), con
      thresholds de `src/App.jsx` recalibrados y documentados en `vite.config.js` si cambiaron respecto
      a los actuales.
- [x] Verificación manual completa (los 6 puntos de la sección correspondiente) confirmada por el
      usuario. Hecha en `make dev` vía Claude in Chrome contra `ELEVENLABS_API_KEY` real
      (2026-09-13): golden path (generar → escuchar con highlighting sincronizado) OK; seek por click
      en palabra OK; pausa OK; fin de audio (última palabra queda resaltada, sin loop/crash) OK;
      regeneración sin audio fantasma (`URL.revokeObjectURL` confirmado sobre el blob anterior antes
      de asignar el nuevo, verificado por script) OK; error real (se detuvo el contenedor `server`) OK
      — mensaje "Error inesperado al generar audio." con formulario editable, reintento tras
      reiniciar `server` limpia el error y llega a `ready`; assets estáticos confirmados ausentes
      (`fetch` a las 3 rutas devuelve el `index.html` de fallback de Vite, no los archivos viejos).
      Único punto no reproducido en vivo: `prefers-reduced-motion` — `matchMedia()` en este navegador
      devuelve una instancia nueva en cada llamada, así que un evento `change` sintético inyectado
      post-mount no llega al listener real del hook; ese comportamiento ya está cubierto por los 3
      tests de `usePrefersReducedMotion.test.js` (incluido el caso de reacción en caliente).

## Implementation Plan

Ver `specs/wave4-ui-rewrite-plan.md`.

## Changelog

<!-- Vacío hasta que este spec llegue a `completed` y se lo vuelva a tocar. -->
