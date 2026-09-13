import { describe, it, expect } from 'vitest'
import { chunkText } from './chunkText'

describe('chunkText', () => {
  it('texto corto (menor al límite) devuelve un solo chunk', () => {
    expect(chunkText('Hello world.')).toEqual(['Hello world.'])
  })

  it('texto largo con puntuación corta en límites de oración', () => {
    const text = 'Sentence one is here. Sentence two is here. Sentence three is here.'
    expect(chunkText(text, 30)).toEqual([
      'Sentence one is here.',
      'Sentence two is here.',
      'Sentence three is here.'
    ])
  })

  it('una oración sola mayor al límite hace corte duro en palabra, nunca a mitad de palabra', () => {
    const text = 'one two three four five six seven eight nine ten'
    const chunks = chunkText(text, 15)
    expect(chunks).toEqual(['one two three', 'four five six', 'seven eight', 'nine ten'])
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(15)
      expect(chunk.trim()).toBe(chunk)
    })
  })

  it('texto sin ninguna puntuación de cierre cabe en un solo chunk si entra en el límite', () => {
    const text = 'one two three four five six seven eight nine ten'
    expect(chunkText(text, 100)).toEqual([text])
  })

  it('límite exacto: texto de longitud igual a maxChars entra en un solo chunk', () => {
    const text = 'a'.repeat(10)
    expect(chunkText(text, 10)).toEqual([text])
  })

  it('input vacío o nulo devuelve un array vacío', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText(undefined)).toEqual([])
    expect(chunkText(null)).toEqual([])
  })

  it('texto compuesto solo de puntuación de cierre (sin ninguna oración real) devuelve []', () => {
    expect(chunkText('...')).toEqual([])
    expect(chunkText('?!')).toEqual([])
  })

  it('ningún chunk excede maxChars con texto largo de muchas oraciones cortas', () => {
    const text = 'Uno dos tres. '.repeat(50)
    const chunks = chunkText(text, 40)
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach((chunk) => expect(chunk.length).toBeLessThanOrEqual(40))
  })
})
