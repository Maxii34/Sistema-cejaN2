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
} from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Badge, btnPrimary } from "@/components/ui";
import type { ApiEnvelope, Cliente, OrdenReparacion, Paged } from "@/lib/types";

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
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader
          titulo={`Hola, ${usuario.nombre}`}
          descripcion="Resumen del taller: recepciones activas, clientes y stock."
          accion={
            <Link href="/ordenes/nueva" className={btnPrimary + " gap-2"}>
              <FiPlus size={16} /> Nueva recepción
            </Link>
          }
        />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {(
            [
              ["Órdenes", stats.ordenes, "/ingreso", FiClipboard],
              ["Activas", stats.pendientes, "/ingreso", FiClock],
              ["Clientes", stats.clientes, "/ingreso", FiUsers],
            ] as [string, number, string, typeof FiClipboard][]
          ).map(([label, valor, href, Icon]) => (
            <Link key={label} href={href} className="min-w-0">
              <Card className="h-full px-3 py-3 hover:shadow sm:p-5">
                <p className="flex items-center gap-1 truncate text-[10px] uppercase text-zinc-600 sm:text-xs">
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">{valor}</p>
              </Card>
            </Link>
          ))}
        </div>
        <Card className="mt-3 sm:mt-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <FiTool size={16} /> Últimas órdenes
          </h2>
          <ul className="mt-2 divide-y divide-zinc-100 text-sm">
            {ultimas.map((o) => (
              <li key={o.id} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2">
                <span className="min-w-0 font-mono text-[13px] leading-snug">
                  <span className="font-semibold">{o.numero}</span>
                  <span className="text-zinc-600"> · {o.fallaReportada.slice(0, 60)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tono="violet">{o.estado}</Badge>
                  <Link href={`/ordenes/${o.id}`} className="flex min-h-[36px] items-center gap-0.5 px-1 font-medium hover:underline">
                    Abrir <FiChevronRight size={14} />
                  </Link>
                </span>
              </li>
            ))}
            {ultimas.length === 0 && <p className="py-2 text-zinc-600">Sin órdenes todavía.</p>}
          </ul>
        </Card>
      </main>
    </div>
  );
}
