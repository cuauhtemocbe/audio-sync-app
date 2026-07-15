import { describe, it, expect } from 'vitest'
import { getActiveWordIndex } from './getActiveWordIndex'

const word = (value, ts) => ({ type: 'text', value, ts })
const punct = (value) => ({ type: 'punct', value })

describe('getActiveWordIndex', () => {
  it('no resalta ninguna palabra cuando el transcript está vacío', () => {
    expect(getActiveWordIndex([], 0)).toBe(-1)
  })

  it('resalta la palabra correcta en el tiempo exacto de su timestamp', () => {
    const words = [word('hola', 1.0)]
    expect(getActiveWordIndex(words, 1.0)).toBe(0)
  })

  it('ignora elementos sin timestamp (puntuación) hasta que se alcanza la siguiente palabra', () => {
    const words = [word('hola', 1.0), punct(' '), word('mundo', 2.0)]
    expect(getActiveWordIndex(words, 1.5)).toBe(0)
  })

  it('ignora palabras de tipo "text" sin ts (no alineadas)', () => {
    const words = [word('hola', 1.0), { type: 'text', value: 'sin-ts' }, word('mundo', 2.0)]
    expect(getActiveWordIndex(words, 1.5)).toBe(0)
  })

  it('en un seek hacia adelante, resalta la última palabra cuyo ts es <= al tiempo actual', () => {
    const words = [word('uno', 1.0), word('dos', 2.0), word('tres', 5.0)]
    expect(getActiveWordIndex(words, 4.5)).toBe(1)
  })

  it('al final del audio, la última palabra del transcript permanece activa', () => {
    const words = [word('uno', 1.0), word('dos', 5.0), word('fin', 10.0)]
    expect(getActiveWordIndex(words, 15.0)).toBe(2)
  })

  it('una pausa (sin cambiar currentTime) no cambia la palabra activa', () => {
    const words = [word('uno', 1.0), word('dos', 2.0), word('tres', 3.0)]
    const first = getActiveWordIndex(words, 3.0)
    const second = getActiveWordIndex(words, 3.0)
    expect(second).toBe(first)
  })

  it.each([
    [2.0, 0],
    [2.0, 1.9],
  ])('no resalta ninguna palabra antes de la primera (ts=%s, tiempo=%s)', (primerTs, tiempo) => {
    const words = [word('primera', primerTs)]
    expect(getActiveWordIndex(words, tiempo)).toBe(-1)
  })
})
