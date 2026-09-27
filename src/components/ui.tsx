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
      className={`min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
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
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-1 text-sm font-normal text-zinc-600">{descripcion}</p>
        )}
      </div>
      {accion && <div className="w-full sm:w-auto sm:shrink-0">{accion}</div>}
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
  "w-full min-h-[44px] rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base font-normal text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 sm:text-sm sm:py-2";

export const btnPrimary =
  "inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-[15px] sm:text-sm font-medium text-white hover:bg-zinc-700 active:bg-zinc-800 disabled:opacity-50 touch-manipulation";
export const btnSecondary =
  "inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-[15px] sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-50 touch-manipulation";
export const btnDanger =
  "inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-[15px] sm:text-sm font-medium text-white hover:bg-red-500 active:bg-red-700 disabled:opacity-50 touch-manipulation";
