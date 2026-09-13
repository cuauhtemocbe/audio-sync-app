import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react'
import App from './App'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const { TRANSCRIPT_FIXTURE } = vi.hoisted(() => ({
  TRANSCRIPT_FIXTURE: {
    monologues: [
      {
        elements: [
          { type: 'text', value: 'Hello', ts: 0, end_ts: 0.5 },
          { type: 'punct', value: ' ' },
          { type: 'text', value: 'world', ts: 0.5, end_ts: 1.2 },
          { type: 'punct', value: '.' },
        ],
      },
    ],
  },
}))

vi.mock('./aligned_transcript.json', () => ({ default: TRANSCRIPT_FIXTURE }))

vi.mock('./usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}))

function getAudioElement(container) {
  return container.querySelector('audio')
}

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    usePrefersReducedMotion.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('muestra el reproductor de audio y el tiempo en 0.00 al montar', () => {
    const { container } = render(<App />)
    expect(getAudioElement(container)).toBeInTheDocument()
    expect(screen.getByText('Tiempo actual: 0.00 segundos')).toBeInTheDocument()
  })

  it('resalta la primera palabra desde el inicio porque su timestamp es 0', () => {
    render(<App />)
    expect(screen.getByText('Hello')).toHaveClass('text-vu-peak')
    expect(screen.getByText('world')).not.toHaveClass('text-vu-peak')
  })

  it('al hacer click en una palabra de tipo texto, busca y reproduce en su timestamp', () => {
    const { container } = render(<App />)
    const audio = getAudioElement(container)

    fireEvent.click(screen.getByText('world'))

    expect(audio.currentTime).toBe(0.5)
    expect(audio.play).toHaveBeenCalled()
  })

  it('al presionar Enter sobre una palabra de tipo texto, busca y reproduce en su timestamp', () => {
    const { container } = render(<App />)
    const audio = getAudioElement(container)

    fireEvent.keyDown(screen.getByText('world'), { key: 'Enter' })

    expect(audio.currentTime).toBe(0.5)
    expect(audio.play).toHaveBeenCalled()
  })

  it('al presionar la barra espaciadora sobre una palabra de tipo texto, busca y reproduce en su timestamp', () => {
    const { container } = render(<App />)
    const audio = getAudioElement(container)

    fireEvent.keyDown(screen.getByText('world'), { key: ' ' })

    expect(audio.currentTime).toBe(0.5)
    expect(audio.play).toHaveBeenCalled()
  })

  it('los elementos que no son de tipo texto no son interactivos', () => {
    const { container } = render(<App />)
    const punctuationSpans = [...container.querySelectorAll('span')].filter(
      (span) => span.textContent === ' ' || span.textContent === '.'
    )

    expect(punctuationSpans).toHaveLength(2)
    punctuationSpans.forEach((span) => {
      expect(span).not.toHaveAttribute('role')
      expect(span).not.toHaveAttribute('tabindex')
    })
  })

  it('resalta solo la palabra correspondiente al tiempo actual del audio', () => {
    vi.useFakeTimers()
    const { container } = render(<App />)
    const audio = getAudioElement(container)

    act(() => {
      audio.currentTime = 0.6
      vi.advanceTimersByTime(100)
    })

    expect(screen.getByText('world')).toHaveClass('text-vu-peak')
    expect(screen.getByText('Hello')).not.toHaveClass('text-vu-peak')
  })

  it('actualiza el tiempo mostrado a medida que avanza el audio', () => {
    vi.useFakeTimers()
    const { container } = render(<App />)
    const audio = getAudioElement(container)

    act(() => {
      audio.currentTime = 0.6
      vi.advanceTimersByTime(100)
    })

    expect(screen.getByText('Tiempo actual: 0.60 segundos')).toBeInTheDocument()
  })

  it('no aplica la transición de color cuando el usuario prefiere movimiento reducido', () => {
    usePrefersReducedMotion.mockReturnValue(true)
    render(<App />)

    expect(screen.getByText('Hello')).not.toHaveClass('transition-colors')
    expect(screen.getByText('world')).not.toHaveClass('transition-colors')
  })
})
