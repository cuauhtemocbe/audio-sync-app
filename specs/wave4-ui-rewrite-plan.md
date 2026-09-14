# Implementation Plan: Wave 4 — UI rewrite

**Spec**: `specs/wave4-ui-rewrite.md`
**Created**: 2026-09-13
**Status**: approved

## Components

### 1. `App.jsx` (reescritura completa)
- **Purpose**: máquina de estados `idle/generating/ready/error` sobre `generateNarration`, formulario
  (textarea + selector de voz + botón), y el reproductor ya existente adaptado a `words` dinámicas.
- **Files**: `src/App.jsx`
- **Effort**: M — no hay lógica nueva de sincronización (se reutiliza `getActiveWordIndex.js` sin
  tocar), pero sí varios estados nuevos y su cableado.

### 2. `App.test.jsx` (reescritura completa)
- **Purpose**: cubrir los 4 estados con `generateNarration` mockeado a nivel de módulo.
- **Files**: `src/App.test.jsx`
- **Effort**: M — reemplaza los 9 tests actuales; varios se reutilizan casi literal (highlighting,
  seek, teclado, reduced motion) solo cambiando el origen de `words`.

### 3. Eliminación del modo demo estático
- **Purpose**: quitar los assets y referencias que ya no aplican.
- **Files**: eliminar `public/daily_job.mp3`, `src/aligned_transcript.json`, `public/captions.vtt`;
  quitar el `<track>` y el `import transcript from './aligned_transcript.json'` de `App.jsx` (ya
  cubierto por el Componente 1, no es trabajo separado).
- **Effort**: XS

### 4. Coverage thresholds
- **Purpose**: recalibrar `src/App.jsx` en `vite.config.js` con la cobertura real medida tras la
  reescritura.
- **Files**: `vite.config.js`
- **Effort**: XS

## Dependencies

### Build Order

1. **Eliminación de assets estáticos** primero (Componente 3) — evita trabajar con referencias muertas
   mientras se reescribe `App.jsx`; es un cambio mecánico sin riesgo.
2. **`App.jsx`** (Componente 1) — depende de `generateNarration.js` y `voices.js` (Wave 3, ya
   existentes, sin cambios) y de `getActiveWordIndex.js`/`usePrefersReducedMotion.js` (sin cambios).
3. **`App.test.jsx`** (Componente 2) — depende de que `App.jsx` esté terminado (se escribe test-first
   por bloque de estado siguiendo `/testing`, pero la suite completa se valida contra la
   implementación final).
4. **Coverage thresholds** (Componente 4) — al final, una vez `make coverage` corre sobre el `App.jsx`
   y `App.test.jsx` definitivos.

### External Dependencies

Ninguna nueva.

## Risks & Assumptions

### Risks

- **`onProgress` tardío después de un cambio de estado**: si el usuario pudiera abandonar `generating`
  antes de que la promesa resuelva (no hay forma de hacerlo en este diseño — no existe botón de
  cancelar, ver "Fuera de scope") esto no debería ocurrir en la práctica. **Mitigación**: no se
  implementa guarda especial más allá de la ya prevista en el spec (ignorar si `status !==
  'generating'`); no hay ruta de UI que dispare la condición, así que no se testea explícitamente un
  caso que no es alcanzable con los controles expuestos.
- **`URL.revokeObjectURL` en test con jsdom**: jsdom implementa `URL.createObjectURL`/`revokeObjectURL`
  como no-ops o los deja sin definir según versión. **Mitigación**: `vi.spyOn(URL,
  'revokeObjectURL').mockImplementation(() => {})` explícito en `App.test.jsx` en vez de depender del
  comportamiento real de jsdom, igual que ya se mockea `HTMLMediaElement.prototype.play`.
- **Coverage de `App.jsx` puede bajar respecto al 100/85/100/100 actual**: los nuevos branches
  (idle/generating/ready/error, guardas del botón deshabilitado, `aria-live`) son más numerosos que el
  componente actual. **Mitigación**: medir con `make coverage` después de implementar y fijar los
  números reales (Componente 4) — no bloquea el resto de la wave si algún número baja unos puntos,
  mismo criterio que Wave 3 con `generateNarration.js`.
- **Fixture de `words` en los tests de `App.test.jsx` desalineado con la forma real que produce
  `alignmentToWords`**: si el fixture mockeado no respeta el formato Rev.ai exacto, los tests de
  highlighting pasarían con datos irreales. **Mitigación**: reusar textualmente la forma de
  `TRANSCRIPT_FIXTURE` actual (ya validada contra `getActiveWordIndex.js`) como el array `words` que
  resuelve el mock de `generateNarration`, en vez de inventar una nueva.

### Assumptions

- El usuario ya verificó manualmente Wave 3 (Task 7 de `wave3-orchestration-audio-plan.md`) — esta wave
  no revalida el pipeline de generación en sí, solo lo consume.
- No hace falta un componente `<Player>` separado ni un reducer explícito (`useReducer`) — varios
  `useState` (`text`, `voiceId`, `status`, `progress`, `errorMessage`, `audioUrl`, `words`) alcanzan
  para 4 estados sin transiciones complejas; si durante la implementación las transiciones resultan
  difíciles de seguir con `useState` sueltos, se reevalúa `useReducer` sin que eso cambie el spec (es
  un detalle de implementación, no de comportamiento observable).

## Milestones

- [x] M1: Assets estáticos eliminados, repo sin referencias muertas (`grep` limpio de
      `daily_job.mp3`/`aligned_transcript.json`/`captions.vtt` fuera de este plan/spec y de git
      history).
- [x] M2: `App.jsx` reescrito, los 4 estados funcionan en `make dev` contra el proxy real (o un
      `generateNarration` real si el usuario tiene `ELEVENLABS_API_KEY`).
- [x] M3: `App.test.jsx` reescrito, `make test` verde.
- [x] M4: Coverage thresholds recalibrados, `make validate` completo verde.
- [ ] M5: Verificación manual completa por el usuario (los 6 puntos del spec). Pendiente —
      responsabilidad del usuario.

## Tasks

**Slicing strategy**: Horizontal (por componente) — igual que Waves 2 y 3. No hay múltiples escenarios
de usuario independientes que convenga cortar verticalmente: los 4 estados de `App.jsx` son una única
máquina de estados cohesiva dentro de un solo componente, y separar "eliminar assets" primero evita
tocar referencias muertas a mitad de la reescritura.

### Foundation (Build First)

- [x] **Task 1: Eliminar modo demo estático**
  - **Acceptance**: `public/daily_job.mp3`, `src/aligned_transcript.json`, `public/captions.vtt` ya no
    existen en el working tree; ningún archivo fuente los referencia (`grep -r` limpio salvo en
    `specs/`).
  - **Files**: eliminar los 3 archivos.
  - **Tests**: N/A (se verifica con `make lint`/`make build` no rompiendo por imports faltantes en el
    resto de tareas).
  - **Effort**: XS

### Component: `App.jsx`

- [x] **Task 2: Formulario + estado `idle`**
  - **Acceptance**: textarea controlada con contador de caracteres; `<select>` con `VOICES` y
    `DEFAULT_VOICE_ID` preseleccionado; botón "Generar" deshabilitado con texto vacío/whitespace;
    labels asociados a ambos controles.
  - **Files**: `src/App.jsx`
  - **Tests**: casos "estado inicial" y "contador de caracteres" del spec.
  - **Effort**: S

- [x] **Task 3: Transición `idle → generating`, progreso, y llamada a `generateNarration`**
  - **Acceptance**: click en Generar (con botón habilitado) invoca `generateNarration({ text, voiceId,
    onProgress })`; botón se deshabilita; el progreso recibido por `onProgress` se refleja en la UI en
    cada llamada, incluida la primera `(0, total)`; región de estado con `aria-live="polite"`.
  - **Files**: `src/App.jsx`
  - **Tests**: caso "Click en Generar → generating" del spec.
  - **Effort**: M

- [x] **Task 4: Transición `generating → ready` y reproductor dinámico**
  - **Acceptance**: en éxito, `audioUrl`/`words` pasan a estado y se renderiza el reproductor
    (`<audio key={audioUrl}>` + palabras resaltadas + seek por click/teclado + indicador de tiempo)
    reutilizando `getActiveWordIndex.js`/`usePrefersReducedMotion` sin modificarlos.
  - **Files**: `src/App.jsx`
  - **Tests**: caso "Éxito → ready" del spec (reutiliza los sub-casos de highlighting/seek/teclado/
    reduced-motion ya cubiertos hoy, ahora sobre `words` de estado).
  - **Effort**: M

- [x] **Task 5: Transición `generating → error` y reintento**
  - **Acceptance**: en fallo, se muestra `error.message` en la región `aria-live`; formulario sigue
    editable y el botón vuelve a habilitarse según la regla de Task 2; un nuevo click en Generar limpia
    el mensaje de error anterior.
  - **Files**: `src/App.jsx`
  - **Tests**: casos "Fallo → error" y "Reintento después de error" del spec.
  - **Effort**: S

- [x] **Task 6: Regeneración y cleanup de `audioUrl`**
  - **Acceptance**: antes de fijar un nuevo `audioUrl` (desde `ready` o `error`), se llama
    `URL.revokeObjectURL` sobre el anterior si existía; al desmontar el componente con un `audioUrl`
    activo, se llama `URL.revokeObjectURL` vía cleanup de `useEffect`.
  - **Files**: `src/App.jsx`
  - **Tests**: casos "Regeneración libera el audioUrl previo" y "Cleanup al desmontar" del spec (con
    `vi.spyOn(URL, 'revokeObjectURL')`).
  - **Effort**: S

### Polish

- [x] **Task 7: Coverage thresholds + `make validate`**
  - **Acceptance**: `vite.config.js` con threshold de `src/App.jsx` calibrado contra la cobertura real
    medida (`make coverage`) del componente terminado; `make validate` completo pasa.
  - **Files**: `vite.config.js`
  - **Tests**: N/A (config).
  - **Effort**: XS
  - **Result**: medido `100/88.23~91.17/100/100` (statements/branches/functions/lines) sobre el
    `App.jsx` final — los thresholds numéricos (`100/85/100/100`) no cambiaron respecto al valor
    calibrado para el demo estático, pero el comentario en `vite.config.js` se actualizó para reflejar
    las ramas reales sin cubrir (guardas `audioRef.current`, fallback `error.message`, una de las dos
    teclas del `onKeyDown`). `make validate` pasa completo.

### Verificación manual (fuera de `make test`, cierra la wave)

- [ ] **Task 8: Verificación manual en browser**
  - **Acceptance**: los 6 puntos de la sección "Verificación manual" del spec, confirmados por el
    usuario con `make dev` (golden path, seek/pausa/click-palabra/fin de audio, regeneración sin audio
    fantasma, error real con key inválida o proxy caído, reduced motion, ausencia de assets del modo
    demo).
  - **Files**: N/A (verificación, no código).
  - **Tests**: N/A
  - **Effort**: S (depende de tener `ELEVENLABS_API_KEY` real para el caso de éxito; el caso de error
    puede probarse sin key real deteniendo el proxy o usando una key inválida).

## Effort Estimate

**Total Estimated Days**: 1-1.5 días (sin lógica nueva de sincronización, principalmente cableado de
estado y reescritura de tests)

| Phase | Effort |
|-------|--------|
| Foundation (Task 1) | ~0.1 día |
| Features (Tasks 2-6) | ~0.8 día |
| Polish (Task 7) | ~0.1 día |
| Verificación manual (Task 8) | ~0.1-0.3 día (depende del usuario / key real) |
