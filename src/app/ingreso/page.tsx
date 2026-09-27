"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiChevronRight,
  FiClipboard,
  FiEye,
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import Swal from "sweetalert2";
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
import type {
  ApiEnvelope,
  Cliente,
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

type Tab = "clientes" | "ordenes";

export default function IngresoPage() {
  const { usuario, cargando } = useRequireAuth();
  const [tab, setTab] = useState<Tab>("clientes");
  const [error, setError] = useState<string | null>(null);

  // ---- clientes ----
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busquedaC, setBusquedaC] = useState("");
  const [cargandoC, setCargandoC] = useState(true);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");

  // ---- órdenes ----
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const [filtro, setFiltro] = useState<string>("");
  const [busquedaO, setBusquedaO] = useState("");
  const [cargandoO, setCargandoO] = useState(true);

  const cargarClientes = async () => {
    setCargandoC(true);
    try {
      const res = await api.get<ApiEnvelope<Cliente[]>>("/api/cliente");
      setClientes(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar clientes");
    } finally {
      setCargandoC(false);
    }
  };

  const cargarOrdenes = async () => {
    setCargandoO(true);
    try {
      const res = await api.get<
        ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>
      >("/api/orden-reparacion");
      setOrdenes(Array.isArray(res.data) ? res.data : res.data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar órdenes");
    } finally {
      setCargandoO(false);
    }
  };

  useEffect(() => {
    if (!usuario) return;
    setError(null);
    void cargarClientes();
    void cargarOrdenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const crearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/cliente", {
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        dni: dni.trim() || null,
      });
      setNombre("");
      setTelefono("");
      setDni("");
      await cargarClientes();
      void Swal.fire({
        icon: "success",
        title: "Cliente creado",
        text: "El cliente se guardó correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo crear";
      setError(mensaje);
      void Swal.fire({ icon: "error", title: "Error", text: mensaje });
    }
  };

  const eliminarCliente = async (id: number, nombreCliente: string) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar cliente?",
      text: `Se eliminará a "${nombreCliente}". Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.del(`/api/cliente/${id}`);
      await cargarClientes();
      void Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El cliente fue eliminado.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo eliminar";
      setError(mensaje);
      void Swal.fire({ icon: "error", title: "Error", text: mensaje });
    }
  };

  const clientesFiltrados = useMemo(
    () =>
      clientes.filter((c) =>
        `${c.nombre} ${c.apellido ?? ""} ${c.dni ?? ""} ${c.telefono ?? ""}`
          .toLowerCase()
          .includes(busquedaC.toLowerCase())
      ),
    [clientes, busquedaC]
  );

  const ordenesFiltradas = useMemo(
    () =>
      ordenes.filter(
        (o) =>
          (!filtro || o.estado === filtro) &&
          `${o.numero} ${o.equipo?.marca ?? ""} ${o.equipo?.modelo ?? ""} ${
            o.fallaReportada
          }`
            .toLowerCase()
            .includes(busquedaO.toLowerCase())
      ),
    [ordenes, filtro, busquedaO]
  );

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader
          titulo="Ingreso"
          descripcion="Clientes que dejan equipos y sus órdenes de reparación, todo en un solo lugar."
          accion={
            <Link href="/ordenes/nueva" className={btnPrimary + " gap-2"}>
              <FiPlus size={16} /> Nueva recepción
            </Link>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Pestañas */}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:flex sm:w-auto">
          <button
            onClick={() => setTab("clientes")}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[15px] sm:text-sm font-medium ${
              tab === "clientes"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <FiUsers size={15} /> Clientes ({clientes.length})
          </button>
          <button
            onClick={() => setTab("ordenes")}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[15px] sm:text-sm font-medium ${
              tab === "ordenes"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <FiClipboard size={15} /> Órdenes ({ordenes.length})
          </button>
        </div>

        {tab === "clientes" && (
          <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[1fr_320px]">
            <Card className="shadow-md transition-shadow duration-300 hover:shadow-lg">
              <input
                className={inputCls + " transition-shadow focus:shadow-md"}
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={busquedaC}
                onChange={(e) => setBusquedaC(e.target.value)}
              />
              {cargandoC ? (
                <p className="mt-4 text-sm font-normal text-zinc-600">Cargando...</p>
              ) : clientesFiltrados.length === 0 ? (
                <div className="mt-4">
                  <Empty
                    mensaje="Sin clientes"
                    detalle="Creá el primero con el formulario lateral."
                  />
                </div>
              ) : (
                <>
                  {/* Vista cards para móvil */}
                  <ul className="mt-3 space-y-2 sm:hidden">
                    {clientesFiltrados.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                            {(c.nombre[0] ?? "?").toUpperCase()}
                            {(c.apellido?.[0] ?? "").toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <Link
                              href={`/clientes/${c.id}`}
                              className="block truncate font-medium text-zinc-900"
                            >
                              {c.nombre} {c.apellido ?? ""}
                            </Link>
                            <span className="block truncate text-xs font-normal text-zinc-600">
                              {c.dni ? `DNI ${c.dni}` : "Sin DNI"}
                              {" · "}
                              {[c.telefono, c.email].filter(Boolean).join(" · ") || "Sin contacto"}
                            </span>
                          </span>
                          <Badge tono={c.activo ? "green" : "zinc"}>
                            {c.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-2">
                          <Link
                            href={`/clientes/${c.id}`}
                            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white active:bg-zinc-700"
                          >
                            <FiEye size={14} />
                            Abrir ficha
                          </Link>
                          <button
                            onClick={() =>
                              void eliminarCliente(
                                c.id,
                                `${c.nombre} ${c.apellido ?? ""}`.trim()
                              )
                            }
                            aria-label={`Eliminar a ${c.nombre}`}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-red-600 active:bg-red-50"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {/* Tabla solo en sm+ */}
                  <div className="tabla-scroll mt-4 hidden overflow-x-auto rounded-xl border border-zinc-200 shadow-sm sm:block">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
                          <th className="px-4 py-3 font-semibold">Cliente</th>
                          <th className="px-4 py-3 font-semibold">Contacto</th>
                          <th className="px-4 py-3 font-semibold">Estado</th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientesFiltrados.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                                  {(c.nombre[0] ?? "?").toUpperCase()}
                                  {(c.apellido?.[0] ?? "").toUpperCase()}
                                </span>
                                <span>
                                  <Link
                                    href={`/clientes/${c.id}`}
                                    className="font-medium text-zinc-900 hover:underline"
                                  >
                                    {c.nombre} {c.apellido ?? ""}
                                  </Link>
                                  <span className="block text-xs font-normal text-zinc-600">
                                    {c.dni ? `DNI ${c.dni}` : "Sin DNI"}
                                  </span>
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-normal text-zinc-600">
                              {[c.telefono, c.email]
                                .filter(Boolean)
                                .join(" · ") || "Sin contacto"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge tono={c.activo ? "green" : "zinc"}>
                                {c.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/clientes/${c.id}`}
                                  title="Abrir ficha del cliente"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                                >
                                  <FiEye size={13} />
                                  Abrir
                                </Link>
                                <button
                                  onClick={() =>
                                    void eliminarCliente(
                                      c.id,
                                      `${c.nombre} ${c.apellido ?? ""}`.trim()
                                    )
                                  }
                                  title="Eliminar cliente"
                                  aria-label={`Eliminar a ${c.nombre}`}
                                  className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-2 text-red-600 transition-colors hover:bg-red-50"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
            <Card className="order-first shadow-md transition-shadow duration-300 hover:shadow-xl lg:order-none">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow">
                  <FiUserPlus size={18} />
                </span>
                <div>
                  <h2 className="font-semibold text-zinc-900">Alta rápida</h2>
                  <p className="text-xs font-normal text-zinc-600">
                    Cargá un cliente en segundos
                  </p>
                </div>
              </div>
              <form
                onSubmit={(e) => void crearCliente(e)}
                className="mt-4 space-y-2"
              >
                <input
                  className={inputCls + " transition-shadow focus:shadow-md"}
                  required
                  placeholder="Nombre *"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <input
                  className={inputCls + " transition-shadow focus:shadow-md"}
                  placeholder="DNI"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
                <input
                  className={inputCls + " transition-shadow focus:shadow-md"}
                  placeholder="Teléfono / WhatsApp"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
                <button
                  className={
                    btnPrimary +
                    " w-full gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                  }
                >
                  <FiUserPlus size={15} />
                  Guardar cliente
                </button>
              </form>
            </Card>
          </div>
        )}

        {tab === "ordenes" && (
          <Card>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <input
                className={inputCls + " sm:max-w-xs"}
                placeholder="Buscar por número, equipo o falla..."
                value={busquedaO}
                onChange={(e) => setBusquedaO(e.target.value)}
              />
              <select
                className={inputCls + " sm:max-w-[220px]"}
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              >
                <option value="">Todos los estados</option>
                {Object.entries(ESTADO_ORDEN_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            {cargandoO ? (
              <p className="mt-4 text-sm font-normal text-zinc-600">Cargando...</p>
            ) : ordenesFiltradas.length === 0 ? (
              <div className="mt-4">
                <Empty
                  mensaje="Sin órdenes"
                  detalle="Creá la primera recepción del día."
                />
              </div>
            ) : (
              <>
                {/* Cards móvil */}
                <ul className="mt-3 space-y-2 sm:hidden">
                  {ordenesFiltradas.map((o) => (
                    <li key={o.id} className="rounded-xl border border-zinc-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-ficha text-[13px] font-bold text-zinc-900">{o.numero}</span>
                        <Badge tono={tonoEstado(o.estado)}>
                          {ESTADO_ORDEN_LABEL[o.estado]}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-zinc-900">
                        {o.equipo
                          ? `${o.equipo.tipo} ${o.equipo.marca} ${o.equipo.modelo}`
                          : `Equipo #${o.equipoId}`}
                      </p>
                      <p className="line-clamp-2 text-[13px] text-zinc-600">{o.fallaReportada}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Badge
                          tono={
                            o.estadoPago === "PAGADO"
                              ? "green"
                              : o.estadoPago === "PARCIAL"
                                ? "amber"
                                : "zinc"
                          }
                        >
                          {o.estadoPago}
                        </Badge>
                        <Link
                          href={`/ordenes/${o.id}`}
                          className="inline-flex min-h-[44px] items-center gap-0.5 px-2 font-medium text-zinc-900"
                        >
                          Abrir <FiChevronRight size={15} />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                {/* Tabla desktop */}
                <div className="tabla-scroll mt-4 hidden overflow-x-auto sm:block">
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
                      {ordenesFiltradas.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b border-zinc-100 last:border-0"
                        >
                          <td className="py-2 pr-3 font-mono font-medium">
                            {o.numero}
                          </td>
                          <td className="py-2 pr-3">
                            {o.equipo
                              ? `${o.equipo.tipo} ${o.equipo.marca} ${o.equipo.modelo}`
                              : `Equipo #${o.equipoId}`}
                          </td>
                          <td className="max-w-[280px] truncate py-2 pr-3 font-normal text-zinc-600">
                            {o.fallaReportada}
                          </td>
                          <td className="py-2 pr-3">
                            <Badge tono={tonoEstado(o.estado)}>
                              {ESTADO_ORDEN_LABEL[o.estado]}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3">
                            <Badge
                              tono={
                                o.estadoPago === "PAGADO"
                                  ? "green"
                                  : o.estadoPago === "PARCIAL"
                                    ? "amber"
                                    : "zinc"
                              }
                            >
                              {o.estadoPago}
                            </Badge>
                          </td>
                          <td className="py-2 text-right">
                            <Link
                              href={`/ordenes/${o.id}`}
                              className="inline-flex items-center gap-0.5 font-medium text-zinc-900 hover:underline"
                            >
                              Abrir <FiChevronRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
