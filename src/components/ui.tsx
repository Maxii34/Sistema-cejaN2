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
      className={`min-w-0 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-[0_10px_28px_-18px_rgba(28,25,23,0.35)] sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  titulo,
  descripcion,
  accion,
  eyebrow,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-800">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-1 text-sm font-normal text-stone-500">{descripcion}</p>
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
    zinc: "bg-stone-100 text-stone-700 ring-stone-200",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-800 ring-blue-200",
    violet: "bg-violet-50 text-violet-800 ring-violet-200",
  };
  const dots: Record<string, string> = {
    zinc: "bg-stone-400",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tonos[tono]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tono]}`} />
      {children}
    </span>
  );
}

export function Spinner({
  tamano = "md",
  className = "",
}: {
  tamano?: "sm" | "md" | "lg";
  className?: string;
}) {
  const medidas = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-stone-200 border-t-blue-800 ${medidas[tamano]} ${className}`}
    />
  );
}

export function CargandoPagina({ texto = "Cargando..." }: { texto?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 pb-28">
      <Spinner tamano="lg" />
      <p className="text-sm font-medium text-stone-500">{texto}</p>
    </div>
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
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-8 text-center">
      <p className="font-semibold text-stone-800">{mensaje}</p>
      {detalle && <p className="mt-1 text-sm text-stone-500">{detalle}</p>}
    </div>
  );
}

/** Pastilla de icono con color para stat cards y secciones */
export function IconTile({
  tono = "brand",
  children,
}: {
  tono?: "brand" | "blue" | "green" | "violet";
  children: ReactNode;
}) {
  const tonos: Record<string, string> = {
    brand: "bg-blue-800 text-white shadow-[0_8px_16px_-10px_rgba(30,64,175,0.6)]",
    blue: "bg-blue-600 text-white shadow-[0_8px_16px_-10px_rgba(37,99,235,0.6)]",
    green: "bg-emerald-700 text-white shadow-[0_8px_16px_-10px_rgba(4,120,87,0.6)]",
    violet: "bg-indigo-700 text-white shadow-[0_8px_16px_-10px_rgba(67,56,202,0.6)]",
  };
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

export const inputCls =
  "w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base font-normal text-stone-900 placeholder:text-stone-400 shadow-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-600/20 sm:text-sm sm:py-2";

export const btnPrimary =
  "brand-btn inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-[15px] sm:text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-900 disabled:opacity-50 touch-manipulation";
export const btnSecondary =
  "inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-[15px] sm:text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 active:bg-stone-100 disabled:opacity-50 touch-manipulation";
export const btnDanger =
  "inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2.5 text-[15px] sm:text-sm font-semibold text-white shadow-sm hover:brightness-110 active:brightness-95 disabled:opacity-50 touch-manipulation";

export const btnDark =
  "inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-[15px] sm:text-sm font-semibold text-white hover:bg-stone-700 active:bg-stone-800 disabled:opacity-50 touch-manipulation";
