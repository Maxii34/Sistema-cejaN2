"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import type { ApiEnvelope, Cliente, Equipo } from "@/lib/types";

export default function ClienteDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { usuario, cargando } = useRequireAuth();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // edición cliente
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", whatsapp: "", email: "", direccion: "", dni: "" });
  // alta equipo
  const [eq, setEq] = useState({ tipo: "", marca: "", modelo: "", numeroSerie: "", observaciones: "" });

  useEffect(() => {
    if (!usuario || !id) return;
    (async () => {
      try {
        const c = await api.get<ApiEnvelope<Cliente>>(`/api/cliente/${id}`);
        setCliente(c.data);
        setForm({
          nombre: c.data.nombre ?? "",
          apellido: c.data.apellido ?? "",
          telefono: c.data.telefono ?? "",
          whatsapp: c.data.whatsapp ?? "",
          email: c.data.email ?? "",
          direccion: c.data.direccion ?? "",
          dni: c.data.dni ?? "",
        });
        const e = await api.get<ApiEnvelope<Equipo[]>>(`/api/equipo/cliente/${id}`);
        setEquipos(e.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      }
    })();
  }, [usuario, id]);

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
      );
      const res = await api.put<ApiEnvelope<Cliente>>(`/api/cliente/${id}`, payload);
      setCliente(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear equipo");
    }
  };

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader
          titulo={cliente ? `${cliente.nombre} ${cliente.apellido ?? ""}` : "Cliente"}
          descripcion={`Ficha del cliente #${id} y sus equipos`}
          accion={
            <button className={btnSecondary} onClick={() => router.push("/clientes")}>
              ← Volver
            </button>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Datos del cliente</h2>
            <form onSubmit={(e) => void guardarCliente(e)} className="mt-3 grid grid-cols-2 gap-2">
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
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              ))}
              <input
                className={inputCls + " col-span-2"}
                placeholder="Dirección"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
              <button className={btnPrimary + " col-span-2"}>Guardar cambios</button>
            </form>
          </Card>
          <Card>
            <h2 className="font-semibold">Equipos ({equipos.length})</h2>
            <form onSubmit={(e) => void crearEquipo(e)} className="mt-3 grid grid-cols-2 gap-2">
              <input className={inputCls} required placeholder="Tipo * ej: Heladera" value={eq.tipo} onChange={(e) => setEq({ ...eq, tipo: e.target.value })} />
              <input className={inputCls} required placeholder="Marca *" value={eq.marca} onChange={(e) => setEq({ ...eq, marca: e.target.value })} />
              <input className={inputCls} required placeholder="Modelo *" value={eq.modelo} onChange={(e) => setEq({ ...eq, modelo: e.target.value })} />
              <input className={inputCls} placeholder="N° serie" value={eq.numeroSerie} onChange={(e) => setEq({ ...eq, numeroSerie: e.target.value })} />
              <input className={inputCls + " col-span-2"} placeholder="Observaciones" value={eq.observaciones} onChange={(e) => setEq({ ...eq, observaciones: e.target.value })} />
              <button className={btnSecondary + " col-span-2"}>+ Agregar equipo</button>
            </form>
            <ul className="mt-3 divide-y divide-zinc-100">
              {equipos.map((q) => (
                <li key={q.id} className="py-2 text-sm">
                  <span className="font-medium">{q.tipo} {q.marca} {q.modelo}</span>
                  <span className="text-zinc-600"> {q.numeroSerie ? `· S/N ${q.numeroSerie}` : ""}</span>
                </li>
              ))}
              {equipos.length === 0 && <p className="py-2 text-sm text-zinc-600">Sin equipos aún.</p>}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
