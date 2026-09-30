"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { FiCamera, FiMaximize2, FiTrash2, FiUpload } from "react-icons/fi";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { Card, Empty, IconTile, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { VisorFotos, formatearFechaFoto } from "@/components/VisorFotos";
import type { ApiEnvelope, FotoOrden } from "@/lib/types";

const TIPOS_VALIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_PESO = 2 * 1024 * 1024;
const MAX_POR_TANDA = 5;
const MAX_PREVIEW_INLINE = 6;

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
  nombreCliente,
}: {
  ordenId: number;
  fotos: FotoOrden[];
  onCambio: () => Promise<void> | void;
  nombreCliente?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [activa, setActiva] = useState<number | null>(null);

  const vistaInline = fotos.slice(0, MAX_PREVIEW_INLINE);

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
    <>
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
          {vistaInline.map((f, i) => (
            <div key={f.id} className="group relative overflow-hidden rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setActiva(i)}
                title="Ver foto en grande"
                aria-label={`Ver foto ${i + 1} en grande`}
                className="block w-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={`Foto de la orden ${ordenId}`} className="h-24 w-full object-cover sm:h-28" loading="lazy" />
                <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-lg bg-stone-950/70 px-1.5 py-1 text-[10px] font-semibold text-white sm:opacity-0 sm:group-hover:opacity-100">
                  <FiMaximize2 size={12} /> Ver
                </span>
              </button>
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
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm active:bg-stone-100 disabled:opacity-50 sm:flex-1"
        >
          {subiendo ? <Spinner tamano="sm" /> : <FiUpload size={15} />}
          {subiendo ? "Subiendo..." : fotos.length === 0 ? "Subir fotos" : "Agregar más fotos"}
        </button>
        {fotos.length > 1 && (
          <button
            type="button"
            onClick={() => setGaleriaAbierta(true)}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white active:bg-stone-700 sm:w-auto sm:shrink-0"
          >
            <FiMaximize2 size={15} /> Ver todas ({fotos.length})
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void subir(e.target.files)}
      />
    </Card>
    <AnimatePresence>
      {galeriaAbierta && activa === null && (
        <Modal titulo={`Fotos de evidencia (${fotos.length})`} onClose={() => setGaleriaAbierta(false)} ancho="max-w-3xl" lineaSuperior={false}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotos.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiva(i)}
                title={`Ver foto ${i + 1} en grande`}
                aria-label={`Ver foto ${i + 1} en grande`}
                className="block cursor-zoom-in overflow-hidden rounded-xl border border-stone-200 active:ring-2 active:ring-blue-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={`Foto ${i + 1} de la orden ${ordenId}`} className="h-20 w-full object-cover sm:h-24" loading="lazy" />
                <span className="block truncate bg-white px-1 py-1 text-center text-[10px] font-medium leading-tight text-stone-500">
                  {formatearFechaFoto(f.fecha) ?? "Sin fecha"}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-stone-500">
            Tocá una miniatura para verla en grande.
          </p>
        </Modal>
      )}
      {activa !== null && fotos[activa] && (
        <Modal titulo="Vista en grande" onClose={() => setActiva(null)} ancho="max-w-4xl" lineaSuperior={false}>
          <VisorFotos key={activa} fotos={fotos} indiceInicial={activa} descripcion={`orden ${ordenId}`} nombreCliente={nombreCliente} />
        </Modal>
      )}
    </AnimatePresence>
    </>
  );
}
