import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from './App'
import { generateNarration } from './generateNarration'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { DEFAULT_VOICE_ID, VOICES } from './voices'

const { WORDS_FIXTURE } = vi.hoisted(() => ({
  WORDS_FIXTURE: [
    { type: 'text', value: 'Hello', ts: 0, end_ts: 0.5 },
    { type: 'punct', value: ' ' },
    { type: 'text', value: 'world', ts: 0.5, end_ts: 1.2 },
    { type: 'punct', value: '.' }
  ]
}))

vi.mock('./generateNarration', () => ({ generateNarration: vi.fn() }))

vi.mock('./usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: vi.fn(() => false)
}))

function getAudioElement(container) {
  return container.querySelector('audio')
}

async function generateAndWaitForReady(container, audioUrl = 'blob:fake-url') {
  fireEvent.click(screen.getByRole('button', { name: 'Generar' }))
  await waitFor(() => expect(getAudioElement(container)).toBeInTheDocument())
  return audioUrl
}

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    usePrefersReducedMotion.mockReturnValue(false)
    generateNarration.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('muestra el formulario vacío y el botón Generar deshabilitado en el estado inicial', () => {
    render(<App />)
    expect(screen.getByLabelText('Texto a narrar')).toHaveValue('')
    expect(screen.getByText('0 caracteres')).toBeInTheDocument()
    expect(screen.getByLabelText('Voz')).toHaveValue(DEFAULT_VOICE_ID)
    expect(screen.getByRole('button', { name: 'Generar' })).toBeDisabled()
  })

  it('lista todas las voces disponibles en el selector', () => {
    render(<App />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(VOICES.length)
    expect(options.map((o) => o.textContent)).toEqual(VOICES.map((v) => v.name))
  })

  it('habilita Generar al escribir texto y lo vuelve a deshabilitar si queda vacío o en blanco', () => {
    render(<App />)
    const textarea = screen.getByLabelText('Texto a narrar')
    const button = screen.getByRole('button', { name: 'Generar' })

    fireEvent.change(textarea, { target: { value: 'Hola mundo' } })
    expect(screen.getByText('10 caracteres')).toBeInTheDocument()
    expect(button).not.toBeDisabled()

    fireEvent.change(textarea, { target: { value: '   ' } })
    expect(button).toBeDisabled()
  })

  it('al generar, llama a generateNarration con el texto y la voz elegidos, y muestra el progreso', async () => {
    let resolveNarration
    generateNarration.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveNarration = resolve
        })
    )

    render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    fireEvent.change(screen.getByLabelText('Voz'), { target: { value: VOICES[1].id } })
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }))

    expect(generateNarration).toHaveBeenCalledTimes(1)
    const call = generateNarration.mock.calls[0][0]
    expect(call.text).toBe('Hola mundo')
    expect(call.voiceId).toBe(VOICES[1].id)
    expect(screen.getByRole('button', { name: 'Generar' })).toBeDisabled()

    act(() => call.onProgress(0, 2))
    expect(screen.getByText('Generando… (0/2)')).toBeInTheDocument()

    act(() => call.onProgress(1, 2))
    expect(screen.getByText('Generando… (1/2)')).toBeInTheDocument()

    await act(async () => {
      resolveNarration({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    })
  })

  it('en éxito, muestra el reproductor con las palabras generadas', async () => {
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })

    await generateAndWaitForReady(container)

    expect(getAudioElement(container)).toHaveAttribute('src', 'blob:fake-url')
    expect(screen.getByText('Tiempo actual: 0.00 segundos')).toBeInTheDocument()
  })

  it('muestra el mismo salto de línea que traen las palabras generadas en vez de colapsarlo (issue #61)', async () => {
    const wordsWithLineBreak = [
      { type: 'text', value: 'Hello', ts: 0, end_ts: 0.5 },
      { type: 'punct', value: '.\n\n' },
      { type: 'text', value: 'World', ts: 0.5, end_ts: 1.2 },
      { type: 'punct', value: '.' }
    ]
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: wordsWithLineBreak })
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })

    await generateAndWaitForReady(container)

    const transcript = container.querySelector('.whitespace-pre-line')
    expect(transcript).toHaveClass('whitespace-pre-line')
    expect(transcript.textContent).toBe('Hello.\n\nWorld.')
  })

  it('resalta la primera palabra desde el inicio porque su timestamp es 0', async () => {
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })

    await generateAndWaitForReady(container)

    expect(screen.getByText('Hello')).toHaveClass('text-vu-peak')
    expect(screen.getByText('world')).not.toHaveClass('text-vu-peak')
  })

  it('al hacer click en una palabra de tipo texto, busca y reproduce en su timestamp', async () => {
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    await generateAndWaitForReady(container)

    const audio = getAudioElement(container)
    fireEvent.click(screen.getByText('world'))

    expect(audio.currentTime).toBe(0.5)
    expect(audio.play).toHaveBeenCalled()
  })

  it('renderiza las palabras de tipo texto como <button> nativo, para que Enter/Espacio funcionen sin JS propio', async () => {
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    await generateAndWaitForReady(container)

    expect(screen.getByRole('button', { name: 'Hello' }).tagName).toBe('BUTTON')
    expect(screen.getByRole('button', { name: 'world' }).tagName).toBe('BUTTON')
  })

  it('los elementos que no son de tipo texto no son interactivos', async () => {
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    await generateAndWaitForReady(container)

    const punctuationSpans = [...container.querySelectorAll('span')].filter(
      (span) => span.textContent === ' ' || span.textContent === '.'
    )

    expect(punctuationSpans).toHaveLength(2)
    punctuationSpans.forEach((span) => {
      expect(span).not.toHaveAttribute('role')
      expect(span).not.toHaveAttribute('tabindex')
    })
  })

  it('resalta solo la palabra correspondiente al tiempo actual del audio', async () => {
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    vi.useFakeTimers()
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }))
    await vi.waitFor(() => expect(getAudioElement(container)).toBeInTheDocument())

    const audio = getAudioElement(container)
    act(() => {
      audio.currentTime = 0.6
      vi.advanceTimersByTime(100)
    })

    expect(screen.getByText('world')).toHaveClass('text-vu-peak')
    expect(screen.getByText('Hello')).not.toHaveClass('text-vu-peak')
  })

  it('no aplica la transición de color cuando el usuario prefiere movimiento reducido', async () => {
    usePrefersReducedMotion.mockReturnValue(true)
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    await generateAndWaitForReady(container)

    expect(screen.getByText('Hello')).not.toHaveClass('transition-colors')
    expect(screen.getByText('world')).not.toHaveClass('transition-colors')
  })

  it('en fallo, muestra el mensaje de error y mantiene el formulario habilitado', async () => {
    generateNarration.mockRejectedValue(new Error('La API key no es válida.'))
    render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }))

    expect(await screen.findByText('La API key no es válida.')).toBeInTheDocument()
    expect(screen.getByLabelText('Texto a narrar')).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Generar' })).not.toBeDisabled()
  })

  it('tras un error, un nuevo intento limpia el mensaje anterior y puede llegar a ready', async () => {
    generateNarration.mockRejectedValueOnce(new Error('Error de red.'))
    render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }))
    expect(await screen.findByText('Error de red.')).toBeInTheDocument()

    generateNarration.mockResolvedValueOnce({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }))

    await waitFor(() => expect(screen.queryByText('Error de red.')).not.toBeInTheDocument())
    expect(await screen.findByText('Hello')).toBeInTheDocument()
  })

  it('al regenerar, libera el audioUrl anterior con URL.revokeObjectURL antes de asignar el nuevo', async () => {
    generateNarration.mockResolvedValueOnce({ audioUrl: 'blob:first-url', words: WORDS_FIXTURE })
    const { container } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    await generateAndWaitForReady(container, 'blob:first-url')

    generateNarration.mockResolvedValueOnce({ audioUrl: 'blob:second-url', words: WORDS_FIXTURE })
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }))

    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first-url'))
    await waitFor(() =>
      expect(getAudioElement(container)).toHaveAttribute('src', 'blob:second-url')
    )
  })

  it('al desmontar con un audioUrl activo, lo libera con URL.revokeObjectURL', async () => {
    generateNarration.mockResolvedValue({ audioUrl: 'blob:fake-url', words: WORDS_FIXTURE })
    const { container, unmount } = render(<App />)
    fireEvent.change(screen.getByLabelText('Texto a narrar'), { target: { value: 'Hola mundo' } })
    await generateAndWaitForReady(container)

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })
})
