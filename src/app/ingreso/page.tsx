"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiChevronRight,
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
  IconTile,
} from "@/components/ui";
import type { ApiEnvelope, Cliente } from "@/lib/types";

export default function IngresoPage() {
  const { usuario, cargando } = useRequireAuth();
  const [error, setError] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busquedaC, setBusquedaC] = useState("");
  const [cargandoC, setCargandoC] = useState(true);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");

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

  useEffect(() => {
    if (!usuario) return;
    setError(null);
    void cargarClientes();
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

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  const acciones = (c: Cliente) => (
    <div className="flex shrink-0 items-center justify-end gap-1.5">
      <Link
        href={`/clientes/${c.id}`}
        title="Abrir ficha del cliente"
        aria-label={`Abrir ficha de ${c.nombre}`}
        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-blue-800 px-2.5 py-1.5 text-xs font-semibold text-white active:bg-blue-900 sm:min-h-[40px] sm:px-3 sm:text-xs"
      >
        <FiEye size={14} />
        Abrir
      </Link>
      <button
        onClick={() =>
          void eliminarCliente(c.id, `${c.nombre} ${c.apellido ?? ""}`.trim())
        }
        title="Eliminar cliente"
        aria-label={`Eliminar a ${c.nombre}`}
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-red-200 bg-white px-2 text-red-600 active:bg-red-50 sm:min-h-[40px] sm:min-w-[40px] sm:px-2.5"
      >
        <FiTrash2 size={15} />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader
          eyebrow="Recepción del taller"
          titulo="Ingreso · Clientes"
          descripcion="Todos los clientes del taller. Abrí la ficha para ver sus equipos y recepciones."
          accion={
            <Link href="/ordenes/nueva" className={btnPrimary + " gap-2"}>
              <FiPlus size={16} /> Nueva recepción
            </Link>
          }
        />
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[1fr_320px]">
          <Card className="order-last lg:order-none">
            <div className="flex items-center gap-2">
              <input
                className={inputCls}
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={busquedaC}
                onChange={(e) => setBusquedaC(e.target.value)}
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <FiUsers size={13} /> {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""}
            </p>
            {cargandoC ? (
              <p className="mt-4 text-sm font-normal text-stone-500">Cargando...</p>
            ) : clientesFiltrados.length === 0 ? (
              <div className="mt-4">
                <Empty
                  mensaje="Sin clientes"
                  detalle="Creá el primero con el formulario de alta rápida."
                />
              </div>
            ) : (
              <div className="tabla-scroll -mx-4 mt-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-y border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
                      <th className="px-3 py-2.5 font-bold">Cliente</th>
                      <th className="px-3 py-2.5 font-bold">Contacto</th>
                      <th className="px-3 py-2.5 font-bold">Estado</th>
                      <th className="px-3 py-2.5 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((c) => (
                      <tr key={c.id} className="border-b border-stone-100 transition-colors last:border-0 hover:bg-blue-50/40">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-extrabold text-white">
                              {(c.nombre[0] ?? "?").toUpperCase()}
                              {(c.apellido?.[0] ?? "").toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <Link
                                href={`/clientes/${c.id}`}
                                className="block truncate font-semibold text-stone-900 hover:text-blue-800 hover:underline"
                              >
                                {c.nombre} {c.apellido ?? ""}
                              </Link>
                              <span className="block truncate text-xs text-stone-500">
                                {c.dni ? `DNI ${c.dni}` : "Sin DNI"}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-stone-500">
                          {c.telefono || "Sin teléfono"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <Badge tono={c.activo ? "green" : "zinc"}>
                            {c.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">{acciones(c)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card className="order-first lg:order-none">
            <div className="flex items-center gap-3">
              <IconTile tono="brand">
                <FiUserPlus size={18} />
              </IconTile>
              <div>
                <h2 className="font-bold text-stone-900">Alta rápida</h2>
                <p className="text-xs font-normal text-stone-500">
                  Cargá un cliente en segundos
                </p>
              </div>
            </div>
            <form onSubmit={(e) => void crearCliente(e)} className="mt-4 space-y-2">
              <input
                className={inputCls}
                required
                placeholder="Nombre *"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Teléfono / WhatsApp"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
              <button className={btnPrimary + " w-full"}>
                <FiUserPlus size={15} />
                Guardar cliente
              </button>
            </form>
          </Card>
        </div>

        {/* Acceso a órdenes desde Ingreso (viven en el Panel) */}
        <Link
          href="/"
          className="mt-3 flex min-h-[48px] items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm font-semibold text-blue-900 active:bg-blue-100 sm:hidden"
        >
          <span className="flex items-center gap-2">
            <FiChevronRight size={16} /> Ver últimas órdenes en el Panel
          </span>
        </Link>
      </main>
    </div>
  );
}
