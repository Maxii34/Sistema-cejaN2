"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiCamera,
  FiChevronRight,
  FiClipboard,
  FiPlus,
  FiTool,
  FiUsers,
} from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import {
  Card,
  PageHeader,
  Badge,
  Empty,
  btnPrimary,
  inputCls,
} from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import type {
  ApiEnvelope,
  Equipo,
  EstadoOrden,
  OrdenReparacion,
  Paged,
} from "@/lib/types";
import { ESTADO_ORDEN_LABEL } from "@/lib/types";

function tonoEstado(e: EstadoOrden) {
  if (e === "ENTREGADO" || e === "LISTO") return "green" as const;
  if (e === "CANCELADO") return "red" as const;
  if (e === "ESPERANDO_REPUESTO") return "amber" as const;
  if (e === "RECIBIDO") return "blue" as const;
  return "violet" as const;
}

export default function HistorialEquiposPage() {
  const { usuario, cargando } = useRequireAuth();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroVisitas, setFiltroVisitas] = useState<
    "TODOS" | "CON_VISITAS" | "SIN_VISITAS"
  >("TODOS");
  const [error, setError] = useState<string | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [fotos, setFotos] = useState<Record<number, string | null>>({});

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        // El backend no incluye órdenes en el listado de equipos,
        // así que traemos las órdenes y las agrupamos en el front.
        const [eq, od] = await Promise.all([
          api.get<ApiEnvelope<Equipo[]>>("/api/equipo"),
          api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>(
            "/api/orden-reparacion"
          ),
        ]);
        setEquipos(eq.data);
        setOrdenes(Array.isArray(od.data) ? od.data : od.data.data);
        const map: Record<number, string | null> = {};
        for (const q of eq.data) {
          try {
            const v = localStorage.getItem(`equipo-img:${q.id}`);
            if (v) map[q.id] = v;
          } catch {
            // noop
          }
        }
        setFotos(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el historial");
      } finally {
        setCargandoLista(false);
      }
    })();
  }, [usuario]);

  // Órdenes agrupadas por equipo, más recientes primero
  const historialPorEquipo = useMemo(() => {
    const map = new Map<number, OrdenReparacion[]>();
    for (const o of ordenes) {
      const arr = map.get(o.equipoId) ?? [];
      arr.push(o);
      map.set(o.equipoId, arr);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
      );
    }
    return map;
  }, [ordenes]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return equipos.filter((e) => {
      const visitas = historialPorEquipo.get(e.id) ?? [];
      if (filtroVisitas === "CON_VISITAS" && visitas.length === 0) return false;
      if (filtroVisitas === "SIN_VISITAS" && visitas.length > 0) return false;
      if (!q) return true;
      return `${e.tipo} ${e.marca} ${e.modelo} ${e.numeroSerie ?? ""} ${
        e.cliente?.nombre ?? ""
      } ${e.cliente?.apellido ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [equipos, historialPorEquipo, busqueda, filtroVisitas]);

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  const totalVisitas = ordenes.length;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader
          titulo="Historial de equipos"
          descripcion={`${equipos.length} aparatos · ${totalVisitas} visitas al taller. Cada tarjeta muestra el equipo con todas sus órdenes.`}
          accion={
            <Link href="/ingreso" className={btnPrimary + " gap-2"}>
              <FiUsers size={16} /> Ir a ingreso
            </Link>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap">
          <input
            className={inputCls + " sm:max-w-md sm:flex-1"}
            placeholder="Buscar por tipo, marca, modelo, serie o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className={inputCls + " sm:max-w-[200px]"}
            value={filtroVisitas}
            onChange={(e) =>
              setFiltroVisitas(e.target.value as typeof filtroVisitas)
            }
          >
            <option value="TODOS">Todos</option>
            <option value="CON_VISITAS">Con visitas</option>
            <option value="SIN_VISITAS">Sin visitas</option>
          </select>
        </div>

        {cargandoLista ? (
          <p className="text-sm font-normal text-zinc-600">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <Empty
            mensaje="Sin equipos"
            detalle="Primero creá un cliente y agregale equipos desde su ficha."
          />
        ) : (
          <div className="grid items-start gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((q) => {
              const visitas = historialPorEquipo.get(q.id) ?? [];
              const actual = visitas[0];
              return (
                <Card key={q.id} className="flex flex-col">
                  {fotos[q.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fotos[q.id]!}
                      alt={`${q.tipo} ${q.marca}`}
                      className="mb-3 h-40 w-full rounded-lg border border-zinc-200 object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-40 flex-col items-center justify-center gap-1 rounded-lg bg-zinc-100">
                      <FiTool size={28} className="text-zinc-400" aria-hidden />
                      <span className="text-xs font-normal text-zinc-500">
                        Sin foto
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-zinc-900">
                      {q.tipo} · {q.marca} {q.modelo}
                    </p>
                    <Badge tono={visitas.length > 0 ? "blue" : "zinc"}>
                      {visitas.length === 0
                        ? "Sin visitas"
                        : `${visitas.length} visita${visitas.length > 1 ? "s" : ""}`}
                    </Badge>
                  </div>
                  {actual && (
                    <div className="mt-1">
                      <Badge tono={tonoEstado(actual.estado)}>
                        {ESTADO_ORDEN_LABEL[actual.estado]}
                      </Badge>
                    </div>
                  )}

                  <p className="mt-1 text-xs font-normal text-zinc-600">
                    Cliente:{" "}
                    {q.cliente ? (
                      <Link
                        href={`/clientes/${q.clienteId}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {q.cliente.nombre} {q.cliente.apellido ?? ""}
                      </Link>
                    ) : (
                      `#${q.clienteId}`
                    )}
                    {q.numeroSerie ? ` · S/N ${q.numeroSerie}` : ""}
                  </p>
                  {q.observaciones && (
                    <p className="mt-1 text-xs font-normal text-zinc-600">
                      {q.observaciones}
                    </p>
                  )}

                  <div className="mt-3 border-t border-zinc-100 pt-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      <FiClipboard size={13} /> Historial
                    </p>
                    {visitas.length === 0 ? (
                      <p className="mt-1 text-xs font-normal text-zinc-600">
                        Todavía no ingresó al taller.{" "}
                        <Link
                          href="/ordenes/nueva"
                          className="inline-flex items-center gap-0.5 font-medium text-zinc-900 hover:underline"
                        >
                          <FiPlus size={13} /> Crear recepción
                        </Link>
                      </p>
                    ) : (
                      <ol className="mt-2 space-y-2">
                        {visitas.map((o) => (
                          <li
                            key={o.id}
                            className="rounded-lg bg-zinc-50 px-2.5 py-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-ficha font-semibold text-zinc-900">
                                {o.numero}
                              </span>
                              <span className="font-normal text-zinc-600">
                                {new Date(o.fechaIngreso).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate font-normal text-zinc-600">
                              {o.fallaReportada}
                            </p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <Badge tono={tonoEstado(o.estado)}>
                                {ESTADO_ORDEN_LABEL[o.estado]}
                              </Badge>
                              <Link
                                href={`/ordenes/${o.id}`}
                                className="flex items-center gap-0.5 font-medium text-zinc-900 hover:underline"
                              >
                                Ver orden <FiChevronRight size={13} />
                              </Link>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <details className="mt-3">
                    <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-700 hover:underline">
                      <FiCamera size={13} /> Subir / cambiar foto (maqueta)
                    </summary>
                    <div className="mt-2">
                      <ImageUploader
                        equipoKey={String(q.id)}
                        value={fotos[q.id] ?? null}
                        onChange={(v) =>
                          setFotos((p) => ({ ...p, [q.id]: v }))
                        }
                      />
                    </div>
                  </details>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
