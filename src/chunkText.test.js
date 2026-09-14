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

  // issue #61: preservar los saltos de línea del input en vez de re-unir oraciones con ' ' hardcodeado
  it('texto sin saltos de línea mantiene el mismo comportamiento de unión con un solo espacio', () => {
    const text = 'Sentence one is here. Sentence two is here. Sentence three is here.'
    expect(chunkText(text, 30)).toEqual([
      'Sentence one is here.',
      'Sentence two is here.',
      'Sentence three is here.'
    ])
  })

  it('una línea en blanco entre dos oraciones se conserva dentro del mismo chunk', () => {
    const text = 'Sentence one.\n\nSentence two.'
    expect(chunkText(text, 100)).toEqual(['Sentence one.\n\nSentence two.'])
  })

  it.each(['\n', '\n\n'])(
    'cualquier separador de salto de línea entre oraciones sobrevive al chunking (%j)',
    (separator) => {
      const text = `Sentence one.${separator}Sentence two.`
      expect(chunkText(text, 100)).toEqual([`Sentence one.${separator}Sentence two.`])
    }
  )

  it('un corte duro por palabra conserva los saltos de línea internos', () => {
    const text = 'one\ntwo\n\nthree four five six seven eight nine ten'
    const chunks = chunkText(text, 15)
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(15)
      expect(chunk).not.toMatch(/^\s|\s$/)
    })
    expect(chunks.join(' ').replace(/ +/g, ' ')).toContain('one')
    expect(chunks.some((chunk) => chunk.includes('\n'))).toBe(true)
  })

  it('dos oraciones pegadas sin ningún separador se unen con un espacio, como antes', () => {
    expect(chunkText('Hi.World.', 100)).toEqual(['Hi. World.'])
  })

  it('un salto de párrafo cerca del límite del chunk no deja un salto de línea colgante en el borde', () => {
    const text = 'Sentence one is here.\n\nSentence two is here.'
    const chunks = chunkText(text, 25)
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach((chunk) => {
      expect(chunk.startsWith('\n')).toBe(false)
      expect(chunk.endsWith('\n')).toBe(false)
    })
  })
})
