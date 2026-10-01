"use client";

import type { OrdenReparacion, Pago } from "@/lib/types";

const MEDIO_LABEL: Record<Pago["medioPago"], string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA_DEBITO: "Débito",
  TARJETA_CREDITO: "Crédito",
  MERCADO_PAGO: "Mercado Pago",
  OTRO: "Otro",
};

function fechaCorta(fecha?: string | null) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(+d)) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function RemitoOrden({ orden, pagos }: { orden: OrdenReparacion; pagos: Pago[] }) {
  const cliente = orden.equipo?.cliente
    ? `${orden.equipo.cliente.nombre} ${orden.equipo.cliente.apellido ?? ""}`.trim()
    : null;
  const equipo = orden.equipo
    ? `${orden.equipo.tipo} ${orden.equipo.marca} ${orden.equipo.modelo}`.trim()
    : `Equipo #${orden.equipoId}`;
  const total = orden.precioFinal != null ? Number(orden.precioFinal) : 0;
  const cobrado = pagos.reduce((a, p) => a + Number(p.monto), 0);
  const ordenados = [...pagos].sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha));

  return (
    <div className="mx-auto w-full max-w-[80mm] bg-white font-mono text-[12px] leading-snug text-stone-900">
      <p className="text-center text-[14px] font-extrabold tracking-wide">REMITO DE ENTREGA</p>
      <p className="text-center text-[10px] text-stone-500">DOCUMENTO NO FISCAL</p>
      <div className="my-2 border-t border-dashed border-stone-400" />
      <p><b>Orden:</b> {orden.numero}</p>
      <p><b>Fecha:</b> {fechaCorta(orden.fechaEntrega ?? new Date().toISOString())}</p>
      {cliente && <p><b>Cliente:</b> {cliente}</p>}
      {orden.equipo?.cliente?.telefono && <p><b>Tel:</b> {orden.equipo.cliente.telefono}</p>}
      <p><b>Equipo:</b> {equipo}</p>
      {orden.equipo?.numeroSerie && <p><b>Serie:</b> {orden.equipo.numeroSerie}</p>}
      <div className="my-2 border-t border-dashed border-stone-400" />
      <p><b>Mano de obra:</b> ${Number(orden.manoDeObra ?? 0).toFixed(2)}</p>
      {orden.recomendaciones && <p><b>Recomend.:</b> {orden.recomendaciones}</p>}
      <div className="my-2 border-t border-dashed border-stone-400" />
      {ordenados.length === 0 ? (
        <p>Sin pagos registrados.</p>
      ) : (
        ordenados.map((p) => (
          <p key={p.id} className="flex justify-between gap-2">
            <span>{fechaCorta(p.fecha)} · {MEDIO_LABEL[p.medioPago]}</span>
            <b>${Number(p.monto).toFixed(2)}</b>
          </p>
        ))
      )}
      <div className="my-2 border-t border-dashed border-stone-400" />
      <p className="flex justify-between gap-2 text-[13px]"><span><b>TOTAL</b></span><b>${total.toFixed(2)}</b></p>
      <p className="flex justify-between gap-2"><span>Cobrado</span><span>${cobrado.toFixed(2)}</span></p>
      <p><b>Garantía:</b> {orden.garantiaDias} días</p>
      {orden.tecnico?.nombre && <p><b>Técnico:</b> {orden.tecnico.nombre}</p>}
      <div className="my-2 border-t border-dashed border-stone-400" />
      <div className="mt-6 grid grid-cols-2 gap-4 text-center text-[10px]">
        <div><div className="border-t border-stone-500 pt-1">Firma cliente</div></div>
        <div><div className="border-t border-stone-500 pt-1">Firma taller</div></div>
      </div>
      <p className="mt-3 text-center text-[10px] text-stone-500">Gracias por su visita</p>
    </div>
  );
}
