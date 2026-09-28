"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCamera, FiUpload, FiX } from "react-icons/fi";

/**
 * Maqueta de subida de imagen por equipo.
 * El backend AÚN no tiene endpoint de upload: guarda preview local
 * (object URL + base64 en localStorage) y marca como "pendiente de subir".
 */
export function ImageUploader({
  equipoKey,
  value,
  onChange,
}: {
  equipoKey: string;
  value?: string | null;
  onChange?: (dataUrl: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Máximo 5 MB por imagen.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setPreview(dataUrl);
      try {
        localStorage.setItem(`equipo-img:${equipoKey}`, dataUrl);
      } catch {
        // quota excedida: solo preview en memoria
      }
      onChange?.(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const quitar = () => {
    setPreview(null);
    try {
      localStorage.removeItem(`equipo-img:${equipoKey}`);
    } catch {
      // noop
    }
    onChange?.(null);
  };

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
      <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
        <FiCamera size={15} /> Foto del equipo
      </p>
      <p className="mt-0.5 text-xs font-normal text-zinc-600">
        La foto queda guardada en este dispositivo y se subirá cuando el
        sistema lo permita.
      </p>
      {preview ? (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa del equipo"
            className="h-40 w-full rounded-lg border border-zinc-200 object-cover"
          />
          <div className="mt-2 flex gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Pendiente de subir
            </span>
            <button
              type="button"
              onClick={quitar}
              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
            >
              <FiX size={13} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-6 text-center hover:bg-zinc-100">
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <FiUpload size={15} /> Arrastrá o hacé clic para subir
          </span>
          <span className="mt-1 text-xs text-zinc-600">PNG / JPG · máx 5 MB</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <FiAlertTriangle size={13} /> {error}
        </p>
      )}
    </div>
  );
}
