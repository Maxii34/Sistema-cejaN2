"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiPlus,
  FiTool,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, Badge, btnPrimary, IconTile } from "@/components/ui";
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
      }
    })();
  }, [usuario]);

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

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
            <Link href="/ordenes/nueva" className={btnPrimary + " mt-3 w-full sm:w-auto"}>
              <FiPlus size={17} strokeWidth={2.5} /> Nueva recepción
            </Link>
          </div>
        </section>

        {error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</p>}

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {STATS.map((s, i) => (
            <Link key={s.label} href={s.href} className={`min-w-0 rise rise-${i + 1}`}>
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
          ))}
        </div>

        <Card className="rise rise-3 mt-3 sm:mt-4">
          <h2 className="flex items-center gap-2 font-bold text-stone-900">
            <IconTile tono="brand">
              <FiTool size={16} />
            </IconTile>
            Últimas órdenes
          </h2>
          <ul className="mt-2 divide-y divide-stone-100 text-sm">
            {ultimas.map((o) => (
              <li key={o.id} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2">
                <span className="min-w-0 font-mono text-[13px] leading-snug">
                  <span className="font-bold text-stone-900">{o.numero}</span>
                  <span className="text-stone-500"> · {o.fallaReportada.slice(0, 60)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tono="violet">{o.estado}</Badge>
                  <Link href={`/ordenes/${o.id}`} className="flex min-h-[36px] items-center gap-0.5 rounded-lg px-2 font-semibold text-blue-700 hover:bg-blue-50">
                    Abrir <FiChevronRight size={14} />
                  </Link>
                </span>
              </li>
            ))}
            {ultimas.length === 0 && <p className="py-2 text-stone-500">Sin órdenes todavía.</p>}
          </ul>
        </Card>
      </main>
    </div>
  );
}
