"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiArrowLeft, FiCalendar, FiChevronRight, FiClock, FiCreditCard, FiDollarSign, FiPlus } from "react-icons/fi";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Empty, Badge, btnPrimary, inputCls, IconTile, Spinner, CargandoPagina } from "@/components/ui";
import { Lista, ItemLi, Reveal, Stagger, Item } from "@/components/motion";
import type { ApiEnvelope, MedioPago, OrdenReparacion, Pago, Paged } from "@/lib/types";

const MEDIOS: MedioPago[] = ["EFECTIVO", "TRANSFERENCIA", "TARJETA_DEBITO", "TARJETA_CREDITO", "MERCADO_PAGO", "OTRO"];

const MEDIO_LABEL: Record<MedioPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA_DEBITO: "Débito",
  TARJETA_CREDITO: "Crédito",
  MERCADO_PAGO: "Mercado Pago",
  OTRO: "Otro",
};

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

  const ordenPorId = useMemo(() => new Map(ordenes.map((o) => [o.id, o])), [ordenes]);
  const pagosOrdenados = useMemo(
    () => [...pagos].sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha)),
    [pagos]
  );
  const pendiente = useMemo(() => {
    const cobrado = new Map<number, number>();
    for (const p of pagos) cobrado.set(p.ordenId, (cobrado.get(p.ordenId) ?? 0) + Number(p.monto));
    return ordenes.reduce((acc, o) => {
      if (o.precioFinal == null) return acc;
      const saldo = Number(o.precioFinal) - (cobrado.get(o.id) ?? 0);
      return acc + (saldo > 0 ? saldo : 0);
    }, 0);
  }, [ordenes, pagos]);

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
        <PageHeader eyebrow="Caja del taller" titulo="Pagos" descripcion="Historial de caja y registro de cobros." />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Stagger className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:grid-cols-3 sm:gap-4">
          <Item className="col-span-2 min-w-0 sm:col-span-1">
            <Card className="h-full px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-[0_6px_12px_-8px_rgba(4,120,87,0.7)] sm:h-9 sm:w-9 sm:rounded-xl">
                  <FiDollarSign size={15} />
                </span>
                <span className="min-w-0">
                  <span className="font-ficha block truncate text-xl font-extrabold leading-none text-stone-900 sm:text-2xl">
                    ${total.toFixed(2)}
                  </span>
                  <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:text-[11px]">
                    Total cobrado
                  </span>
                </span>
              </div>
            </Card>
          </Item>
          <Item className="min-w-0">
            <Card className="h-full px-2.5 py-2 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_6px_12px_-8px_rgba(37,99,235,0.7)] sm:h-9 sm:w-9 sm:rounded-xl">
                  <FiCreditCard size={15} />
                </span>
                <span className="min-w-0">
                  <span className="font-ficha block text-lg font-extrabold leading-none text-stone-900 sm:text-2xl">
                    {pagos.length}
                  </span>
                  <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:text-[11px]">
                    Cobros
                  </span>
                </span>
              </div>
            </Card>
          </Item>
          <Item className="min-w-0">
            <Card className="h-full px-2.5 py-2 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-800 text-white shadow-[0_6px_12px_-8px_rgba(30,64,175,0.7)] sm:h-9 sm:w-9 sm:rounded-xl">
                  <FiClock size={15} />
                </span>
                <span className="min-w-0">
                  <span className="font-ficha block truncate text-base font-extrabold leading-none text-stone-900 sm:text-2xl">
                    ${pendiente.toFixed(2)}
                  </span>
                  <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:text-[11px]">
                    Por cobrar
                  </span>
                </span>
              </div>
            </Card>
          </Item>
        </Stagger>

        <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[1fr_320px]">
          <Card className="order-last lg:order-none">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="green"><FiDollarSign size={16} /></IconTile>
              <span className="min-w-0 flex-1">
                Historial de cobros ({pagos.length})
                <span className="block text-xs font-normal text-stone-500">
                  Más recientes primero · Total ${total.toFixed(2)}
                </span>
              </span>
            </h2>
            {cargandoLista ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
                <Spinner tamano="md" /> Cargando pagos...
              </div>
            ) : pagosOrdenados.length === 0 ? <Empty mensaje="Sin pagos" detalle="Registrá el primer cobro con el formulario." /> : (
              <Lista className="mt-3 space-y-2 text-sm">
                {pagosOrdenados.map((p) => {
                  const orden = ordenPorId.get(p.ordenId);
                  const cliente = orden?.equipo?.cliente
                    ? `${orden.equipo.cliente.nombre} ${orden.equipo.cliente.apellido ?? ""}`.trim()
                    : null;
                  return (
                    <ItemLi
                      key={p.id}
                      className="flex items-center gap-2.5 rounded-xl border border-stone-200/70 bg-stone-50/60 px-3 py-2.5 shadow-sm transition-all duration-200 sm:gap-3 sm:hover:-translate-y-0.5 sm:hover:border-blue-200 sm:hover:bg-white sm:hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.35)]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                        <FiDollarSign size={15} />
                      </span>
                      <span className="min-w-0 flex-1 pr-1 sm:pr-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="font-ficha truncate font-bold text-stone-900">
                            {orden?.numero ?? `Orden #${p.ordenId}`}
                          </span>
                          <span className="hidden shrink-0 min-[420px]:inline">
                            <Badge tono="green">{MEDIO_LABEL[p.medioPago]}</Badge>
                          </span>
                        </span>
                        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-stone-500">
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <FiCalendar size={12} />
                            {new Date(p.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                          </span>
                          {cliente && (
                            <span className="min-w-0 truncate">· {cliente}</span>
                          )}
                          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap min-[420px]:hidden">
                            · <FiCreditCard size={12} />{MEDIO_LABEL[p.medioPago]}
                          </span>
                        </span>
                      </span>
                      <b className="font-ficha shrink-0 text-[15px] font-extrabold text-stone-900">
                        ${Number(p.monto).toFixed(2)}
                      </b>
                      <Link
                        href={`/ordenes/${p.ordenId}`}
                        title={`Abrir orden ${orden?.numero ?? `#${p.ordenId}`}`}
                        aria-label={`Abrir orden ${orden?.numero ?? `#${p.ordenId}`}`}
                        className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-blue-700 shadow-sm transition-colors active:bg-blue-50 sm:hover:border-blue-300 sm:hover:bg-blue-50"
                      >
                        <FiChevronRight size={15} />
                      </Link>
                    </ItemLi>
                  );
                })}
              </Lista>
            )}
          </Card>
          <Reveal className="order-first lg:order-none">
          <Card>
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
          </Reveal>
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
