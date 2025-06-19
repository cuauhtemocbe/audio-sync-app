// src/App.jsx
import { useEffect, useRef, useState } from "react";
import transcript from "./aligned_transcript.json";

export default function App() {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Obtener las palabras del transcript
  const words = transcript.monologues.flatMap((mono) =>
    mono.elements.filter((el) => el.type === "text")
  );

  // Calcular la palabra activa (por índice)
  const activeWordIndex = words.findIndex(
    (w) => currentTime >= w.ts && currentTime <= w.end_ts
  );

  // Actualizar el tiempo actual cada 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Función para saltar a una palabra
  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-2xl font-bold mb-4">🎧 Texto sincronizado con audio</h1>

      <audio ref={audioRef} controls className="w-full mb-4">
        <source src="/daily_job.mp3" type="audio/mp3" />
        Tu navegador no soporta audio.
      </audio>

      <div className="text-lg leading-relaxed">
        {words.map((w, idx) => (
          <span
            key={idx}
            onClick={() => seekTo(w.ts)}
            className={`cursor-pointer ${
              idx === activeWordIndex ? "bg-blue-600 text-white px-1 rounded" : ""
            }`}
          >
            {w.value + " "}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-400">
        Tiempo actual: {currentTime.toFixed(2)} segundos
      </p>
    </div>
  );
}

