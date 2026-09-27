"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiChevronDown,
  FiEdit,
  FiPlus,
  FiSave,
  FiTool,
  FiUser,
  FiX,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Empty, Badge, btnPrimary, btnSecondary, inputCls, IconTile } from "@/components/ui";
import type { ApiEnvelope, Cliente, Equipo, EstadoOrden, OrdenReparacion, Paged } from "@/lib/types";
import { ESTADO_ORDEN_LABEL } from "@/lib/types";

function tonoEstado(e: EstadoOrden) {
  if (e === "ENTREGADO" || e === "LISTO") return "green" as const;
  if (e === "CANCELADO") return "red" as const;
  if (e === "ESPERANDO_REPUESTO") return "amber" as const;
  if (e === "RECIBIDO") return "blue" as const;
  return "violet" as const;
}

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

export default function ClienteDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { usuario, cargando } = useRequireAuth();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // edición cliente (los campos se habilitan con "Editar datos")
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", whatsapp: "", email: "", direccion: "", dni: "" });
  const [editando, setEditando] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  // alta equipo
  const [eq, setEq] = useState({ tipo: "", marca: "", modelo: "", numeroSerie: "", observaciones: "" });

  const rellenarForm = (c: Cliente) =>
    setForm({
      nombre: c.nombre ?? "",
      apellido: c.apellido ?? "",
      telefono: c.telefono ?? "",
      whatsapp: c.whatsapp ?? "",
      email: c.email ?? "",
      direccion: c.direccion ?? "",
      dni: c.dni ?? "",
    });

  useEffect(() => {
    if (!usuario || !id) return;
    (async () => {
      try {
        const c = await api.get<ApiEnvelope<Cliente>>(`/api/cliente/${id}`);
        setCliente(c.data);
        rellenarForm(c.data);
        const e = await api.get<ApiEnvelope<Equipo[]>>(`/api/equipo/cliente/${id}`);
        setEquipos(e.data);
        const od = await api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>("/api/orden-reparacion");
        setOrdenes(Array.isArray(od.data) ? od.data : od.data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      }
    })();
  }, [usuario, id]);

  const cancelarEdicion = () => {
    if (cliente) rellenarForm(cliente);
    setEditando(false);
  };

  // Última orden de cada equipo (para mostrar su estado actual)
  const ultimaOrdenPorEquipo = useMemo(() => {
    const map = new Map<number, OrdenReparacion>();
    for (const o of ordenes) {
      const actual = map.get(o.equipoId);
      if (!actual || new Date(o.fechaIngreso) > new Date(actual.fechaIngreso)) {
        map.set(o.equipoId, o);
      }
    }
    return map;
  }, [ordenes]);

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
      );
      const res = await api.put<ApiEnvelope<Cliente>>(`/api/cliente/${id}`, payload);
      setCliente(res.data);
      setEditando(false);
      void Toast.fire({ icon: "success", title: "Datos guardados", text: "La ficha del cliente se actualizó." });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo guardar";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo guardar", text: mensaje });
    }
  };

  const crearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/equipo", {
        tipo: eq.tipo.trim(),
        marca: eq.marca.trim(),
        modelo: eq.modelo.trim(),
        numeroSerie: eq.numeroSerie.trim() || null,
        observaciones: eq.observaciones.trim() || null,
        clienteId: id,
      });
      setEq({ tipo: "", marca: "", modelo: "", numeroSerie: "", observaciones: "" });
      const e2 = await api.get<ApiEnvelope<Equipo[]>>(`/api/equipo/cliente/${id}`);
      setEquipos(e2.data);
      void Toast.fire({ icon: "success", title: "Equipo agregado", text: "El equipo quedó registrado en la ficha." });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo crear equipo";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo agregar", text: mensaje });
    }
  };

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader
          eyebrow="Ficha del cliente"
          titulo={cliente ? `${cliente.nombre} ${cliente.apellido ?? ""}` : "Cliente"}
          descripcion={`Ficha del cliente #${id} y sus equipos`}
          accion={
            <button className={btnSecondary + " gap-2"} onClick={() => router.push("/ingreso")}>
              <FiArrowLeft size={15} /> Volver
            </button>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <h2 className="flex min-w-0 flex-1 items-center gap-2 font-bold text-stone-900">
                <span className="shrink-0">
                  <IconTile tono="blue"><FiUser size={16} /></IconTile>
                </span>
                <span className="truncate">Datos del cliente</span>
              </h2>
              {!editando ? (
                <button
                  onClick={() => setEditando(true)}
                  aria-label="Editar datos del cliente"
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 shadow-sm active:bg-stone-100"
                >
                  <FiEdit size={14} />
                  <span className="hidden min-[420px]:inline">Editar datos</span>
                </button>
              ) : (
                <button
                  onClick={cancelarEdicion}
                  aria-label="Cancelar edición"
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 shadow-sm active:bg-stone-100"
                >
                  <FiX size={14} />
                  <span className="hidden min-[420px]:inline">Cancelar</span>
                </button>
              )}
            </div>
            {!editando ? (
              <div className="mt-3">
                <p className="truncate text-lg font-extrabold text-stone-900">
                  {cliente ? `${cliente.nombre} ${cliente.apellido ?? ""}`.trim() : "—"}
                </p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-400">DNI</dt>
                    <dd className="font-ficha font-semibold text-stone-800">{cliente?.dni || "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Teléfono</dt>
                    <dd className="font-semibold text-stone-800">{cliente?.telefono || "—"}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => setVerTodos((v) => !v)}
                  aria-expanded={verTodos}
                  className={btnSecondary + " mt-3 w-full gap-2"}
                >
                  {verTodos ? "Ocultar datos" : "Ver datos"}
                  <FiChevronDown size={15} className={`transition-transform ${verTodos ? "rotate-180" : ""}`} />
                </button>
                {verTodos && (
                  <dl className="mt-2 space-y-2 rounded-xl bg-stone-50 p-3 text-sm ring-1 ring-inset ring-stone-200/70">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-stone-400">WhatsApp</dt>
                      <dd className="font-semibold text-stone-800">{cliente?.whatsapp || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Email</dt>
                      <dd className="break-all font-semibold text-stone-800">{cliente?.email || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Dirección</dt>
                      <dd className="font-semibold text-stone-800">{cliente?.direccion || "—"}</dd>
                    </div>
                  </dl>
                )}
              </div>
            ) : (
            <form onSubmit={(e) => void guardarCliente(e)} className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              {(
                [
                  ["nombre", "Nombre", true],
                  ["apellido", "Apellido", false],
                  ["dni", "DNI", false],
                  ["telefono", "Teléfono", false],
                  ["whatsapp", "WhatsApp", false],
                  ["email", "Email", false],
                ] as const
              ).map(([k, label, req]) => (
                <div key={k}>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                    {label} {req && <span className="font-bold text-red-600">*</span>}
                  </label>
                  <input
                    className={inputCls + (!editando ? " bg-zinc-50 text-zinc-600" : "")}
                    placeholder={label}
                    value={form[k]}
                    disabled={!editando}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </div>
              ))}
              <div className="min-[420px]:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Dirección</label>
                <input
                  className={inputCls + (!editando ? " bg-zinc-50 text-zinc-600" : "")}
                  placeholder="Dirección"
                  value={form.direccion}
                  disabled={!editando}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </div>
              <button
                className={btnPrimary + " min-[420px]:col-span-2 gap-2"}
                disabled={!editando}
              >
                <FiSave size={15} /> Guardar cambios
              </button>
            </form>
            )}
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="brand"><FiPlus size={16} /></IconTile> Agregar equipo
            </h2>
            <form onSubmit={(e) => void crearEquipo(e)} className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Tipo <span className="font-bold text-red-600">*</span></label>
                <input className={inputCls} required placeholder="Ej: Heladera" value={eq.tipo} onChange={(e) => setEq({ ...eq, tipo: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Marca <span className="font-bold text-red-600">*</span></label>
                <input className={inputCls} required placeholder="Ej: Samsung" value={eq.marca} onChange={(e) => setEq({ ...eq, marca: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Modelo <span className="font-bold text-red-600">*</span></label>
                <input className={inputCls} required placeholder="Ej: RT38" value={eq.modelo} onChange={(e) => setEq({ ...eq, modelo: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">N° serie</label>
                <input className={inputCls} placeholder="N° de serie" value={eq.numeroSerie} onChange={(e) => setEq({ ...eq, numeroSerie: e.target.value })} />
              </div>
              <div className="min-[420px]:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Observaciones</label>
                <input className={inputCls} placeholder="Observaciones" value={eq.observaciones} onChange={(e) => setEq({ ...eq, observaciones: e.target.value })} />
              </div>
              <button className={btnSecondary + " min-[420px]:col-span-2 gap-2"}>
                <FiPlus size={15} /> Agregar equipo
              </button>
            </form>
          </Card>
        </div>

        <Card className="mt-3 sm:mt-4">
          <h2 className="flex items-center gap-2 font-bold text-stone-900">
            <IconTile tono="blue"><FiTool size={16} /></IconTile> Equipos del cliente ({equipos.length})
          </h2>
          {equipos.length === 0 ? (
            <div className="mt-3">
              <Empty mensaje="Sin equipos aún" detalle="Agregá el primero con el formulario de arriba." />
            </div>
          ) : (
            <div className="tabla-scroll -mx-4 mt-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
                    <th className="px-3 py-2.5 font-bold">Equipo</th>
                    <th className="px-3 py-2.5 font-bold">N° de serie</th>
                    <th className="px-3 py-2.5 font-bold">Ingreso</th>
                    <th className="px-3 py-2.5 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {equipos.map((q) => {
                    const ultima = ultimaOrdenPorEquipo.get(q.id) ?? null;
                    return (
                      <tr key={q.id} className="border-b border-stone-100 last:border-0 hover:bg-blue-50/40">
                        <td className="px-3 py-2.5 font-semibold text-stone-900">
                          {q.tipo}
                        </td>
                        <td className="font-ficha whitespace-nowrap px-3 py-2.5 text-stone-600">
                          {q.numeroSerie ? `S/N ${q.numeroSerie}` : "—"}
                        </td>
                        <td className="font-ficha whitespace-nowrap px-3 py-2.5 text-xs text-stone-500">
                          {q.createdAt
                            ? new Date(q.createdAt).toLocaleString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {ultima ? (
                            <Badge tono={tonoEstado(ultima.estado)}>
                              {ESTADO_ORDEN_LABEL[ultima.estado]}
                            </Badge>
                          ) : (
                            <Badge tono="zinc">Sin ingresos</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
