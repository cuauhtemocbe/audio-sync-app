import { describe, expect, it } from 'vitest'
import { DEFAULT_VOICE_ID, VOICES } from './voices'

describe('voices', () => {
  it('tiene entre 2 y 3 presets', () => {
    expect(VOICES.length).toBeGreaterThanOrEqual(2)
    expect(VOICES.length).toBeLessThanOrEqual(3)
  })

  it('cada preset tiene id y name no vacíos', () => {
    for (const voice of VOICES) {
      expect(voice.id).toBeTruthy()
      expect(voice.name).toBeTruthy()
    }
  })

  it('los ids son únicos', () => {
    const ids = VOICES.map((voice) => voice.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('DEFAULT_VOICE_ID corresponde a un preset de VOICES', () => {
    expect(VOICES.some((voice) => voice.id === DEFAULT_VOICE_ID)).toBe(true)
  })
})
