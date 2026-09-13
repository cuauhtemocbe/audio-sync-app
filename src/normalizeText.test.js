import { describe, it, expect } from 'vitest'
import { normalizeText } from './normalizeText'

describe('normalizeText', () => {
  it('agrega espacio faltante tras puntuación de cierre', () => {
    expect(normalizeText('Hola.Mundo')).toBe('Hola. Mundo')
    expect(normalizeText('Uno,dos,tres')).toBe('Uno, dos, tres')
  })

  it('colapsa espacios múltiples en uno solo', () => {
    expect(normalizeText('Hola   mundo')).toBe('Hola mundo')
  })

  it('preserva los saltos de línea', () => {
    expect(normalizeText('Hola\nMundo')).toBe('Hola\nMundo')
    expect(normalizeText('Hola.\nMundo')).toBe('Hola.\nMundo')
  })

  it('no modifica un texto ya normalizado', () => {
    expect(normalizeText('Hola, mundo. ¿Cómo estás?')).toBe('Hola, mundo. ¿Cómo estás?')
  })

  it('devuelve string vacío para input vacío o nulo', () => {
    expect(normalizeText('')).toBe('')
    expect(normalizeText(undefined)).toBe('')
    expect(normalizeText(null)).toBe('')
  })
})
