"use client";

import type { ReactNode } from "react";
import type { OrdenReparacion, Pago } from "@/lib/types";

const MEDIO_LABEL: Record<Pago["medioPago"], string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA_DEBITO: "Débito",
  TARJETA_CREDITO: "Crédito",
  MERCADO_PAGO: "Mercado Pago",
  OTRO: "Otro",
};

function moneda(n: number | string | null | undefined) {
  const num = Number(n ?? 0);
  if (Number.isNaN(num)) return "$0,00";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function fechaEntrega(fecha?: string | null) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(+d)) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-2">
      <p className="bg-stone-900 py-0.5 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-white print:bg-stone-900 print:text-white">
        {titulo}
      </p>
      <div className="pt-1.5">{children}</div>
    </section>
  );
}

function Fila({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <p className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-stone-500">{etiqueta}:</span>
      <span className={`min-w-0 text-right ${fuerte ? "font-extrabold text-stone-900" : "font-semibold text-stone-900"}`}>
        {valor}
      </span>
    </p>
  );
}

export function RemitoOrden({ orden, pagos }: { orden: OrdenReparacion; pagos: Pago[] }) {
  const cliente = orden.equipo?.cliente
    ? `${orden.equipo.cliente.nombre} ${orden.equipo.cliente.apellido ?? ""}`.trim()
    : null;

  const equipo = orden.equipo ?? null;

  const manoObra = Number(orden.manoDeObra ?? 0);
  const total = orden.precioFinal != null ? Number(orden.precioFinal) : 0;
  const cobrado = pagos.reduce((a, p) => a + Number(p.monto), 0);
  const saldo = Math.round((total - cobrado) * 100) / 100;

  // Servicio = total menos mano de obra (para no mezclar recomendaciones con importes).
  const servicio = Math.max(Math.round((total - manoObra) * 100) / 100, 0);

  const repuestos = orden.repuestosUsados ?? [];
  const totalRepuestos = repuestos.reduce(
    (a, r) => a + Number(r.precioUnitario) * Number(r.cantidad),
    0
  );

  const numeroRemito = String(orden.id).padStart(4, "0");

  const formasPago = [...new Set(pagos.map((p) => MEDIO_LABEL[p.medioPago]))];
  const formaPagoTexto = formasPago.length > 0 ? formasPago.join(" + ") : "—";

  const trabajo = orden.reparacionRealizada?.trim() || null;
  const tecnicoNombre = orden.tecnico?.nombre?.trim() || null;

  return (
    <div className="mx-auto w-full max-w-[80mm] bg-white font-mono text-[12px] leading-snug text-stone-900">
      {/* Encabezado */}
      <p className="text-center text-[15px] font-extrabold tracking-wide">REMITO DE ENTREGA</p>
      <p className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        Documento no fiscal
      </p>

      <div className="my-2 border-t-2 border-stone-900" />

      {/* 1. Identificación del documento */}
      <div className="rounded-md border border-stone-300 px-2 py-1.5">
        <Fila etiqueta="Remito N.º" valor={numeroRemito} fuerte />
        <Fila etiqueta="Orden" valor={orden.numero} fuerte />
        <Fila etiqueta="Fecha de entrega" valor={fechaEntrega(orden.fechaEntrega ?? new Date().toISOString())} />
      </div>

      {/* 2. Datos del cliente (solo nombre y apellido) */}
      <Seccion titulo="Cliente">
        <p className="text-[13px] font-extrabold text-stone-900">{cliente ?? "—"}</p>
      </Seccion>

      {/* 3. Datos del equipo */}
      <Seccion titulo="Equipo">
        <div className="space-y-0.5">
          <Fila etiqueta="Tipo" valor={equipo?.tipo ?? "—"} />
          <Fila etiqueta="Marca" valor={equipo?.marca ?? "—"} />
          <Fila etiqueta="Modelo" valor={equipo?.modelo ?? "—"} />
          <Fila etiqueta="N.º de serie" valor={equipo?.numeroSerie?.trim() || "—"} />
        </div>
      </Seccion>

      {/* 4. Trabajo realizado (resumido, sin historial técnico) */}
      <Seccion titulo="Trabajo realizado">
        <p className="rounded-md bg-stone-100 px-2 py-1.5 text-[12px] font-medium text-stone-900 print:bg-stone-100">
          {trabajo ?? "Servicio técnico general."}
        </p>
      </Seccion>

      {/* 5. Detalle económico */}
      <Seccion titulo="Detalle">
        <div className="space-y-0.5">
          <p className="flex items-baseline justify-between gap-2">
            <span>Mano de obra</span>
            <span className="font-bold">{moneda(manoObra)}</span>
          </p>
          {repuestos.length > 0 ? (
            <>
              {repuestos.map((r) => (
                <p key={r.id} className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate">
                    {r.repuesto?.nombre ?? "Repuesto"} × {r.cantidad}
                  </span>
                  <span className="shrink-0 font-bold">
                    {moneda(Number(r.precioUnitario) * Number(r.cantidad))}
                  </span>
                </p>
              ))}
              <p className="flex items-baseline justify-between gap-2">
                <span>Reparación / servicio</span>
                <span className="font-bold">{moneda(Math.max(servicio - totalRepuestos, 0))}</span>
              </p>
            </>
          ) : (
            <p className="flex items-baseline justify-between gap-2">
              <span>Reparación / servicio</span>
              <span className="font-bold">{moneda(servicio)}</span>
            </p>
          )}
        </div>

        <div className="mt-1.5 space-y-0.5 rounded-md border border-stone-300 px-2 py-1.5">
          <p className="flex items-baseline justify-between gap-2 text-[14px]">
            <span className="font-extrabold tracking-wide">TOTAL</span>
            <span className="font-extrabold">{moneda(total)}</span>
          </p>
          <p className="flex items-baseline justify-between gap-2 border-t border-dashed border-stone-300 pt-1">
            <span className="font-bold">PAGADO</span>
            <span className="font-bold">{moneda(cobrado)}</span>
          </p>
          <p className="flex items-baseline justify-between gap-2">
            <span className="font-bold">SALDO</span>
            <span className="font-extrabold">{moneda(saldo)}</span>
          </p>
        </div>

        <p className="mt-1.5 flex items-baseline justify-between gap-2">
          <span className="shrink-0 text-stone-500">Forma de pago:</span>
          <span className="text-right font-bold">{formaPagoTexto}</span>
        </p>
      </Seccion>

      {/* 6. Garantía */}
      <Seccion titulo="Garantía">
        <p className="text-center font-bold">
          Garantía de reparación: {orden.garantiaDias} días desde la fecha de entrega.
        </p>
      </Seccion>

      {/* 7. Técnico responsable */}
      {tecnicoNombre && (
        <Seccion titulo="Técnico responsable">
          <p className="text-center text-[13px] font-extrabold">{tecnicoNombre}</p>
        </Seccion>
      )}

      {/* 8. Firmas */}
      <section className="mt-3">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="h-10" aria-hidden />
            <div className="border-t border-stone-900 pt-1 text-[10px] font-bold uppercase tracking-wider">
              Firma del cliente
            </div>
            <p className="mt-0.5 text-[10px] text-stone-500">Aclaración y DNI</p>
          </div>
          <div>
            <div className="h-10" aria-hidden />
            <div className="border-t border-stone-900 pt-1 text-[10px] font-bold uppercase tracking-wider">
              Firma del taller
            </div>
            <p className="mt-0.5 text-[10px] text-stone-500">Técnico responsable</p>
          </div>
        </div>
      </section>

      {/* 9. Pie del documento */}
      <div className="my-2 border-t border-dashed border-stone-400" />
      <p className="text-center text-[11px] font-semibold italic text-stone-700">
        Gracias por confiar en nuestro servicio técnico.
      </p>
    </div>
  );
}
