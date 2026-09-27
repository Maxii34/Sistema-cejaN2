"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiCamera,
  FiChevronRight,
  FiClipboard,
  FiPlus,
  FiTool,
  FiUserPlus,
} from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Modal } from "@/components/Modal";
import {
  Card,
  PageHeader,
  Badge,
  Empty,
  btnPrimary,
  btnSecondary,
  inputCls,
} from "@/components/ui";
import type {
  ApiEnvelope,
  Cliente,
  CondicionFisica,
  Equipo,
  EstadoOrden,
  OrdenReparacion,
  Paged,
} from "@/lib/types";
import { CONDICION_LABEL, ESTADO_ORDEN_LABEL } from "@/lib/types";

function tonoEstado(e: EstadoOrden) {
  if (e === "ENTREGADO" || e === "LISTO") return "green" as const;
  if (e === "CANCELADO") return "red" as const;
  if (e === "ESPERANDO_REPUESTO") return "amber" as const;
  if (e === "RECIBIDO") return "blue" as const;
  return "violet" as const;
}

const CONDICIONES = Object.keys(CONDICION_LABEL) as CondicionFisica[];

type ModalAbierto = null | "cliente" | "equipo" | "recepcion";

export default function RecepcionPage() {
  const { usuario, cargando } = useRequireAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [clienteSel, setClienteSel] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);

  // form cliente
  const [fc, setFc] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    whatsapp: "",
    email: "",
    direccion: "",
  });
  // form equipo
  const [fe, setFe] = useState({
    tipo: "",
    marca: "",
    modelo: "",
    numeroSerie: "",
    observaciones: "",
  });
  // form recepción
  const [frEquipoId, setFrEquipoId] = useState<number | "">("");
  const [frFalla, setFrFalla] = useState("");
  const [frAccesorios, setFrAccesorios] = useState("");
  const [frCond, setFrCond] = useState<CondicionFisica[]>(["BUEN_ESTADO"]);
  const [frCosto, setFrCosto] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarTodo = async () => {
    const [c, e, o] = await Promise.all([
      api.get<ApiEnvelope<Cliente[]>>("/api/cliente"),
      api.get<ApiEnvelope<Equipo[]>>("/api/equipo"),
      api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>(
        "/api/orden-reparacion"
      ),
    ]);
    setClientes(c.data);
    setEquipos(e.data);
    setOrdenes(Array.isArray(o.data) ? o.data : o.data.data);
  };

  useEffect(() => {
    if (!usuario) return;
    cargarTodo()
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error al cargar")
      )
      .finally(() => setCargandoLista(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const filtrados = useMemo(
    () =>
      clientes.filter((c) =>
        `${c.nombre} ${c.apellido ?? ""} ${c.dni ?? ""} ${c.telefono ?? ""}`
          .toLowerCase()
          .includes(busqueda.toLowerCase())
      ),
    [clientes, busqueda]
  );

  const cliente = clientes.find((c) => c.id === clienteSel) ?? null;
  const equiposCliente = useMemo(
    () => equipos.filter((e) => e.clienteId === clienteSel),
    [equipos, clienteSel]
  );
  const ordenesCliente = useMemo(() => {
    if (!clienteSel) return [];
    const ids = new Set(equiposCliente.map((e) => e.id));
    return ordenes
      .filter((o) => ids.has(o.equipoId))
      .sort(
        (a, b) =>
          new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
      );
  }, [ordenes, equiposCliente, clienteSel]);

  const abrirRecepcion = (equipoId?: number) => {
    setFrEquipoId(equipoId ?? "");
    setFrFalla("");
    setFrAccesorios("");
    setFrCond(["BUEN_ESTADO"]);
    setFrCosto("");
    setModal("recepcion");
  };

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(fc).map(([k, v]) => [
          k,
          v.trim() === "" ? null : v.trim(),
        ])
      );
      const res = await api.post<ApiEnvelope<Cliente>>("/api/cliente", payload);
      await cargarTodo();
      setClienteSel(res.data.id);
      setFc({
        nombre: "",
        apellido: "",
        dni: "",
        telefono: "",
        whatsapp: "",
        email: "",
        direccion: "",
      });
      setModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente");
    } finally {
      setGuardando(false);
    }
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSel) return;
    setGuardando(true);
    try {
      const res = await api.post<ApiEnvelope<Equipo>>("/api/equipo", {
        tipo: fe.tipo.trim(),
        marca: fe.marca.trim(),
        modelo: fe.modelo.trim(),
        numeroSerie: fe.numeroSerie.trim() || null,
        observaciones: fe.observaciones.trim() || null,
        clienteId: clienteSel,
      });
      await cargarTodo();
      setFe({ tipo: "", marca: "", modelo: "", numeroSerie: "", observaciones: "" });
      abrirRecepcion(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el equipo");
    } finally {
      setGuardando(false);
    }
  };

  const guardarRecepcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frEquipoId || frCond.length === 0 || !frFalla.trim()) {
      setError("Completá equipo, falla y al menos 1 condición física.");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/api/orden-reparacion", {
        equipoId: Number(frEquipoId),
        fallaReportada: frFalla.trim(),
        accesorios: frAccesorios.trim() || null,
        condicionFisica: frCond,
        costoEstimado: frCosto ? Number(frCosto) : null,
        firmaClienteRecepcion: true,
        firmaTecnicoRecepcion: true,
        tecnicoId: usuario?.id ?? null,
        creadoPorId: usuario?.id ?? null,
      });
      await cargarTodo();
      setModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la orden");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader
          titulo="Recepción"
          descripcion="Clientes y órdenes en un solo lugar: elegí un cliente, mirá sus equipos y creá la recepción."
          accion={
            <div className="flex gap-2">
              <button
                className={btnSecondary + " gap-2"}
                onClick={() => setModal("cliente")}
              >
                <FiUserPlus size={15} /> Nuevo cliente
              </button>
              <button
                className={btnPrimary + " gap-2"}
                disabled={!clienteSel}
                onClick={() => abrirRecepcion()}
              >
                <FiPlus size={16} /> Nueva recepción
              </button>
            </div>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
          {/* Columna clientes */}
          <Card>
            <input
              className={inputCls}
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {cargandoLista ? (
              <p className="mt-3 text-sm font-normal text-zinc-600">Cargando...</p>
            ) : filtrados.length === 0 ? (
              <div className="mt-3">
                <Empty
                  mensaje="Sin clientes"
                  detalle="Creá el primero con el botón superior."
                />
              </div>
            ) : (
              <ul className="mt-2 max-h-[60vh] divide-y divide-zinc-100 overflow-y-auto">
                {filtrados.map((c) => {
                  const nOrdenes = ordenes.filter((o) =>
                    equipos.some(
                      (e) => e.id === o.equipoId && e.clienteId === c.id
                    )
                  ).length;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setClienteSel(c.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm hover:bg-zinc-50 ${
                          clienteSel === c.id ? "bg-zinc-100 ring-1 ring-zinc-300" : ""
                        }`}
                      >
                        <span>
                          <span className="block font-medium text-zinc-900">
                            {c.nombre} {c.apellido ?? ""}
                          </span>
                          <span className="block text-xs font-normal text-zinc-600">
                            {[c.dni && `DNI ${c.dni}`, c.telefono]
                              .filter(Boolean)
                              .join(" · ") || "Sin contacto"}
                          </span>
                        </span>
                        {nOrdenes > 0 && (
                          <Badge tono="blue">{nOrdenes}</Badge>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Columna detalle */}
          {!cliente ? (
            <Empty
              mensaje="Seleccioná un cliente"
              detalle="Elegí uno de la lista para ver sus equipos y órdenes."
            />
          ) : (
            <div className="space-y-4">
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      {cliente.nombre} {cliente.apellido ?? ""}
                    </h2>
                    <p className="text-xs font-normal text-zinc-600">
                      {[cliente.dni && `DNI ${cliente.dni}`, cliente.telefono, cliente.email]
                        .filter(Boolean)
                        .join(" · ") || "Sin contacto"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className={btnSecondary + " gap-1.5 text-xs"}
                    >
                      Ver ficha <FiChevronRight size={14} />
                    </Link>
                    <button
                      className={btnSecondary + " gap-1.5 text-xs"}
                      onClick={() => {
                        setFe({ tipo: "", marca: "", modelo: "", numeroSerie: "", observaciones: "" });
                        setModal("equipo");
                      }}
                    >
                      <FiTool size={13} /> Nuevo equipo
                    </button>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
                  <FiClipboard size={15} /> Órdenes ({ordenesCliente.length})
                </h3>
                {ordenesCliente.length === 0 ? (
                  <p className="mt-2 text-sm font-normal text-zinc-600">
                    Sin órdenes. Creá la primera recepción de este cliente.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-zinc-100">
                    {ordenesCliente.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-2 py-2 text-sm"
                      >
                        <span>
                          <span className="font-ficha font-semibold text-zinc-900">
                            {o.numero}
                          </span>{" "}
                          <span className="font-normal text-zinc-600">
                            {o.equipo
                              ? `${o.equipo.tipo} ${o.equipo.marca}`
                              : `Equipo #${o.equipoId}`}{" "}
                            · {o.fallaReportada.slice(0, 50)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Badge tono={tonoEstado(o.estado)}>
                            {ESTADO_ORDEN_LABEL[o.estado]}
                          </Badge>
                          <Link
                            href={`/ordenes/${o.id}`}
                            className="flex items-center gap-0.5 font-medium text-zinc-900 hover:underline"
                          >
                            Abrir <FiChevronRight size={14} />
                          </Link>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Modal: nuevo cliente */}
        {modal === "cliente" && (
          <Modal titulo="Nuevo cliente" onClose={() => setModal(null)}>
            <form onSubmit={(e) => void guardarCliente(e)} className="grid grid-cols-2 gap-2">
              {(
                [
                  ["nombre", "Nombre *"],
                  ["apellido", "Apellido"],
                  ["dni", "DNI"],
                  ["telefono", "Teléfono"],
                  ["whatsapp", "WhatsApp"],
                  ["email", "Email"],
                ] as const
              ).map(([k, label]) => (
                <input
                  key={k}
                  className={inputCls}
                  placeholder={label}
                  required={k === "nombre"}
                  value={fc[k]}
                  onChange={(e) => setFc({ ...fc, [k]: e.target.value })}
                />
              ))}
              <input
                className={inputCls + " col-span-2"}
                placeholder="Dirección"
                value={fc.direccion}
                onChange={(e) => setFc({ ...fc, direccion: e.target.value })}
              />
              <button className={btnPrimary + " col-span-2 gap-2"} disabled={guardando}>
                <FiUserPlus size={15} />
                {guardando ? "Guardando..." : "Guardar cliente"}
              </button>
            </form>
          </Modal>
        )}

        {/* Modal: nuevo equipo */}
        {modal === "equipo" && (
          <Modal titulo={`Nuevo equipo de ${cliente?.nombre ?? ""}`} onClose={() => setModal(null)}>
            <form onSubmit={(e) => void guardarEquipo(e)} className="grid grid-cols-2 gap-2">
              <input className={inputCls} required placeholder="Tipo * ej: Heladera" value={fe.tipo} onChange={(e) => setFe({ ...fe, tipo: e.target.value })} />
              <input className={inputCls} required placeholder="Marca *" value={fe.marca} onChange={(e) => setFe({ ...fe, marca: e.target.value })} />
              <input className={inputCls} required placeholder="Modelo *" value={fe.modelo} onChange={(e) => setFe({ ...fe, modelo: e.target.value })} />
              <input className={inputCls} placeholder="N° serie" value={fe.numeroSerie} onChange={(e) => setFe({ ...fe, numeroSerie: e.target.value })} />
              <input className={inputCls + " col-span-2"} placeholder="Observaciones" value={fe.observaciones} onChange={(e) => setFe({ ...fe, observaciones: e.target.value })} />
              <p className="col-span-2 flex items-center gap-1.5 text-xs font-normal text-zinc-600">
                <FiCamera size={13} /> La foto se agrega después desde el Historial de equipos.
              </p>
              <button className={btnPrimary + " col-span-2 gap-2"} disabled={guardando}>
                <FiTool size={15} />
                {guardando ? "Guardando..." : "Guardar y crear recepción"}
              </button>
            </form>
          </Modal>
        )}

        {/* Modal: nueva recepción */}
        {modal === "recepcion" && (
          <Modal titulo="Nueva recepción" onClose={() => setModal(null)} ancho="max-w-xl">
            <form onSubmit={(e) => void guardarRecepcion(e)} className="space-y-2">
              <label className="block text-xs font-medium text-zinc-600">
                Equipo de {cliente?.nombre} *
              </label>
              <select
                className={inputCls}
                required
                value={frEquipoId}
                onChange={(e) => setFrEquipoId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Seleccionar equipo...</option>
                {equiposCliente.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.tipo} {q.marca} {q.modelo}
                  </option>
                ))}
              </select>
              <label className="block text-xs font-medium text-zinc-600">Falla reportada *</label>
              <textarea className={inputCls} rows={3} required value={frFalla} onChange={(e) => setFrFalla(e.target.value)} placeholder="Ej: No enfría, hace ruido..." />
              <label className="block text-xs font-medium text-zinc-600">Accesorios incluidos</label>
              <textarea className={inputCls} rows={2} value={frAccesorios} onChange={(e) => setFrAccesorios(e.target.value)} placeholder="Ej: Control remoto, cable..." />
              <label className="block text-xs font-medium text-zinc-600">Condición física *</label>
              <div className="grid grid-cols-1 gap-1.5">
                {CONDICIONES.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={frCond.includes(c)}
                      onChange={() =>
                        setFrCond((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
                      }
                    />
                    {CONDICION_LABEL[c]}
                  </label>
                ))}
              </div>
              <label className="block text-xs font-medium text-zinc-600">Costo estimado ($)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={frCosto} onChange={(e) => setFrCosto(e.target.value)} />
              <button className={btnPrimary + " w-full gap-2"} disabled={guardando}>
                <FiPlus size={15} />
                {guardando ? "Guardando..." : "Crear orden de reparación"}
              </button>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
