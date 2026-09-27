"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiChevronRight, FiPlus } from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Badge, Empty, btnPrimary, inputCls } from "@/components/ui";
import type { ApiEnvelope, EstadoOrden, OrdenReparacion, Paged } from "@/lib/types";
import { ESTADO_ORDEN_LABEL } from "@/lib/types";

function tonoEstado(e: EstadoOrden) {
  if (e === "ENTREGADO" || e === "LISTO") return "green" as const;
  if (e === "CANCELADO") return "red" as const;
  if (e === "ESPERANDO_REPUESTO") return "amber" as const;
  if (e === "RECIBIDO") return "blue" as const;
  return "violet" as const;
}

export default function OrdenesPage() {
  const { usuario, cargando } = useRequireAuth();
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const [filtro, setFiltro] = useState<string>("");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        const res = await api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>(
          "/api/orden-reparacion"
        );
        const lista = Array.isArray(res.data) ? res.data : res.data.data;
        setOrdenes(lista);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar órdenes");
      } finally {
        setCargandoLista(false);
      }
    })();
  }, [usuario]);

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  const filtradas = ordenes.filter(
    (o) =>
      (!filtro || o.estado === filtro) &&
      `${o.numero} ${o.equipo?.marca ?? ""} ${o.equipo?.modelo ?? ""} ${o.fallaReportada}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader
          titulo="Órdenes de reparación"
          descripcion="Fichas de recepción, diagnóstico, reparación y entrega."
          accion={
            <Link href="/ordenes/nueva" className={btnPrimary + " gap-2"}>
              <FiPlus size={16} /> Nueva recepción
            </Link>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Card>
          <div className="flex flex-wrap gap-2">
            <input
              className={inputCls + " max-w-xs"}
              placeholder="Buscar por número, equipo o falla..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select
              className={inputCls + " max-w-[220px]"}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_ORDEN_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {cargandoLista ? (
            <p className="mt-4 text-sm text-zinc-600">Cargando...</p>
          ) : filtradas.length === 0 ? (
            <div className="mt-4">
              <Empty mensaje="Sin órdenes" detalle="Creá la primera recepción del día." />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-600">
                    <th className="py-2 pr-3">N°</th>
                    <th className="py-2 pr-3">Equipo</th>
                    <th className="py-2 pr-3">Falla</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Pago</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((o) => (
                    <tr key={o.id} className="border-b border-zinc-100 last:border-0">
                      <td className="py-2 pr-3 font-mono font-medium">{o.numero}</td>
                      <td className="py-2 pr-3">
                        {o.equipo ? `${o.equipo.tipo} ${o.equipo.marca} ${o.equipo.modelo}` : `Equipo #${o.equipoId}`}
                      </td>
                      <td className="max-w-[280px] truncate py-2 pr-3 text-zinc-600">
                        {o.fallaReportada}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge tono={tonoEstado(o.estado)}>{ESTADO_ORDEN_LABEL[o.estado]}</Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <Badge tono={o.estadoPago === "PAGADO" ? "green" : o.estadoPago === "PARCIAL" ? "amber" : "zinc"}>
                          {o.estadoPago}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">
                        <Link href={`/ordenes/${o.id}`} className="inline-flex items-center gap-0.5 font-medium text-zinc-900 hover:underline">
                          Abrir <FiChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
