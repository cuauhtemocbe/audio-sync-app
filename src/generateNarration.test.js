import { describe, expect, it, vi } from 'vitest'
import { chunkText } from './chunkText'
import { concatMp3Chunks, encodeWavBlob, generateNarration } from './generateNarration'
import { normalizeText } from './normalizeText'

function fakeAlignment() {
  return {
    characters: ['h', 'i'],
    character_start_times_seconds: [0, 0.1],
    character_end_times_seconds: [0.1, 0.2]
  }
}

function fakeAudioBase64() {
  return btoa('fake-mp3-bytes')
}

function fakeAudioBufferLike(duration, { numberOfChannels = 1, sampleRate = 44100, samples } = {}) {
  const frameCount = samples ?? Math.round(duration * sampleRate)
  const channelData = Array.from({ length: numberOfChannels }, () => new Float32Array(frameCount))
  return {
    duration,
    numberOfChannels,
    sampleRate,
    getChannelData: (channel) => channelData[channel]
  }
}

function longMultiChunkText() {
  const sentence = 'Palabra uno dos tres cuatro cinco seis siete ocho nueve diez.'
  return Array(120).fill(sentence).join(' ')
}

describe('concatMp3Chunks', () => {
  it('array vacío devuelve un Uint8Array vacío', () => {
    expect(concatMp3Chunks([])).toEqual(new Uint8Array())
  })

  it('un solo chunk devuelve una copia idéntica', () => {
    const chunk = new Uint8Array([1, 2, 3])
    expect(concatMp3Chunks([chunk])).toEqual(chunk)
  })

  it('concatena varios chunks en orden, longitud = suma de longitudes', () => {
    const a = new Uint8Array([1, 2])
    const b = new Uint8Array([3, 4, 5])
    const result = concatMp3Chunks([a, b])
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]))
    expect(result.length).toBe(5)
  })
})

describe('encodeWavBlob', () => {
  it('produce un Blob audio/wav con header RIFF/WAVE válido y tamaño esperado', async () => {
    const bufferLike = fakeAudioBufferLike(undefined, { numberOfChannels: 1, sampleRate: 8000, samples: 4 })
    const blob = encodeWavBlob(bufferLike)

    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + 4 * 2)

    const arrayBuffer = await blob.arrayBuffer()
    const view = new DataView(arrayBuffer)
    const readAscii = (offset, length) =>
      Array.from({ length }, (_, i) => String.fromCharCode(view.getUint8(offset + i))).join('')

    expect(readAscii(0, 4)).toBe('RIFF')
    expect(readAscii(8, 4)).toBe('WAVE')
    expect(readAscii(12, 4)).toBe('fmt ')
    expect(readAscii(36, 4)).toBe('data')
    expect(view.getUint16(22, true)).toBe(1) // numberOfChannels
    expect(view.getUint32(24, true)).toBe(8000) // sampleRate
    expect(view.getUint16(34, true)).toBe(16) // bits per sample
  })
})

describe('generateNarration', () => {
  it('texto vacío (0 chunks) rechaza sin llamar requestTts', async () => {
    const requestTtsImpl = vi.fn()
    const decodeAudio = vi.fn()

    await expect(
      generateNarration({ text: '', voiceId: 'v1', requestTts: requestTtsImpl, decodeAudio })
    ).rejects.toThrow('generateNarration: el texto normalizado no produjo ningún chunk.')
    expect(requestTtsImpl).not.toHaveBeenCalled()
  })

  it('texto de 1 chunk no manda previousText/nextText y no offsetea words', async () => {
    const requestTtsImpl = vi.fn().mockResolvedValue({
      audioBase64: fakeAudioBase64(),
      alignment: fakeAlignment()
    })
    const decodeAudio = vi.fn().mockResolvedValue(fakeAudioBufferLike(1))

    const result = await generateNarration({
      text: 'Un texto corto.',
      voiceId: 'v1',
      requestTts: requestTtsImpl,
      decodeAudio
    })

    expect(requestTtsImpl).toHaveBeenCalledTimes(1)
    expect(requestTtsImpl.mock.calls[0][0]).toMatchObject({ previousText: undefined, nextText: undefined })
    expect(result.words).toEqual([{ type: 'text', value: 'hi', ts: 0, end_ts: 0.2 }])
    expect(result.audioUrl).toMatch(/^blob:/)
  })

  it('texto de 3+ chunks manda previousText/nextText correctos y onProgress en secuencia', async () => {
    const text = longMultiChunkText()
    const expectedChunks = chunkText(normalizeText(text))
    expect(expectedChunks.length).toBeGreaterThanOrEqual(3)

    const requestTtsImpl = vi.fn().mockResolvedValue({
      audioBase64: fakeAudioBase64(),
      alignment: fakeAlignment()
    })
    const decodeAudio = vi.fn().mockResolvedValue(fakeAudioBufferLike(1))
    const onProgress = vi.fn()

    await generateNarration({
      text,
      voiceId: 'v1',
      onProgress,
      requestTts: requestTtsImpl,
      decodeAudio
    })

    expect(requestTtsImpl).toHaveBeenCalledTimes(expectedChunks.length)
    expectedChunks.forEach((chunk, i) => {
      expect(requestTtsImpl.mock.calls[i][0]).toMatchObject({
        text: chunk,
        voiceId: 'v1',
        previousText: expectedChunks[i - 1],
        nextText: expectedChunks[i + 1]
      })
    })

    expect(onProgress).toHaveBeenCalledTimes(expectedChunks.length + 1)
    expect(onProgress).toHaveBeenNthCalledWith(1, 0, expectedChunks.length)
    expect(onProgress).toHaveBeenNthCalledWith(
      expectedChunks.length + 1,
      expectedChunks.length,
      expectedChunks.length
    )
  })

  it('sin divergencia de duraciones devuelve un Blob audio/mpeg', async () => {
    const requestTtsImpl = vi.fn().mockResolvedValue({
      audioBase64: fakeAudioBase64(),
      alignment: fakeAlignment()
    })
    // 2 chunks de 1s cada uno + decode final del blob concatenado ≈ 2s (sin divergencia)
    const decodeAudio = vi
      .fn()
      .mockResolvedValueOnce(fakeAudioBufferLike(1))
      .mockResolvedValueOnce(fakeAudioBufferLike(1))
      .mockResolvedValueOnce(fakeAudioBufferLike(2))

    let capturedBlob
    const originalCreateObjectURL = URL.createObjectURL
    URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob
      return 'blob:fake-url'
    })

    try {
      await generateNarration({
        text: `${'Oración corta uno. '.repeat(200)}`,
        voiceId: 'v1',
        requestTts: requestTtsImpl,
        decodeAudio
      })
    } finally {
      URL.createObjectURL = originalCreateObjectURL
    }

    expect(capturedBlob.type).toBe('audio/mpeg')
  })

  it('con divergencia de duraciones (> 0.1s) devuelve un Blob audio/wav', async () => {
    const requestTtsImpl = vi.fn().mockResolvedValue({
      audioBase64: fakeAudioBase64(),
      alignment: fakeAlignment()
    })
    // 2 chunks de 1s cada uno (suma 2s) pero el decode final del blob concatenado da 2.5s → diverge
    const decodeAudio = vi
      .fn()
      .mockResolvedValueOnce(fakeAudioBufferLike(1))
      .mockResolvedValueOnce(fakeAudioBufferLike(1))
      .mockResolvedValueOnce(fakeAudioBufferLike(2.5, { samples: 4 }))

    let capturedBlob
    const originalCreateObjectURL = URL.createObjectURL
    URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob
      return 'blob:fake-url'
    })

    try {
      await generateNarration({
        text: `${'Oración corta uno. '.repeat(200)}`,
        voiceId: 'v1',
        requestTts: requestTtsImpl,
        decodeAudio
      })
    } finally {
      URL.createObjectURL = originalCreateObjectURL
    }

    expect(capturedBlob.type).toBe('audio/wav')
  })

  it('propaga el rechazo si requestTts falla a mitad de pipeline, sin progresar chunks posteriores', async () => {
    const text = longMultiChunkText()
    const expectedChunks = chunkText(normalizeText(text))
    expect(expectedChunks.length).toBeGreaterThanOrEqual(3)

    const failure = new Error('ElevenLabs caído')
    const requestTtsImpl = vi
      .fn()
      .mockResolvedValueOnce({ audioBase64: fakeAudioBase64(), alignment: fakeAlignment() })
      .mockRejectedValueOnce(failure)
    const decodeAudio = vi.fn().mockResolvedValue(fakeAudioBufferLike(1))
    const onProgress = vi.fn()

    await expect(
      generateNarration({ text, voiceId: 'v1', onProgress, requestTts: requestTtsImpl, decodeAudio })
    ).rejects.toBe(failure)

    expect(requestTtsImpl).toHaveBeenCalledTimes(2)
    // onProgress(0, total) inicial + onProgress(1, total) tras el primer chunk exitoso, nada más
    expect(onProgress).toHaveBeenCalledTimes(2)
  })
})
