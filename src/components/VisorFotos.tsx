"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";
import type { FotoOrden } from "@/lib/types";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_DOBLE_TAP = 2.5;

function limitar(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

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

  // Zoom propio de la imagen (1x–4x) con desplazamiento contenido en el marco.
  // Al cambiar de foto el componente se remonta (key del padre) y vuelve a 1x.
  const [escala, setEscala] = useState(ZOOM_MIN);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [transicion, setTransicion] = useState(false);
  const marcoRef = useRef<HTMLDivElement>(null);
  const gestoRef = useRef({
    dedos: 0,
    dist: 0,
    escalaIni: ZOOM_MIN,
    panIni: { x: 0, y: 0 },
    x0: 0,
    y0: 0,
    movido: false,
    ultimoTap: 0,
  });

  // Arrastre con cursor en PC cuando hay zoom (en táctil lo maneja el touch).
  const ratonRef = useRef({ activo: false, x0: 0, y0: 0, panIni: { x: 0, y: 0 } });

  const limitarPan = useCallback((x: number, y: number, e: number) => {
    const marco = marcoRef.current;
    if (!marco || e <= ZOOM_MIN) return { x: 0, y: 0 };
    return {
      x: limitar(x, (-(e - 1) * marco.clientWidth) / 2, ((e - 1) * marco.clientWidth) / 2),
      y: limitar(y, (-(e - 1) * marco.clientHeight) / 2, ((e - 1) * marco.clientHeight) / 2),
    };
  }, []);

  const fijarZoom = useCallback((nueva: number, centro?: { x: number; y: number }) => {
    const marco = marcoRef.current;
    const e = limitar(nueva, ZOOM_MIN, ZOOM_MAX);
    setEscala(e);
    setPan((p) => {
      if (e <= ZOOM_MIN) return { x: 0, y: 0 };
      const base = centro ?? p;
      if (!marco) return base;
      return {
        x: limitar(base.x, (-(e - 1) * marco.clientWidth) / 2, ((e - 1) * marco.clientWidth) / 2),
        y: limitar(base.y, (-(e - 1) * marco.clientHeight) / 2, ((e - 1) * marco.clientHeight) / 2),
      };
    });
  }, []);

  const restablecerZoom = useCallback(() => {
    setTransicion(true);
    setEscala(ZOOM_MIN);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && fotos.length > 1) {
        if (escala <= ZOOM_MIN) anterior();
      } else if (e.key === "ArrowRight" && fotos.length > 1) {
        if (escala <= ZOOM_MIN) siguiente();
      } else if (e.key === "+" || e.key === "=") {
        setTransicion(true);
        fijarZoom(escala + 1);
      } else if (e.key === "-") {
        setTransicion(true);
        fijarZoom(escala - 1);
      } else if (e.key === "0") {
        restablecerZoom();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [anterior, siguiente, fotos.length, escala, fijarZoom, restablecerZoom]);

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
        ref={marcoRef}
        className={`relative mt-2 touch-none select-none overflow-hidden rounded-xl bg-stone-950 ${
          escala > ZOOM_MIN ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onMouseDown={(e) => {
          if (e.button !== 0 || escala <= ZOOM_MIN) return;
          if ((e.target as HTMLElement).closest("button")) return;
          const r = ratonRef.current;
          r.activo = true;
          r.x0 = e.clientX;
          r.y0 = e.clientY;
          r.panIni = pan;
          setTransicion(false);
        }}
        onMouseMove={(e) => {
          const r = ratonRef.current;
          if (!r.activo) return;
          setPan(limitarPan(r.panIni.x + (e.clientX - r.x0), r.panIni.y + (e.clientY - r.y0), escala));
        }}
        onMouseUp={() => {
          ratonRef.current.activo = false;
        }}
        onMouseLeave={() => {
          ratonRef.current.activo = false;
        }}
        onTouchStart={(e) => {
          const g = gestoRef.current;
          g.dedos = e.touches.length;
          g.movido = false;
          setTransicion(false);
          if (e.touches.length === 2) {
            g.dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            g.escalaIni = escala;
            g.panIni = pan;
          } else if (e.touches.length === 1) {
            g.x0 = e.touches[0].clientX;
            g.y0 = e.touches[0].clientY;
            g.panIni = pan;
          }
        }}
        onTouchMove={(e) => {
          const g = gestoRef.current;
          if (e.touches.length === 2 && g.dist > 0) {
            // Pellizco: solo la imagen, la página y el modal quedan quietos.
            const d = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            if (Math.abs(d - g.dist) > 4) g.movido = true;
            fijarZoom((g.escalaIni * d) / g.dist);
          } else if (e.touches.length === 1 && escala > ZOOM_MIN) {
            // Con zoom: un dedo arrastra la imagen dentro del marco.
            const dx = e.touches[0].clientX - g.x0;
            const dy = e.touches[0].clientY - g.y0;
            if (Math.abs(dx) + Math.abs(dy) > 6) g.movido = true;
            const marco = marcoRef.current;
            const maxX = marco ? ((escala - 1) * marco.clientWidth) / 2 : 0;
            const maxY = marco ? ((escala - 1) * marco.clientHeight) / 2 : 0;
            setPan({
              x: limitar(g.panIni.x + dx, -maxX, maxX),
              y: limitar(g.panIni.y + dy, -maxY, maxY),
            });
          }
        }}
        onTouchEnd={(e) => {
          const g = gestoRef.current;
          if (g.dedos === 2) {
            fijarZoom(escala);
            g.dedos = e.touches.length;
            if (e.touches.length === 1) {
              g.x0 = e.touches[0].clientX;
              g.y0 = e.touches[0].clientY;
              g.panIni = pan;
            }
            return;
          }
          const dx = e.changedTouches[0].clientX - g.x0;
          const ahora = Date.now();
          if (!g.movido && ahora - g.ultimoTap < 300) {
            // Doble tap: alterna 1x / 2.5x.
            g.ultimoTap = 0;
            setTransicion(true);
            if (escala > ZOOM_MIN) restablecerZoom();
            else fijarZoom(ZOOM_DOBLE_TAP, { x: 0, y: 0 });
          } else {
            g.ultimoTap = ahora;
            // Sin zoom: desliz lateral cambia de foto, como antes.
            if (escala <= ZOOM_MIN && fotos.length > 1) {
              if (dx < -40) siguiente();
              else if (dx > 40) anterior();
            }
          }
          g.dedos = 0;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={foto.id}
          src={foto.url}
          alt={descripcion ?? `Foto de evidencia ${indice + 1}`}
          draggable={false}
          className="mx-auto max-h-[55dvh] w-auto max-w-full touch-none select-none object-contain sm:max-h-[60dvh]"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${escala})`,
            transformOrigin: "center center",
            transition: transicion ? "transform 0.2s ease" : undefined,
          }}
        />
        {escala > ZOOM_MIN && (
          <span className="absolute bottom-2 left-2 rounded-full bg-stone-950/70 px-2.5 py-1 text-[11px] font-bold text-white">
            {Math.round(escala * 100)}%
          </span>
        )}
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setTransicion(true);
              fijarZoom(escala + 1);
            }}
            disabled={escala >= ZOOM_MAX}
            aria-label="Acercar imagen"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-stone-950/70 text-white backdrop-blur active:bg-stone-950/90 disabled:opacity-40"
          >
            <FiZoomIn size={20} />
          </button>
          {escala > ZOOM_MIN && (
            <>
              <button
                type="button"
                onClick={() => {
                  setTransicion(true);
                  fijarZoom(escala - 1);
                }}
                aria-label="Alejar imagen"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-stone-950/70 text-white backdrop-blur active:bg-stone-950/90"
              >
                <FiZoomOut size={20} />
              </button>
              <button
                type="button"
                onClick={restablecerZoom}
                aria-label="Restablecer zoom"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-stone-950/70 text-white backdrop-blur active:bg-stone-950/90"
              >
                <FiRefreshCw size={18} />
              </button>
            </>
          )}
        </div>
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
      <p className="mt-2 text-center text-xs text-stone-400">
        Pellizcá o tocá 2 veces para ampliar
        {fotos.length > 1 ? " · Deslizá para ver las demás." : "."}
      </p>
    </div>
  );
}
