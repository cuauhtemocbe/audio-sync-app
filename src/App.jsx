// src/App.jsx
import { useEffect, useRef, useState } from 'react'
import transcript from './aligned_transcript.json'
import { getActiveWordIndex } from './getActiveWordIndex'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export default function App() {
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()

  // Obtener las palabras del transcript, con un id estable asignado una sola vez
  // (no el índice de posición en cada render) para que la key de React no dependa
  // del orden de iteración.
  const words = transcript.monologues
    .flatMap((mono) => mono.elements)
    .map((w, i) => ({ ...w, id: i }))

  // Calcular la palabra activa (subrayado se mantiene hasta que la siguiente palabra comience)
  const activeWordIndex = getActiveWordIndex(words, currentTime)

  // Actualizar el tiempo actual cada 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Función para saltar a una palabra
  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      audioRef.current.play()
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto bg-vu-housing min-h-screen text-vu-scale">
      <h1 className="flex items-center gap-2 text-2xl font-bold font-display mb-4">
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="3" y="16" width="4" height="9" rx="1.5" className="fill-vu-scale" />
          <rect x="10" y="9" width="4" height="16" rx="1.5" className="fill-vu-scale" />
          <rect x="17" y="3" width="4" height="22" rx="1.5" className="fill-vu-peak" />
          <rect x="24" y="12" width="4" height="13" rx="1.5" className="fill-vu-scale" />
          <line x1="17" y1="28" x2="21" y2="28" strokeWidth="2" strokeLinecap="round" className="stroke-vu-peak" />
        </svg>
        Texto sincronizado con audio
      </h1>

      <audio ref={audioRef} controls className="w-full mb-4">
        <source src="/daily_job.mp3" type="audio/mp3" />
        <track kind="captions" src="/captions.vtt" srcLang="en" label="English" default />
        Tu navegador no soporta audio.
      </audio>

      <div className="font-body text-lg leading-relaxed text-justify">
        {words.map((w, idx) => {
          const isClickable = w.type === 'text'
          return (
            <span
              key={w.id}
              onClick={isClickable ? () => seekTo(w.ts) : undefined}
              onKeyDown={
                isClickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        seekTo(w.ts)
                      }
                    }
                  : undefined
              }
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              className={`cursor-pointer underline underline-offset-4 ${
                prefersReducedMotion ? '' : 'transition-colors duration-150'
              } ${
                idx === activeWordIndex
                  ? 'decoration-vu-peak text-vu-peak'
                  : 'decoration-transparent text-vu-scale'
              }`}
              style={{ textUnderlinePosition: 'under' }}
            >
              {w.value}
            </span>
          )
        })}
      </div>

      <p className="font-mono mt-4 text-sm text-vu-dial">Tiempo actual: {currentTime.toFixed(2)} segundos</p>
    </div>
  )
}
