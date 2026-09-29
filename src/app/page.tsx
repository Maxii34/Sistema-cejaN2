"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiPlus,
  FiSearch,
  FiTool,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, Badge, btnPrimary, inputCls, Spinner, CargandoPagina } from "@/components/ui";
import { Stagger, Item, Lista, ItemLi } from "@/components/motion";
import type { ApiEnvelope, Cliente, OrdenReparacion, Paged } from "@/lib/types";

const STATS = [
  { label: "Órdenes", key: "ordenes", href: "/ingreso", icon: FiClipboard, icono: "bg-blue-600 shadow-[0_6px_12px_-8px_rgba(37,99,235,0.7)]" },
  { label: "Activas", key: "pendientes", href: "/ingreso", icon: FiClock, icono: "bg-blue-800 shadow-[0_6px_12px_-8px_rgba(30,64,175,0.7)]" },
  { label: "Clientes", key: "clientes", href: "/ingreso", icon: FiUsers, icono: "bg-emerald-700 shadow-[0_6px_12px_-8px_rgba(4,120,87,0.7)]" },
];

function OrdenTarjeta({ o }: { o: OrdenReparacion }) {
  const cliente = o.equipo?.cliente
    ? `${o.equipo.cliente.nombre} ${o.equipo.cliente.apellido ?? ""}`.trim()
    : null;
  const ultimoMov =
    o.updatedAt ??
    (o.historialEstados ?? []).reduce<string | null>(
      (acc, h) => (!acc || new Date(h.fecha) > new Date(acc) ? h.fecha : acc),
      null
    );
  const fechaHora = (f: string) =>
    new Date(f).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <ItemLi className="flex h-full flex-col rounded-xl border border-stone-200/80 bg-stone-50/50 p-3 shadow-sm transition-all duration-200 sm:hover:-translate-y-1 sm:hover:border-blue-200 sm:hover:bg-white sm:hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.35)]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-ficha text-[13px] font-bold text-stone-900">{o.numero}</span>
        <Badge tono="violet">{o.estado}</Badge>
      </div>
      <p className="mt-1 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug text-stone-600">{o.fallaReportada}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-stone-200/70 pt-2 text-xs">
        <div className="flex min-w-0 items-center gap-1.5">
          <FiUser size={13} className="shrink-0 text-blue-700" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Cliente</span>
            <span className="block truncate font-semibold text-stone-800">{cliente ?? "—"}</span>
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <FiTool size={13} className="shrink-0 text-blue-700" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Técnico</span>
            <span className="block truncate font-semibold text-stone-800">{o.tecnico?.nombre ?? "Sin asignar"}</span>
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <FiClock size={13} className="shrink-0 text-blue-700" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Ingreso</span>
            <span className="font-ficha block truncate font-semibold text-stone-800">{fechaHora(o.fechaIngreso)}</span>
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <FiClock size={13} className="shrink-0 text-blue-700" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Actualizado</span>
            <span className="font-ficha block truncate font-semibold text-stone-800">{ultimoMov ? fechaHora(ultimoMov) : "—"}</span>
          </span>
        </div>
      </dl>
      <div className="mt-auto pt-2">
        <Link href={`/ordenes/${o.id}`} className="flex min-h-[40px] items-center justify-center gap-0.5 rounded-lg bg-blue-800 text-[13px] font-semibold text-white transition-colors active:bg-blue-900 sm:hover:bg-blue-700">
          Abrir orden <FiChevronRight size={14} />
        </Link>
      </div>
    </ItemLi>
  );
}

export default function DashboardPage() {
  const { usuario, cargando } = useRequireAuth();
  const [stats, setStats] = useState({ ordenes: 0, clientes: 0, pendientes: 0 });
  const [ultimas, setUltimas] = useState<OrdenReparacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Filtros: manejan lo que muestra "Últimas órdenes"
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDeb, setBusquedaDeb] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const hayFiltros = busquedaDeb.trim() !== "" || fechaDesde !== "" || fechaHasta !== "";

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        const c = await api.get<ApiEnvelope<Cliente[]>>("/api/cliente");
        setStats((s) => ({ ...s, clientes: c.data.length }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el panel. Revisá la conexión e intentá de nuevo.");
      }
    })();
  }, [usuario]);

  // Debounce del texto (evita un request por tecla)
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDeb(busqueda), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Lista de órdenes: sin filtros trae las últimas; con filtros, el resultado del backend
  useEffect(() => {
    if (!usuario) return;
    setCargandoDatos(true);
    const params = new URLSearchParams({ limit: "100" });
    if (busquedaDeb.trim()) params.set("search", busquedaDeb.trim());
    if (fechaDesde) params.set("fechaDesde", fechaDesde);
    if (fechaHasta) params.set("fechaHasta", fechaHasta);
    api
      .get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>(`/api/orden-reparacion?${params}`)
      .then((o) => {
        const esPagina = !Array.isArray(o.data) && "meta" in o.data;
        const lista = Array.isArray(o.data) ? o.data : o.data.data;
        setStats((s) => ({
          ...s,
          ordenes: hayFiltros ? s.ordenes : esPagina ? (o.data as Paged<OrdenReparacion>).meta.total : lista.length,
          pendientes: hayFiltros
            ? s.pendientes
            : lista.filter((x) => !["ENTREGADO", "CANCELADO"].includes(x.estado)).length,
        }));
        setUltimas(hayFiltros ? lista : lista.slice(0, 5));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudo cargar el panel. Revisá la conexión e intentá de nuevo.");
      })
      .finally(() => setCargandoDatos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, busquedaDeb, fechaDesde, fechaHasta]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setBusquedaDeb("");
    setFechaDesde("");
    setFechaHasta("");
  };

  if (cargando || !usuario) return <CargandoPagina />;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        {/* Hero del taller */}
        <section className="rise relative mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1428] via-[#13234d] to-[#0c1428] p-4 text-white shadow-xl sm:mb-5 sm:p-6">
          <div className="hero-grid absolute inset-0" aria-hidden />
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-blue-500/25 blur-3xl" aria-hidden />
          <div className="absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-200 ring-1 ring-inset ring-white/15">
              <FiZap size={12} /> Taller activo
            </p>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              Hola, {usuario.nombre} 👋
            </h1>
            <p className="mt-1 max-w-md text-[13px] text-slate-300 sm:text-sm">
              {stats.pendientes > 0
                ? `Tenés ${stats.pendientes} recepción${stats.pendientes > 1 ? "es" : ""} activa${stats.pendientes > 1 ? "s" : ""} en el banco de trabajo.`
                : "Sin recepciones activas. El banco está libre para el próximo equipo."}
            </p>
            <Link href="/ingreso" className={btnPrimary + " mt-3 w-full sm:w-auto"}>
              <FiPlus size={17} strokeWidth={2.5} /> Nuevo cliente
            </Link>
          </div>
        </section>

        {error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</p>}

        <Stagger className="grid grid-cols-3 gap-2 sm:gap-4">
          {STATS.map((s) => (
            <Item key={s.label} className="min-w-0">
              <Link href={s.href} className="block min-w-0">
              <Card className="card-lift h-full px-2.5 py-2 sm:px-4 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white sm:h-9 sm:w-9 sm:rounded-xl ${s.icono}`}>
                    <s.icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-ficha block text-lg font-extrabold leading-none text-stone-900 sm:text-2xl">
                      {stats[s.key as keyof typeof stats]}
                    </span>
                    <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:text-[11px]">
                      {s.label}
                    </span>
                  </span>
                </div>
              </Card>
              </Link>
            </Item>
          ))}
        </Stagger>

        <Card className="rise rise-2 mt-3 sm:mt-4">
          <h2 className="flex items-center gap-2 font-bold text-stone-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_6px_12px_-8px_rgba(37,99,235,0.7)] sm:h-9 sm:w-9 sm:rounded-xl">
              <FiSearch size={15} />
            </span>
            <span className="min-w-0 flex-1">
              Buscar órdenes
              <span className="block text-xs font-normal text-stone-500">
                Por N° de orden, cliente o técnico + fecha de ingreso
              </span>
            </span>
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-semibold text-stone-600 shadow-sm active:bg-stone-100"
              >
                <FiX size={14} /> Limpiar
              </button>
            )}
          </h2>
          <div className="mt-3 grid grid-cols-2 items-end gap-2 lg:grid-cols-[1fr_170px_170px]">
            <div className="col-span-2 lg:col-span-1">
              <label htmlFor="buscar-ordenes" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Buscar</label>
              <div className="relative">
                <FiSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="buscar-ordenes"
                  className={inputCls + " pl-9"}
                  placeholder="N° de orden, cliente o técnico..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="fecha-desde" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Desde</label>
              <input
                id="fecha-desde"
                type="date"
                className={inputCls}
                value={fechaDesde}
                max={fechaHasta || undefined}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="fecha-hasta" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Hasta</label>
              <input
                id="fecha-hasta"
                type="date"
                className={inputCls}
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="rise rise-3 mt-3 sm:mt-4">
          <h2 className="flex items-center gap-2 font-bold text-stone-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-800 text-white shadow-[0_6px_12px_-8px_rgba(30,64,175,0.7)] sm:h-9 sm:w-9 sm:rounded-xl">
              <FiTool size={15} />
            </span>
            <span className="min-w-0 flex-1">
              {hayFiltros ? `Órdenes encontradas (${ultimas.length})` : "Últimas órdenes"}
            </span>
          </h2>
          {cargandoDatos ? (
            <div className="mt-3 flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
              <Spinner tamano="md" /> {hayFiltros ? "Buscando órdenes..." : "Cargando órdenes..."}
            </div>
          ) : (
          <Lista className="tabla-scroll mt-3 grid max-h-[62dvh] items-stretch gap-2 overflow-y-auto pb-1 text-sm sm:max-h-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
            {ultimas.map((o) => (
              <OrdenTarjeta key={o.id} o={o} />
            ))}
            {ultimas.length === 0 && (
              <p className="py-2 text-stone-500">
                {hayFiltros ? "Sin resultados para esos filtros." : "Sin órdenes todavía."}
              </p>
            )}
          </Lista>
          )}
        </Card>
      </main>
    </div>
  );
}
