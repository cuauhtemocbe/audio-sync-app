import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => globalThis.matchMedia(QUERY).matches
  )

  useEffect(() => {
    const mediaQueryList = globalThis.matchMedia(QUERY)
    const handleChange = (event) => setPrefersReducedMotion(event.matches)

    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
