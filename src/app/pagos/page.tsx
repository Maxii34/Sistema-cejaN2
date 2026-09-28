"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiArrowLeft, FiDollarSign, FiPlus } from "react-icons/fi";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Empty, btnPrimary, inputCls, IconTile, Spinner, CargandoPagina } from "@/components/ui";
import type { ApiEnvelope, MedioPago, OrdenReparacion, Pago, Paged } from "@/lib/types";

const MEDIOS: MedioPago[] = ["EFECTIVO", "TRANSFERENCIA", "TARJETA_DEBITO", "TARJETA_CREDITO", "MERCADO_PAGO", "OTRO"];

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

function PagosForm() {
  const { usuario, cargando } = useRequireAuth();
  const searchParams = useSearchParams();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ordenId, setOrdenId] = useState("");
  const [monto, setMonto] = useState("");
  const [medio, setMedio] = useState<MedioPago>("EFECTIVO");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [vinoDeOrden, setVinoDeOrden] = useState(false);

  // Elige orden y autocompleta el monto con su saldo pendiente
  const elegirOrden = (id: string, listaO: OrdenReparacion[], listaP: Pago[]) => {
    setOrdenId(id);
    if (!id) {
      setMonto("");
      return;
    }
    const o = listaO.find((x) => x.id === Number(id));
    if (o?.precioFinal == null) {
      setMonto("");
      return;
    }
    const cob = listaP.filter((p) => p.ordenId === o.id).reduce((a, p) => a + Number(p.monto), 0);
    const saldo = Math.round((Number(o.precioFinal) - cob) * 100) / 100;
    setMonto(saldo > 0 ? saldo.toFixed(2) : "");
  };

  const cargar = async () => {
    setCargandoLista(true);
    try {
      const p = await api.get<ApiEnvelope<Paged<Pago> | Pago[]>>("/api/pago");
      const listaP = Array.isArray(p.data) ? p.data : p.data.data;
      setPagos(listaP);
      const o = await api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>("/api/orden-reparacion");
      const listaO = Array.isArray(o.data) ? o.data : o.data.data;
      setOrdenes(listaO);
      // Preselección desde la ficha (?ordenId=): orden + monto con saldo
      const pre = searchParams.get("ordenId");
      if (pre && listaO.some((x) => x.id === Number(pre))) {
        elegirOrden(pre, listaO, listaP);
        setVinoDeOrden(true);
      }
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    if (!usuario) return;
    cargar().catch((e) => setError(e instanceof Error ? e.message : "Error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setError(null);
    setGuardando(true);
    try {
      await api.post("/api/pago", {
        ordenId: Number(ordenId),
        monto: Number(monto),
        medioPago: medio,
        registradoPorId: usuario?.id ?? null,
      });
      const ordenCobrada = ordenes.find((o) => o.id === Number(ordenId));
      setOrdenId(""); setMonto("");
      await cargar();
      void Toast.fire({
        icon: "success",
        title: "Pago registrado",
        text: `$${Number(monto).toFixed(2)} en ${ordenCobrada?.numero ?? `orden #${ordenId}`}.`,
      });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo registrar pago";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo registrar", text: mensaje });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando || !usuario) return <CargandoPagina />;

  const total = pagos.reduce((a, p) => a + Number(p.monto), 0);

  // Info de la orden elegida: equipo, precio, lo cobrado y el saldo
  const ordenElegida = ordenId === "" ? null : (ordenes.find((o) => o.id === Number(ordenId)) ?? null);
  const cobradoOrden = ordenElegida
    ? pagos.filter((p) => p.ordenId === ordenElegida.id).reduce((a, p) => a + Number(p.monto), 0)
    : 0;
  const precioOrden = ordenElegida?.precioFinal != null ? Number(ordenElegida.precioFinal) : null;
  const saldoOrden = precioOrden != null ? Math.round((precioOrden - cobradoOrden) * 100) / 100 : null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader eyebrow="Caja del taller" titulo="Pagos" descripcion={`Total cobrado: $${total.toFixed(2)}`} />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[1fr_320px]">
          <Card className="order-last lg:order-none">
            {cargandoLista ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
                <Spinner tamano="md" /> Cargando pagos...
              </div>
            ) : pagos.length === 0 ? <Empty mensaje="Sin pagos" /> : (
              <ul className="divide-y divide-zinc-100 text-sm">
                {pagos.map((p) => (
                  <li key={p.id} className="flex flex-col gap-0.5 py-2.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <span className="min-w-0 truncate">Orden #{p.ordenId} · {p.medioPago} · {new Date(p.fecha).toLocaleDateString()}</span>
                    <b className="shrink-0 font-ficha">${Number(p.monto).toFixed(2)}</b>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="order-first lg:order-none">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="green"><FiDollarSign size={16} /></IconTile> Registrar cobro
            </h2>
            <form onSubmit={(e) => void crear(e)} className="mt-2 space-y-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Orden *</label>
                <select className={inputCls} required value={ordenId} onChange={(e) => elegirOrden(e.target.value, ordenes, pagos)}>
                  <option value="">Seleccionar orden...</option>
                  {ordenes.map((o) => <option key={o.id} value={o.id}>{o.numero} · ${o.precioFinal != null ? Number(o.precioFinal).toFixed(2) : "s/p"}</option>)}
                </select>
              </div>
              {ordenElegida && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-sm ring-1 ring-inset ring-blue-200/60">
                  <p className="font-bold text-stone-900">
                    {ordenElegida.numero}
                    {ordenElegida.esGarantia && (
                      <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Garantía</span>
                    )}
                  </p>
                  <dl className="mt-1 space-y-0.5 break-words text-[13px] text-stone-600">
                    <p>
                      <b className="text-stone-800">Equipo:</b>{" "}
                      {ordenElegida.equipo
                        ? `${ordenElegida.equipo.tipo} ${ordenElegida.equipo.marca} ${ordenElegida.equipo.modelo}`.trim()
                        : `Equipo #${ordenElegida.equipoId}`}
                    </p>
                    {ordenElegida.equipo?.cliente && (
                      <p>
                        <b className="text-stone-800">Cliente:</b>{" "}
                        {`${ordenElegida.equipo.cliente.nombre} ${ordenElegida.equipo.cliente.apellido ?? ""}`.trim()}
                      </p>
                    )}
                    <p><b className="text-stone-800">Precio final:</b> {precioOrden != null ? `$${precioOrden.toFixed(2)}` : "sin precio"}</p>
                    <p><b className="text-stone-800">Cobrado:</b> ${cobradoOrden.toFixed(2)}</p>
                    <p>
                      <b className="text-stone-800">Saldo:</b>{" "}
                      {saldoOrden != null ? (
                        <span className={`font-ficha font-bold ${saldoOrden <= 0 ? "text-emerald-700" : "text-blue-800"}`}>
                          ${saldoOrden.toFixed(2)}
                        </span>
                      ) : "—"}
                    </p>
                  </dl>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Monto *</label>
                <input className={inputCls} required type="number" min="0.01" step="0.01" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Medio de pago</label>
                <select className={inputCls} value={medio} onChange={(e) => setMedio(e.target.value as MedioPago)}>
                  {MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button className={btnPrimary + " w-full gap-2"} disabled={guardando}>
                <FiPlus size={15} /> {guardando ? "Registrando..." : "Registrar"}
              </button>
              {vinoDeOrden && ordenElegida && (
                <Link
                  href={`/ordenes/${ordenElegida.id}`}
                  className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 active:bg-stone-100"
                >
                  <FiArrowLeft size={15} /> Volver a {ordenElegida.numero}
                </Link>
              )}
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function PagosPage() {
  return (
    <Suspense fallback={<CargandoPagina />}>
      <PagosForm />
    </Suspense>
  );
}
