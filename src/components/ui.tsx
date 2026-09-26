import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-1 text-sm font-normal text-zinc-600">{descripcion}</p>
        )}
      </div>
      {accion}
    </div>
  );
}

export function Badge({
  children,
  tono = "zinc",
}: {
  children: ReactNode;
  tono?: "zinc" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const tonos: Record<string, string> = {
    zinc: "bg-zinc-200 text-zinc-800",
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    violet: "bg-violet-100 text-violet-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

export function Empty({
  mensaje,
  detalle,
}: {
  mensaje: string;
  detalle?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
      <p className="font-medium text-zinc-800">{mensaje}</p>
      {detalle && <p className="mt-1 text-sm text-zinc-600">{detalle}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50";
