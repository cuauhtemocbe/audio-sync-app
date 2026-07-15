# Cubrir con tests la lógica de activeWordIndex

## User Story

```
As mantenedor único de audio-sync-app
I want tener tests automatizados que cubran el cálculo del índice de palabra activa
In order to detectar antes de deployar una regresión de sincronización audio/texto
```

## Technical Context

- Archivo: `src/App.jsx` — la lógica de `activeWordIndex` depende del `currentTime` del elemento `<audio>` y de
  `elements[].ts` en `src/aligned_transcript.json` (formato Rev.ai: `monologues[].elements[]`).
- `CLAUDE.md` ya señala esta área como la de mayor riesgo de bugs sutiles (off-by-one en timestamps, palabras
  sin `ts`).
- Puede requerir extraer una función pura (ej. `getActiveWordIndex(elements, currentTime)`) para poder
  testearla sin montar el componente completo — es una decisión de implementación, se resuelve al codear la
  historia, no bloquea la escritura de los criterios.
- Depende de [M1-01](./01-configurar-vitest-en-docker.md) (entorno de testing ya configurado).

### Edge cases (ZOMBIES)

| Categoría | Caso considerado |
| --- | --- |
| Zero | Transcript vacío (`elements = []`) |
| One | Un solo elemento con `ts` |
| Many | Transcript largo, `currentTime` en medio |
| Boundaries | `currentTime` exactamente igual al `ts` de un elemento |
| Interfaces | Elemento sin `ts` (puntuación) intercalado entre palabras con `ts` |
| Exceptions | Seek hacia adelante/atrás; `currentTime` mayor a todos los `ts` (fin de audio) |
| Simple | Tiempo antes de la primera palabra |

## Acceptance Criteria

```gherkin
Feature: Cálculo del índice de palabra activa

  Scenario: Ninguna palabra activa cuando el transcript está vacío
    Given un transcript sin elementos
    When calculo la palabra activa para el tiempo actual 0
    Then no se resalta ninguna palabra

  Scenario: Resalta la palabra correcta en el tiempo exacto de su timestamp
    Given un transcript con una palabra en ts=1.0
    When el tiempo actual del audio es exactamente 1.0
    Then esa palabra es la palabra activa

  Scenario: Ignora elementos sin timestamp (puntuación)
    Given un transcript con una palabra en ts=1.0, un signo de puntuación sin ts, y una palabra en ts=2.0
    When el tiempo actual del audio es 1.5
    Then la palabra activa sigue siendo la de ts=1.0 hasta que se alcanza ts=2.0

  Scenario: Salto hacia adelante en el audio (seek)
    Given un transcript con palabras en ts=1.0, 2.0 y 5.0
    When el usuario hace seek a 4.5
    Then la palabra activa es la de ts=2.0, la última cuyo ts es menor o igual al tiempo actual

  Scenario: Fin del audio, tiempo actual mayor a todos los timestamps
    Given un transcript cuya última palabra tiene ts=10.0
    When el tiempo actual del audio es 15.0
    Then la palabra activa es la última palabra del transcript

  Scenario: Pausa no cambia la palabra activa
    Given el audio está en el tiempo 3.0 con una palabra activa ya determinada
    When el usuario pausa el audio sin cambiar currentTime
    Then la palabra activa permanece igual

  Scenario Outline: Tiempo antes de la primera palabra
    Given un transcript cuya primera palabra tiene ts=<primer_ts>
    When el tiempo actual del audio es <tiempo>
    Then no se resalta ninguna palabra

    Examples:
      | primer_ts | tiempo |
      | 2.0       | 0      |
      | 2.0       | 1.9    |
```

## Definition of Done

- Todos los escenarios tienen test unitario en Vitest.
- Cobertura de la función de cálculo >= 90% (es lógica de negocio pura, justifica un target alto pese a que el
  resto del proyecto no diferencia cobertura por capa).
- Probado manualmente en navegador siguiendo el checklist de `CLAUDE.md` (seek, pausa, fin de audio) antes de
  cerrar la historia.

## Effort: M
