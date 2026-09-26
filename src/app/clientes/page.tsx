"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Badge, Empty, btnPrimary, inputCls } from "@/components/ui";
import type { ApiEnvelope, Cliente } from "@/lib/types";

export default function ClientesPage() {
  const { usuario, cargando } = useRequireAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);

  // Form alta rápida
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");

  const cargar = async () => {
    setCargandoLista(true);
    setError(null);
    try {
      const res = await api.get<ApiEnvelope<Cliente[]>>("/api/cliente");
      setClientes(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar clientes");
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    if (usuario) void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const crear = async (e: React.FormEvent) => {
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
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear");
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      await api.del(`/api/cliente/${id}`);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  };

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  const filtrados = clientes.filter((c) =>
    `${c.nombre} ${c.apellido ?? ""} ${c.dni ?? ""} ${c.telefono ?? ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader
          titulo="Clientes"
          descripcion="Personas que dejan equipos a reparar. Buscá, creá y accedé a su ficha."
          accion={
            <Link href="/ordenes/nueva" className={btnPrimary}>
              + Nueva recepción
            </Link>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <input
              className={inputCls}
              placeholder="Buscar por nombre, DNI o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {cargandoLista ? (
              <p className="mt-4 text-sm text-zinc-600">Cargando...</p>
            ) : filtrados.length === 0 ? (
              <div className="mt-4">
                <Empty
                  mensaje="Sin clientes"
                  detalle="Creá el primero con el formulario lateral."
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-100">
                {filtrados.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {c.nombre} {c.apellido ?? ""}
                      </Link>
                      <p className="text-xs text-zinc-600">
                        {[c.dni && `DNI ${c.dni}`, c.telefono, c.email]
                          .filter(Boolean)
                          .join(" · ") || "Sin contacto"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tono={c.activo ? "green" : "zinc"}>
                        {c.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <button
                        onClick={() => void eliminar(c.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold text-zinc-900">Alta rápida</h2>
            <form onSubmit={(e) => void crear(e)} className="mt-3 space-y-2">
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
              <button className={btnPrimary + " w-full"}>Guardar cliente</button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
