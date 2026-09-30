"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { FotoOrden } from "@/lib/types";

/** Fecha corta de carga de una foto ("12/03/2026 · 14:35") o null si no hay dato. */
export function formatearFechaFoto(fecha?: string | null): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  const fechaCorta = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaCorta = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${fechaCorta} · ${horaCorta}`;
}

/**
 * Vista en grande de una foto con navegación anterior/siguiente.
 * Se usa dentro de `Modal` (que ya maneja Escape, backdrop y scroll).
 */
export function VisorFotos({
  fotos,
  indiceInicial = 0,
  descripcion,
  nombreCliente,
}: {
  fotos: FotoOrden[];
  indiceInicial?: number;
  descripcion?: string;
  nombreCliente?: string;
}) {
  // El padre usa `key={indiceInicial}` para remontar al elegir otra
  // miniatura, así no hay que sincronizar estado dentro de un efecto.
  const [indice, setIndice] = useState(() =>
    Math.min(Math.max(indiceInicial, 0), Math.max(fotos.length - 1, 0))
  );

  const anterior = useCallback(() => {
    setIndice((i) => (i - 1 + fotos.length) % fotos.length);
  }, [fotos.length]);

  const siguiente = useCallback(() => {
    setIndice((i) => (i + 1) % fotos.length);
  }, [fotos.length]);

  useEffect(() => {
    if (fotos.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") siguiente();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [anterior, siguiente, fotos.length]);

  // Deslizar a los lados en táctil para cambiar de foto.
  const tactilX = useRef<number | null>(null);

  if (fotos.length === 0) return null;
  const foto = fotos[indice];
  const fechaTxt = formatearFechaFoto(foto.fecha);

  return (
    <div>
      <div className="text-center" aria-live="polite">
        {nombreCliente && (
          <p className="truncate text-sm font-bold text-stone-900">{nombreCliente}</p>
        )}
        <p className="text-xs font-semibold text-stone-500">
          {indice + 1} / {fotos.length}
          {descripcion ? ` · ${descripcion}` : ""}
          {fechaTxt ? ` · Agregada ${fechaTxt}` : ""}
        </p>
      </div>
      <div
        className="relative mt-2 overflow-hidden rounded-xl bg-stone-950"
        onTouchStart={(e) => {
          tactilX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (tactilX.current === null || fotos.length <= 1) return;
          const dx = e.changedTouches[0].clientX - tactilX.current;
          tactilX.current = null;
          if (dx < -40) siguiente();
          else if (dx > 40) anterior();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={foto.id}
          src={foto.url}
          alt={descripcion ?? `Foto de evidencia ${indice + 1}`}
          className="mx-auto max-h-[55dvh] w-auto max-w-full object-contain sm:max-h-[60dvh]"
        />
        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-stone-950/70 text-white backdrop-blur active:bg-stone-950/90"
            >
              <FiChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={siguiente}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-stone-950/70 text-white backdrop-blur active:bg-stone-950/90"
            >
              <FiChevronRight size={22} />
            </button>
          </>
        )}
      </div>
      {fotos.length > 1 && (
        <p className="mt-2 text-center text-xs text-stone-400">
          Deslizá o usá las flechas para ver las demás.
        </p>
      )}
    </div>
  );
}
