"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiCamera,
  FiChevronDown,
  FiClipboard,
  FiEye,
  FiPlus,
  FiTag,
  FiTool,
  FiUser,
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
          eyebrow="Banco de trabajo"
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
              const abierta = visitas.find((o) => !["ENTREGADO", "CANCELADO"].includes(o.estado)) ?? null;
              const garantia = (() => {
                const ent = visitas.find((o) => o.estado === "ENTREGADO" && o.fechaEntrega);
                if (!ent?.fechaEntrega) return null;
                const limite = new Date(ent.fechaEntrega);
                limite.setDate(limite.getDate() + (ent.garantiaDias ?? 90));
                return limite.getTime() >= Date.now() ? ent : null;
              })();
              return (
                <Card key={q.id} className="flex flex-col">
                  {/* Foto con contador de visitas superpuesto */}
                  <div className="relative mb-3">
                    {fotos[q.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fotos[q.id]!}
                        alt={`${q.tipo} ${q.marca}`}
                        className="h-36 w-full rounded-xl border border-stone-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200/70">
                        <FiTool size={26} className="text-stone-400" aria-hidden />
                        <span className="text-xs font-normal text-stone-500">
                          Sin foto
                        </span>
                      </div>
                    )}
                    <span className="absolute right-2 top-2 rounded-full bg-stone-950/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                      {visitas.length === 0
                        ? "Sin visitas"
                        : `${visitas.length} visita${visitas.length > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  {/* Título + estado actual */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate font-bold text-stone-900">
                      {q.tipo} · {q.marca} {q.modelo}
                    </p>
                    {actual && (
                      <Badge tono={tonoEstado(actual.estado)}>
                        {ESTADO_ORDEN_LABEL[actual.estado]}
                      </Badge>
                    )}
                  </div>

                  {/* Datos con iconos */}
                  <ul className="mt-2 space-y-1 text-xs text-stone-500">
                    <li className="flex min-w-0 items-center gap-1.5">
                      <FiUser size={13} className="shrink-0 text-blue-700" />
                      {q.cliente ? (
                        <Link
                          href={`/clientes/${q.clienteId}`}
                          className="truncate font-semibold text-stone-800 hover:text-blue-800 hover:underline"
                        >
                          {q.cliente.nombre} {q.cliente.apellido ?? ""}
                        </Link>
                      ) : (
                        <span className="font-ficha">#{q.clienteId}</span>
                      )}
                    </li>
                    <li className="flex min-w-0 items-center gap-1.5">
                      <FiTag size={13} className="shrink-0 text-blue-700" />
                      <span className="font-ficha truncate">
                        {q.numeroSerie ? `S/N ${q.numeroSerie}` : "Sin N° de serie"}
                      </span>
                    </li>
                  </ul>
                  {q.observaciones && (
                    <p className="mt-1.5 line-clamp-2 rounded-lg bg-stone-50 px-2 py-1 text-xs text-stone-500">
                      {q.observaciones}
                    </p>
                  )}

                  {/* Historial */}
                  <div className="mt-3 border-t border-stone-200/70 pt-2.5">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      <FiClipboard size={13} /> Historial
                    </p>
                    <div className={`mt-2 flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 ring-1 ring-inset ${
                      abierta
                        ? "bg-amber-50/80 ring-amber-200/70"
                        : garantia
                          ? "bg-emerald-50/80 ring-emerald-200/70"
                          : "bg-blue-50/70 ring-blue-200/60"
                    }`}>
                      <span className={`text-xs font-medium ${abierta ? "text-amber-900" : garantia ? "text-emerald-900" : "text-blue-900"}`}>
                        {abierta
                          ? `En taller: ${abierta.numero}`
                          : garantia
                            ? `Garantía vigente (${garantia.numero})`
                            : visitas.length === 0
                              ? "Sin ingresos todavía"
                              : "Ingresar este equipo de nuevo"}
                      </span>
                      {abierta ? (
                        <Link
                          href={`/ordenes/${abierta.id}`}
                          title={`Abrir orden ${abierta.numero}`}
                          aria-label={`Abrir orden ${abierta.numero}`}
                          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg bg-amber-600 text-white active:bg-amber-700"
                        >
                          <FiEye size={16} />
                        </Link>
                      ) : (
                        <Link
                          href={`/ordenes/nueva?equipoId=${q.id}${garantia ? "&garantia=1" : ""}`}
                          title={garantia ? `Ingreso por garantía de ${q.tipo} ${q.marca}` : `Crear recepción de ${q.tipo} ${q.marca}`}
                          aria-label={garantia ? `Ingreso por garantía de ${q.tipo} ${q.marca}` : `Crear recepción de ${q.tipo} ${q.marca}`}
                          className={`inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-white ${garantia ? "bg-emerald-700 active:bg-emerald-800" : "bg-blue-800 active:bg-blue-900"}`}
                        >
                          <FiPlus size={16} />
                        </Link>
                      )}
                    </div>
                    {visitas.length === 0 ? null : (
                      <ol className="mt-2 space-y-1.5">
                        {visitas.map((o) => (
                          <li
                            key={o.id}
                            className="flex items-center gap-2 rounded-xl bg-stone-50 px-2.5 py-2 text-xs ring-1 ring-inset ring-stone-200/60"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="font-ficha truncate font-bold text-stone-900">
                                  {o.numero}
                                </span>
                                <span className="shrink-0 text-stone-400">
                                  {new Date(o.fechaIngreso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                                </span>
                              </span>
                              <span className="mt-0.5 block">
                                <Badge tono={tonoEstado(o.estado)}>
                                  {ESTADO_ORDEN_LABEL[o.estado]}
                                </Badge>
                              </span>
                            </span>
                            <Link
                              href={`/ordenes/${o.id}`}
                              title={`Abrir orden ${o.numero}`}
                              aria-label={`Abrir orden ${o.numero}`}
                              className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-blue-700 shadow-sm active:bg-blue-50"
                            >
                              <FiEye size={15} />
                            </Link>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <details className="group mt-2.5">
                    <summary className="flex min-h-[40px] cursor-pointer list-none items-center justify-between rounded-xl px-1 text-xs font-semibold text-stone-500 active:bg-stone-50 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-1.5">
                        <FiCamera size={14} className="text-blue-700" /> Foto del equipo
                      </span>
                      <FiChevronDown size={15} className="transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-1.5">
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
