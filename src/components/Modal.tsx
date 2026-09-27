"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";

export function Modal({
  titulo,
  onClose,
  children,
  ancho = "max-w-lg",
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={`relative max-h-[92dvh] w-full ${ancho} overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-5 sm:pb-5`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-blue-800" aria-hidden />
        <div className="mb-4 flex items-center justify-between gap-2 pt-1">
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
      </div>
    </div>
  );
}
