"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Badge, btnPrimary } from "@/components/ui";
import type { ApiEnvelope, Cliente, OrdenReparacion, Paged, Repuesto } from "@/lib/types";

export default function DashboardPage() {
  const { usuario, cargando } = useRequireAuth();
  const [stats, setStats] = useState({ ordenes: 0, clientes: 0, repuestos: 0, pendientes: 0 });
  const [ultimas, setUltimas] = useState<OrdenReparacion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        const [o, c, r] = await Promise.all([
          api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>("/api/orden-reparacion"),
          api.get<ApiEnvelope<Cliente[]>>("/api/cliente"),
          api.get<ApiEnvelope<Repuesto[]>>("/api/repuesto"),
        ]);
        const lista = Array.isArray(o.data) ? o.data : o.data.data;
        setStats({
          ordenes: lista.length,
          clientes: c.data.length,
          repuestos: r.data.length,
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
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader
          titulo={`Hola, ${usuario.nombre}`}
          descripcion="Resumen del taller: recepciones activas, clientes y stock."
          accion={
            <Link href="/ordenes/nueva" className={btnPrimary}>
              + Nueva recepción
            </Link>
          }
        />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Órdenes totales", stats.ordenes, "/ordenes"],
            ["Activas / pendientes", stats.pendientes, "/ordenes"],
            ["Clientes", stats.clientes, "/clientes"],
            ["Repuestos", stats.repuestos, "/repuestos"],
          ].map(([label, valor, href]) => (
            <Link key={label as string} href={href as string}>
              <Card className="hover:shadow">
                <p className="text-xs uppercase text-zinc-500">{label}</p>
                <p className="mt-1 text-3xl font-bold">{valor}</p>
              </Card>
            </Link>
          ))}
        </div>
        <Card className="mt-4">
          <h2 className="font-semibold">Últimas órdenes</h2>
          <ul className="mt-2 divide-y divide-zinc-100 text-sm">
            {ultimas.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <span className="font-mono">{o.numero} · {o.fallaReportada.slice(0, 60)}</span>
                <span className="flex items-center gap-2">
                  <Badge tono="violet">{o.estado}</Badge>
                  <Link href={`/ordenes/${o.id}`} className="font-medium hover:underline">Abrir →</Link>
                </span>
              </li>
            ))}
            {ultimas.length === 0 && <p className="py-2 text-zinc-500">Sin órdenes todavía.</p>}
          </ul>
        </Card>
      </main>
    </div>
  );
}
