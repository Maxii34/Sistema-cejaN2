"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiPlus,
  FiTool,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, Badge, btnPrimary, IconTile, Spinner, CargandoPagina } from "@/components/ui";
import { Stagger, Item, Lista, ItemLi } from "@/components/motion";
import type { ApiEnvelope, Cliente, OrdenReparacion, Paged } from "@/lib/types";

const STATS = [
  { label: "Órdenes", key: "ordenes", href: "/ingreso", icon: FiClipboard, tono: "blue" as const },
  { label: "Activas", key: "pendientes", href: "/ingreso", icon: FiClock, tono: "brand" as const },
  { label: "Clientes", key: "clientes", href: "/ingreso", icon: FiUsers, tono: "green" as const },
];

export default function DashboardPage() {
  const { usuario, cargando } = useRequireAuth();
  const [stats, setStats] = useState({ ordenes: 0, clientes: 0, pendientes: 0 });
  const [ultimas, setUltimas] = useState<OrdenReparacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        const [o, c] = await Promise.all([
          api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>("/api/orden-reparacion"),
          api.get<ApiEnvelope<Cliente[]>>("/api/cliente"),
        ]);
        const lista = Array.isArray(o.data) ? o.data : o.data.data;
        setStats({
          ordenes: lista.length,
          clientes: c.data.length,
          pendientes: lista.filter((x) => !["ENTREGADO", "CANCELADO"].includes(x.estado)).length,
        });
        setUltimas(lista.slice(0, 5));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el panel (¿backend en :3001?)");
      } finally {
        setCargandoDatos(false);
      }
    })();
  }, [usuario]);

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
              <Card className="card-lift h-full px-3 py-3 sm:p-5">
                <span className="hidden sm:block">
                  <IconTile tono={s.tono}>
                    <s.icon size={18} />
                  </IconTile>
                </span>
                <span className="sm:hidden">
                  <IconTile tono={s.tono}>
                    <s.icon size={16} />
                  </IconTile>
                </span>
                <p className="mt-2 truncate text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:text-xs">
                  {s.label}
                </p>
                <p className="font-ficha text-2xl font-extrabold text-stone-900 sm:text-3xl">
                  {stats[s.key as keyof typeof stats]}
                </p>
              </Card>
              </Link>
            </Item>
          ))}
        </Stagger>

        <Card className="rise rise-3 mt-3 sm:mt-4">
          <h2 className="flex items-center gap-2 font-bold text-stone-900">
            <IconTile tono="brand">
              <FiTool size={16} />
            </IconTile>
            Últimas órdenes
          </h2>
          {cargandoDatos ? (
            <div className="mt-3 flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
              <Spinner tamano="md" /> Cargando órdenes...
            </div>
          ) : (
          <Lista className="tabla-scroll mt-3 grid max-h-[62dvh] gap-2 overflow-y-auto pb-1 text-sm sm:max-h-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
            {ultimas.map((o) => {
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
                <ItemLi key={o.id} className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-ficha text-[13px] font-bold text-stone-900">{o.numero}</span>
                    <Badge tono="violet">{o.estado}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-stone-600">{o.fallaReportada}</p>
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
                  <Link href={`/ordenes/${o.id}`} className="mt-2 flex min-h-[40px] items-center justify-center gap-0.5 rounded-lg bg-blue-800 text-[13px] font-semibold text-white active:bg-blue-900">
                    Abrir orden <FiChevronRight size={14} />
                  </Link>
                </ItemLi>
              );
            })}
            {ultimas.length === 0 && <p className="py-2 text-stone-500">Sin órdenes todavía.</p>}
          </Lista>
          )}
        </Card>
      </main>
    </div>
  );
}
