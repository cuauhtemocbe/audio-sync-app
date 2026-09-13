import { describe, it, expect } from 'vitest'
import { alignmentToWords } from './alignmentToWords'
import { getActiveWordIndex } from './getActiveWordIndex'

// Fixture real: primeros 35 caracteres de una respuesta de ElevenLabs
// POST /v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/with-timestamps para el texto
// "Hello there, this is a quick test." (voz Rachel, eleven_multilingual_v2),
// capturada el 2026-09-13 vía el proxy local (server/index.js). Confirma que characters,
// character_start_times_seconds y character_end_times_seconds son arrays paralelos sin
// valores null, y que la puntuación (coma, punto) llega como carácter propio pegado a la
// palabra anterior, sin espacio previo.
const realAlignmentSample = {
  characters: [
    'H', 'e', 'l', 'l', 'o', ' ', 't', 'h', 'e', 'r', 'e', ',', ' ', 't', 'h', 'i', 's', ' ', 'i',
    's', ' ', 'a', ' ', 'q', 'u', 'i', 'c', 'k', ' ', 't', 'e', 's', 't', '.', ' '
  ],
  character_start_times_seconds: [
    0, 0.093, 0.174, 0.197, 0.255, 0.372, 0.441, 0.464, 0.499, 0.569, 0.627, 0.743, 0.766, 0.848,
    0.882, 0.94, 0.987, 1.01, 1.057, 1.103, 1.138, 1.173, 1.196, 1.242, 1.265, 1.3, 1.347, 1.382,
    1.428, 1.474, 1.533, 1.707, 1.8, 1.95, 2.067
  ],
  character_end_times_seconds: [
    0.093, 0.174, 0.197, 0.255, 0.372, 0.441, 0.464, 0.499, 0.569, 0.627, 0.743, 0.766, 0.848,
    0.882, 0.94, 0.987, 1.01, 1.057, 1.103, 1.138, 1.173, 1.196, 1.242, 1.265, 1.3, 1.347, 1.382,
    1.428, 1.474, 1.533, 1.707, 1.8, 1.95, 2.067, 2.31
  ]
}

describe('alignmentToWords', () => {
  it('convierte un alignment real de ElevenLabs a words formato Rev.ai', () => {
    expect(alignmentToWords(realAlignmentSample)).toEqual([
      { type: 'text', value: 'Hello', ts: 0, end_ts: 0.372 },
      { type: 'punct', value: ' ' },
      { type: 'text', value: 'there', ts: 0.441, end_ts: 0.743 },
      { type: 'punct', value: ', ' },
      { type: 'text', value: 'this', ts: 0.848, end_ts: 1.01 },
      { type: 'punct', value: ' ' },
      { type: 'text', value: 'is', ts: 1.057, end_ts: 1.138 },
      { type: 'punct', value: ' ' },
      { type: 'text', value: 'a', ts: 1.173, end_ts: 1.196 },
      { type: 'punct', value: ' ' },
      { type: 'text', value: 'quick', ts: 1.242, end_ts: 1.428 },
      { type: 'punct', value: ' ' },
      { type: 'text', value: 'test', ts: 1.474, end_ts: 1.95 },
      { type: 'punct', value: '. ' }
    ])
  })

  it('Zero: alignment con characters vacío devuelve []', () => {
    expect(
      alignmentToWords({
        characters: [],
        character_start_times_seconds: [],
        character_end_times_seconds: []
      })
    ).toEqual([])
  })

  it('One: una sola palabra sin espacios', () => {
    expect(
      alignmentToWords({
        characters: ['h', 'i'],
        character_start_times_seconds: [0, 0.1],
        character_end_times_seconds: [0.1, 0.2]
      })
    ).toEqual([{ type: 'text', value: 'hi', ts: 0, end_ts: 0.2 }])
  })

  it('Many: números tratados como palabra propia entre espacios', () => {
    const chars = ['4', '2', ' ', 'x']
    expect(
      alignmentToWords({
        characters: chars,
        character_start_times_seconds: [0, 0.1, 0.2, 0.3],
        character_end_times_seconds: [0.1, 0.2, 0.3, 0.4]
      })
    ).toEqual([
      { type: 'text', value: '42', ts: 0, end_ts: 0.2 },
      { type: 'punct', value: ' ' },
      { type: 'text', value: 'x', ts: 0.3, end_ts: 0.4 }
    ])
  })

  it('Boundaries: punctuation al inicio y al final del array', () => {
    expect(
      alignmentToWords({
        characters: ['¿', 'h', 'i', '?'],
        character_start_times_seconds: [0, 0.1, 0.2, 0.3],
        character_end_times_seconds: [0.1, 0.2, 0.3, 0.4]
      })
    ).toEqual([
      { type: 'punct', value: '¿' },
      { type: 'text', value: 'hi', ts: 0.1, end_ts: 0.3 },
      { type: 'punct', value: '?' }
    ])
  })

  it('Exceptional: arrays de longitud distinta lanzan un error explícito', () => {
    expect(() =>
      alignmentToWords({
        characters: ['a', 'b'],
        character_start_times_seconds: [0],
        character_end_times_seconds: [0.1, 0.2]
      })
    ).toThrow(/misma longitud/)
  })

  it('Exceptional: alignment sin los arrays esperados lanza un error explícito', () => {
    expect(() => alignmentToWords({})).toThrow(/inválido/)
    expect(() => alignmentToWords(undefined)).toThrow(/inválido/)
  })

  it('Simple: el output es consumible por getActiveWordIndex sin modificarlo', () => {
    const words = alignmentToWords(realAlignmentSample)
    expect(getActiveWordIndex(words, 0.5)).toBe(2) // "there" (ts=0.441)
    expect(getActiveWordIndex(words, 1.5)).toBe(12) // "test" (ts=1.474)
  })
})
