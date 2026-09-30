"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { FiX } from "react-icons/fi";

/**
 * Pila de modales abiertos. El scroll del fondo se libera recién cuando se
 * cierra el último, y Escape cierra solo el de arriba (no todos a la vez).
 */
const pilaModales: Array<() => void> = [];

export function Modal({
  titulo,
  onClose,
  children,
  ancho = "max-w-lg",
  lineaSuperior = true,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  ancho?: string;
  /** Oculta la línea azul superior (útil en visores de fotos). */
  lineaSuperior?: boolean;
}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const cerrar = () => onCloseRef.current();
    pilaModales.push(cerrar);
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pilaModales[pilaModales.length - 1] === cerrar) {
        cerrar();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      const i = pilaModales.lastIndexOf(cerrar);
      if (i >= 0) pilaModales.splice(i, 1);
      if (pilaModales.length === 0) document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`relative max-h-[92dvh] w-full ${ancho} overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-5 sm:pb-5`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {lineaSuperior && (
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-blue-800" aria-hidden />
        )}
        <div className={`flex items-center justify-between gap-2 ${lineaSuperior ? "mb-4 pt-1" : "mb-3"}`}>
          <h2 className="min-w-0 truncate text-lg font-bold text-zinc-900">{titulo}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <FiX size={22} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
