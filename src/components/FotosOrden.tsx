"use client";

import { useRef, useState } from "react";
import { FiCamera, FiTrash2, FiUpload } from "react-icons/fi";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { Card, Empty, IconTile, Spinner } from "@/components/ui";
import type { ApiEnvelope, FotoOrden } from "@/lib/types";

const TIPOS_VALIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_PESO = 2 * 1024 * 1024;
const MAX_POR_TANDA = 5;

const Toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

function validarArchivo(f: File): string | null {
  if (!TIPOS_VALIDOS.includes(f.type)) return `"${f.name}": solo se permiten fotos JPEG, PNG o WEBP.`;
  if (f.size > MAX_PESO) return `"${f.name}": supera los 2 MB.`;
  return null;
}

export function FotosOrden({
  ordenId,
  fotos,
  onCambio,
}: {
  ordenId: number;
  fotos: FotoOrden[];
  onCambio: () => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const subir = async (lista: FileList | null) => {
    if (!lista || lista.length === 0 || subiendo) return;
    const archivos = Array.from(lista);
    for (const f of archivos) {
      const problema = validarArchivo(f);
      if (problema) {
        void Toast.fire({ icon: "error", title: "Archivo no válido", text: problema });
        return;
      }
    }
    const tanda = archivos.slice(0, MAX_POR_TANDA);
    if (archivos.length > MAX_POR_TANDA) {
      void Toast.fire({
        icon: "info",
        title: `Se suben las primeras ${MAX_POR_TANDA}`,
        text: "El servidor acepta hasta 5 fotos por vez.",
      });
    }
    setSubiendo(true);
    try {
      await api.postFotos<ApiEnvelope<FotoOrden[]>>(`/api/orden-reparacion/${ordenId}/fotos`, tanda);
      await onCambio();
      void Toast.fire({
        icon: "success",
        title: tanda.length > 1 ? "Fotos subidas" : "Foto subida",
        text: "Ya se ven en la ficha y en el historial.",
      });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudieron subir las fotos";
      void Toast.fire({ icon: "error", title: "No se pudo subir", text: mensaje });
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const eliminar = async (foto: FotoOrden) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar foto?",
      text: "Se quitará de la ficha y del servidor. Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.del(`/api/orden-reparacion/fotos/${foto.id}`);
      await onCambio();
      void Toast.fire({ icon: "success", title: "Foto eliminada" });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo eliminar la foto";
      void Toast.fire({ icon: "error", title: "No se pudo eliminar", text: mensaje });
    }
  };

  return (
    <Card>
      <h2 className="flex items-center gap-2 font-bold text-stone-900">
        <IconTile tono="blue"><FiCamera size={16} /></IconTile> Fotos de evidencia ({fotos.length})
      </h2>
      {fotos.length === 0 ? (
        <div className="mt-3">
          <Empty mensaje="Sin fotos" detalle="Subí hasta 5 por vez (JPEG, PNG o WEBP de hasta 2 MB)." />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <div key={f.id} className="group relative overflow-hidden rounded-xl border border-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={`Foto de la orden ${ordenId}`} className="h-24 w-full object-cover sm:h-28" loading="lazy" />
              <button
                type="button"
                onClick={() => void eliminar(f)}
                title="Eliminar foto"
                aria-label="Eliminar foto"
                className="absolute right-1 top-1 inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg bg-stone-950/70 text-white active:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm active:bg-stone-100 disabled:opacity-50"
      >
        {subiendo ? <Spinner tamano="sm" /> : <FiUpload size={15} />}
        {subiendo ? "Subiendo..." : fotos.length === 0 ? "Subir fotos" : "Agregar más fotos"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void subir(e.target.files)}
      />
    </Card>
  );
}
