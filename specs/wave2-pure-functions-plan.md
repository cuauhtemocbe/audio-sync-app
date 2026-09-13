# Implementation Plan: Wave 2 — Funciones puras de transformación

**Spec**: `specs/wave2-pure-functions.md`
**Created**: 2026-09-13
**Status**: completed

## Components

### 1. `normalizeText.js`
- **Purpose**: normaliza texto libre antes de chunking (puntuación, espacios, preserva `\n`)
- **Files**: `src/normalizeText.js`, `src/normalizeText.test.js`
- **Effort**: XS — port directo de `normalizeScriptText` (reel-forge-ts `src/pipeline/generate.ts:49-54`)

### 2. `chunkText.js`
- **Purpose**: parte texto normalizado en chunks ≤ `maxChars` (~2.500), cortando por oración, con
  corte duro en palabra si una oración sola excede el límite
- **Files**: `src/chunkText.js`, `src/chunkText.test.js`
- **Effort**: M — diseño nuevo, sin precedente en reel-forge-ts, mayor superficie de casos borde

### 3. `alignmentToWords.js`
- **Purpose**: convierte `alignment` char-level de ElevenLabs a `words` formato Rev.ai
- **Files**: `src/alignmentToWords.js`, `src/alignmentToWords.test.js`
- **Effort**: S — port de `alignmentToWords()` (reel-forge-ts `src/pipeline/tts.ts:17-48`) + guard
  nuevo de longitudes (throw explícito, decidido en el gate de Specify)

### 4. `offsetWords.js`
- **Purpose**: acumula timestamps entre chunks usando duración real (no `end_ts` de última palabra)
- **Files**: `src/offsetWords.js`, `src/offsetWords.test.js`
- **Effort**: S — lógica acotada (una reducción sobre un array), pero es el requirement que más
  directamente previene el bug de drift de sync mencionado en `elevenlabs-tts-plan.md`

### 5. Coverage thresholds
- **Purpose**: agregar entrada por archivo en `vite.config.js` (`test.coverage.thresholds`) para los
  4 módulos nuevos, igual que `getActiveWordIndex.js` / `usePrefersReducedMotion.js`
- **Files**: `vite.config.js`
- **Effort**: XS

## Dependencies

### Build Order

Las 4 funciones son independientes entre sí (ninguna importa a otra), así que no hay orden de build
obligatorio por dependencias de código. El orden abajo es por riesgo/certeza, de mayor a menor:

1. `normalizeText.js` (port directo, casi sin riesgo — valida rápido el patrón de "port + test" antes
   de encarar las funciones nuevas)
2. `alignmentToWords.js` (port + guard nuevo — resuelve el mayor riesgo de interfaz: la forma exacta
   del alignment de ElevenLabs, que **todavía no se validó contra una respuesta real completa** — Wave
   0 solo verificó `audio_base64` + presencia de `alignment.characters`, no la forma exacta de los 3
   arrays en una respuesta con puntuación/mayúsculas reales)
3. `chunkText.js` (diseño nuevo, sin dependencia de los anteriores)
4. `offsetWords.js` (diseño nuevo, se beneficia de tener `alignmentToWords` ya probado para construir
   fixtures de `words` realistas en sus tests)
5. Coverage thresholds (al final, una vez los 4 archivos existen — evita configurar un threshold
   contra un archivo que todavía va a cambiar de forma)

### External Dependencies

Ninguna nueva.

## Risks & Assumptions

### Risks

- **Forma exacta del alignment de ElevenLabs no verificada en detalle**: Wave 0 confirmó que
  `alignment.characters` existe (58 elementos en el spike), pero no se inspeccionó si
  `character_start_times_seconds`/`character_end_times_seconds` vienen siempre como `number[]` (vs.
  `null` en algún char, p.ej. espacios) ni cómo se comporta con acentos/ñ (texto en español, uno de
  los presets de voz del plan). **Mitigación**: antes de escribir `alignmentToWords.test.js`, pedirle
  al usuario que corra un curl manual con texto en español con puntuación y pegar (o guardar en
  `specs/`) la respuesta real, para construir los fixtures de test contra la forma real y no una
  asumida.
- **Definición de "oración" en `chunkText` es ambigua**: cortar "por oración" requiere una regla
  concreta (¿split por `. `, `? `, `! `, `\n\n`? ¿maneja abreviaturas como "Sr." sin cortar ahí?).
  **Mitigación**: implementación simple y documentada (split por los signos de puntuación de cierre
  seguidos de espacio/`\n`, sin heurística de abreviaturas — fuera de scope tratar casos lingüísticos
  avanzados) — se anota como limitación conocida, no se sobre-diseña para esta wave.
- **Threshold de cobertura demasiado estricto o demasiado laxo al adivinar antes de ver el archivo
  final**: **Mitigación**: fijar los thresholds después de implementar cada función y correr
  `make coverage` una vez, no antes (igual que se hizo con `getActiveWordIndex.js` originalmente).

### Assumptions

- El formato de `Word` (Rev.ai: `{type, value, ts, end_ts}`) no cambia — `getActiveWordIndex.js` y
  `App.jsx` actuales lo consumen tal cual, y esta wave no lo toca.
- `maxChars` por defecto de `chunkText` es 2.500 (valor ya fijado en `elevenlabs-tts-plan.md`), pero
  se deja como parámetro con default para que los tests puedan usar límites chicos sin generar
  fixtures de miles de caracteres.

## Milestones

- [x] M1: `normalizeText.js` + `alignmentToWords.js` implementados y testeados (resuelve el riesgo
      de interfaz más grande primero)
- [x] M2: `chunkText.js` + `offsetWords.js` implementados y testeados
- [x] M3: Thresholds de cobertura agregados en `vite.config.js`, `make validate` verde de punta a
      punta

## Tasks

**Slicing strategy**: Horizontal (por componente) — las 4 funciones no tienen una dependencia de
código entre sí (no es un caso de slices verticales por escenario de usuario, ya que no hay UI ni
flujo end-to-end en esta wave), y agruparlas por riesgo/certeza de interfaz (ver Build Order) importa
más que entregar un "escenario completo" parcial. Cada tarea ya es end-to-end en sí misma: función +
test + (al final) threshold.

### Foundation (Build First)

- [x] **Task 1: `normalizeText.js`**
  - **Acceptance**: normaliza espacio tras puntuación de cierre, colapsa espacios múltiples,
    preserva `\n`, es no-op sobre texto ya normalizado
  - **Files**: `src/normalizeText.js`, `src/normalizeText.test.js`
  - **Tests**: los 5 casos listados en el spec (puntuación sin espacio, espacios múltiples, `\n`
    preservado, no-op, string vacío)
  - **Effort**: XS

- [x] **Task 2: `alignmentToWords.js`**
  - **Acceptance**: agrupa caracteres en palabras por whitespace, `ts`/`end_ts` heredados
    correctamente, puntuación pegada a la palabra, `throw` explícito si los 3 arrays del alignment
    no tienen igual longitud; output consumible por `getActiveWordIndex.js` sin modificarlo (test de
    integración liviano que lo verifica)
  - **Files**: `src/alignmentToWords.js`, `src/alignmentToWords.test.js`
  - **Tests**: casos ZOMBIES completos (ver spec) + fixture basado en respuesta real de ElevenLabs
    (bloqueado por el Risk de arriba — pedir curl de ejemplo al usuario antes de esta tarea si no se
    consiguió ya)
  - **Effort**: S

### Component: `chunkText.js`

- [x] **Task 3: `chunkText.js`**
  - **Acceptance**: respeta `maxChars` (default 2.500), corta por oración cuando puede, corte duro
    en palabra si una oración sola excede el límite, nunca parte una palabra a la mitad, nunca
    excede `maxChars` por chunk
  - **Files**: `src/chunkText.js`, `src/chunkText.test.js`
  - **Tests**: los 6 casos listados en el spec (texto corto, texto largo con puntuación, oración >
    límite, sin puntuación, límite exacto, input vacío)
  - **Effort**: M

### Component: `offsetWords.js`

- [x] **Task 4: `offsetWords.js`**
  - **Acceptance**: un chunk → sin offset; N chunks → cada chunk arranca en la suma de
    `durationSeconds` de los anteriores (no en `end_ts` de la última palabra); maneja `words: []` en
    un chunk sin romper el acumulado
  - **Files**: `src/offsetWords.js`, `src/offsetWords.test.js`
  - **Tests**: los 4 casos listados en el spec (un chunk, dos chunks, chunk vacío, duración real <
    suma de `end_ts`)
  - **Effort**: S

### Polish

- [x] **Task 5: Coverage thresholds**
  - **Acceptance**: `vite.config.js` tiene threshold explícito por archivo para los 4 módulos
    nuevos; `make coverage` reporta los 4 al 100% (o al valor real alcanzado, documentado si algo
    queda por debajo); `make validate` falla si baja
  - **Files**: `vite.config.js`
  - **Tests**: N/A (config) — verificación manual bajando artificialmente un threshold para
    confirmar que `make validate` efectivamente falla, luego revertir
  - **Effort**: XS

## Effort Estimate

**Total Estimated Days**: 1 día (proyecto chico, funciones acotadas, sin red/UI)

| Phase | Effort |
|-------|--------|
| Foundation (Tasks 1-2) | ~0.4 día |
| Features (Tasks 3-4) | ~0.4 día |
| Polish (Task 5) | ~0.1 día |
| Verificación manual (Risk del alignment real) | ~0.1 día (depende del usuario) |
