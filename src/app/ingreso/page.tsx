"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiChevronRight,
  FiEye,
  FiMessageCircle,
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { Toast } from "@/lib/toast";
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
  Spinner,
  CargandoPagina,
} from "@/components/ui";
import type { ApiEnvelope, Cliente } from "@/lib/types";
import { Lista, ItemLi, Reveal } from "@/components/motion";

/** Normaliza a formato wa.me: solo dígitos, sin 0 inicial, con código país 54. */
function normalizarWa(telefono: string): string {
  let d = telefono.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = `54${d}`;
  return d;
}

export default function IngresoPage() {
  const { usuario, cargando, esAdmin } = useRequireAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busquedaC, setBusquedaC] = useState("");
  const [cargandoC, setCargandoC] = useState(true);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");
  const [guardandoCliente, setGuardandoCliente] = useState(false);

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
    if (guardandoCliente) return;
    if (!nombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    setError(null);
    setGuardandoCliente(true);
    try {
      await api.post("/api/cliente", {
        nombre: nombre.trim(),
        apellido: apellido.trim() || null,
        telefono: telefono.trim() || null,
        dni: dni.trim() || null,
      });
      setNombre("");
      setApellido("");
      setTelefono("");
      setDni("");
      await cargarClientes();
      void Toast.fire({ icon: "success", title: "Cliente creado", text: "El cliente se guardó correctamente." });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo crear";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo crear", text: mensaje });
    } finally {
      setGuardandoCliente(false);
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
      void Toast.fire({ icon: "success", title: "Cliente eliminado", text: `"${nombreCliente}" fue eliminado.` });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo eliminar";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo eliminar", text: mensaje });
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

  if (cargando || !usuario) return <CargandoPagina />;

  const acciones = (c: Cliente) => (
    <div className="flex shrink-0 items-center justify-end gap-1.5">
      {esAdmin && c.telefono?.trim() && (
        <a
          href={`https://wa.me/${normalizarWa(c.telefono)}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`Abrir chat de WhatsApp con ${c.nombre}`}
          aria-label={`Abrir chat de WhatsApp con ${c.nombre}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 bg-white text-green-700 shadow-sm transition-all hover:-translate-y-px hover:border-green-300 hover:bg-green-50 hover:shadow-md active:translate-y-0 active:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/30 sm:h-10 sm:w-10"
        >
          <FiMessageCircle size={15} />
        </a>
      )}
      <Link
        href={`/clientes/${c.id}`}
        title="Abrir ficha del cliente"
        aria-label={`Abrir ficha de ${c.nombre}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-700 shadow-sm transition-all hover:-translate-y-px hover:border-blue-300 hover:bg-blue-50 hover:shadow-md active:translate-y-0 active:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/30 sm:h-10 sm:w-10"
      >
        <FiEye size={15} />
      </Link>
      <button
        onClick={() =>
          void eliminarCliente(c.id, `${c.nombre} ${c.apellido ?? ""}`.trim())
        }
        title="Eliminar cliente"
        aria-label={`Eliminar a ${c.nombre}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 shadow-sm transition-all hover:-translate-y-px hover:border-red-300 hover:bg-red-50 hover:shadow-md active:translate-y-0 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 sm:h-10 sm:w-10"
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

        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
          <Card className="order-last min-w-0 flex-1 lg:order-0">
            <div className="flex items-center gap-2">
              <input
                id="buscar-clientes"
                className={inputCls}
                type="search"
                autoComplete="off"
                aria-label="Buscar clientes por nombre, DNI o teléfono"
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={busquedaC}
                onChange={(e) => setBusquedaC(e.target.value)}
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <FiUsers size={13} /> {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""}
            </p>
            {cargandoC ? (
              <div className="mt-4 flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
                <Spinner tamano="md" /> Cargando clientes...
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="mt-4">
                <Empty
                  mensaje="Sin clientes"
                  detalle="Creá el primero con el formulario de alta rápida."
                />
              </div>
            ) : (
              <Lista className="tabla-scroll mt-3 max-h-96 space-y-2 overflow-y-auto pb-1 pr-1 text-sm">
                {clientesFiltrados.map((c) => (
                  <ItemLi
                    key={c.id}
                    onClick={() => router.push(`/clientes/${c.id}`)}
                    title={`Abrir ficha de ${c.nombre}`}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-stone-200/70 bg-stone-50/60 px-3 py-2.5 shadow-sm transition-all duration-200 sm:gap-3 sm:hover:-translate-y-0.5 sm:hover:border-blue-200 sm:hover:bg-white sm:hover:shadow-xl"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-extrabold text-white">
                      {(c.nombre[0] ?? "?").toUpperCase()}
                      {(c.apellido?.[0] ?? "").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="block truncate font-semibold text-stone-900">
                          {c.nombre} {c.apellido ?? ""}
                        </span>
                        <span className="hidden shrink-0 sm:inline">
                          <Badge tono={c.activo ? "green" : "zinc"}>
                            {c.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </span>
                      </span>
                      <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-stone-500">
                        <span className="truncate">
                          {c.dni ? `DNI ${c.dni}` : "Sin DNI"}
                          {c.telefono ? ` · ${c.telefono}` : " · Sin teléfono"}
                        </span>
                        <span className="shrink-0 sm:hidden">
                          <Badge tono={c.activo ? "green" : "zinc"}>
                            {c.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      {acciones(c)}
                    </span>
                  </ItemLi>
                ))}
              </Lista>
            )}
          </Card>
          <Reveal className="order-first shrink-0 lg:order-0 lg:w-80" delay={0.08}><Card>
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
              <div>
                <label htmlFor="alta-nombre" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Nombre <span className="font-bold text-red-600">*</span>
                </label>
                <input
                  id="alta-nombre"
                  name="nombre"
                  className={inputCls}
                  required
                  type="text"
                  autoComplete="given-name"
                  placeholder="Nombre *"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="alta-apellido" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Apellido
                </label>
                <input
                  id="alta-apellido"
                  name="apellido"
                  className={inputCls}
                  type="text"
                  autoComplete="family-name"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="alta-dni" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  DNI
                </label>
                <input
                  id="alta-dni"
                  name="dni"
                  className={inputCls}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="DNI"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="alta-telefono" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="alta-telefono"
                  name="telefono"
                  className={inputCls}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="Teléfono / WhatsApp"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
              <button className={btnPrimary + " w-full gap-2"} disabled={guardandoCliente}>
                <FiUserPlus size={15} />
                {guardandoCliente ? "Guardando..." : "Guardar cliente"}
              </button>
            </form>
          </Card>
          </Reveal>
        </div>

        {/* Acceso a órdenes desde Ingreso (viven en el Panel) */}
        <Link
          href="/"
          className="mt-3 flex min-h-12 items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm font-semibold text-blue-900 active:bg-blue-100 sm:hidden"
        >
          <span className="flex items-center gap-2">
            <FiChevronRight size={16} /> Ver últimas órdenes en el Panel
          </span>
        </Link>
      </main>
    </div>
  );
}
