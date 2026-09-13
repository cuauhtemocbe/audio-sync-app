import { describe, it, expect } from 'vitest'
import { offsetWords } from './offsetWords'

const word = (value, ts, end_ts) => ({ type: 'text', value, ts, end_ts })
const punct = (value) => ({ type: 'punct', value })

describe('offsetWords', () => {
  it('un solo chunk queda sin offset', () => {
    const result = offsetWords([
      { words: [word('a', 0, 0.5), punct(' '), word('b', 0.5, 1.0)], durationSeconds: 1.2 }
    ])
    expect(result).toEqual([word('a', 0, 0.5), punct(' '), word('b', 0.5, 1.0)])
  })

  it('el segundo chunk arranca en la duración REAL del primero, no en el end_ts de su última palabra', () => {
    const result = offsetWords([
      { words: [word('a', 0, 0.5), word('b', 0.5, 1.0)], durationSeconds: 1.2 },
      { words: [word('c', 0, 0.4)], durationSeconds: 0.6 }
    ])
    expect(result).toEqual([word('a', 0, 0.5), word('b', 0.5, 1.0), word('c', 1.2, 1.6)])
  })

  it('un chunk con words vacío igual suma su duración al acumulado', () => {
    const result = offsetWords([
      { words: [], durationSeconds: 1 },
      { words: [word('c', 0, 0.5)], durationSeconds: 0.5 }
    ])
    expect(result).toEqual([word('c', 1, 1.5)])
  })

  it('si la duración real es menor que el end_ts de la última palabra (padding), usa la duración real', () => {
    const result = offsetWords([
      { words: [word('a', 0, 0.5), word('b', 0.5, 2.0)], durationSeconds: 1.0 },
      { words: [word('c', 0, 0.4)], durationSeconds: 0.5 }
    ])
    expect(result).toEqual([word('a', 0, 0.5), word('b', 0.5, 2.0), word('c', 1.0, 1.4)])
  })
})
