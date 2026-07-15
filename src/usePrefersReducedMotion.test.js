import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

function mockMatchMedia(initialMatches) {
  let changeHandler = null
  const mql = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (event, handler) => {
      if (event === 'change') changeHandler = handler
    },
    removeEventListener: (event) => {
      if (event === 'change') changeHandler = null
    },
  }
  window.matchMedia = vi.fn().mockReturnValue(mql)
  return {
    mql,
    triggerChange(matches) {
      mql.matches = matches
      changeHandler?.({ matches })
    },
  }
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('devuelve false cuando el sistema no tiene activada la preferencia de movimiento reducido', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('devuelve true cuando el sistema tiene activada la preferencia de movimiento reducido', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('reacciona en caliente cuando la preferencia del sistema cambia sin recargar la página', () => {
    const { triggerChange } = mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)

    act(() => {
      triggerChange(true)
    })

    expect(result.current).toBe(true)
  })
})
