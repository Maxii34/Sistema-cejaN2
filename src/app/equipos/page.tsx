"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Empty, btnPrimary, inputCls } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import type { ApiEnvelope, Equipo } from "@/lib/types";

export default function EquiposPage() {
  const { usuario, cargando } = useRequireAuth();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [fotos, setFotos] = useState<Record<number, string | null>>({});

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        const res = await api.get<ApiEnvelope<Equipo[]>>("/api/equipo");
        setEquipos(res.data);
        // recuperar previews locales pendientes
        const map: Record<number, string | null> = {};
        for (const q of res.data) {
          try {
            const v = localStorage.getItem(`equipo-img:${q.id}`);
            if (v) map[q.id] = v;
          } catch {
            // noop
          }
        }
        setFotos(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar equipos");
      } finally {
        setCargandoLista(false);
      }
    })();
  }, [usuario]);

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  const filtrados = equipos.filter((q) =>
    `${q.tipo} ${q.marca} ${q.modelo} ${q.numeroSerie ?? ""} ${q.cliente?.nombre ?? ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader
          titulo="Equipos"
          descripcion="Aparatos recibidos. Cada tarjeta permite subir foto (maqueta local hasta que el backend lo soporte)."
          accion={
            <Link href="/clientes" className={btnPrimary}>
              Ir a clientes
            </Link>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <input
          className={inputCls + " mb-4 max-w-md"}
          placeholder="Buscar por tipo, marca, modelo, serie o cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {cargandoLista ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <Empty mensaje="Sin equipos" detalle="Primero creá un cliente y agregale equipos." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((q) => (
              <Card key={q.id}>
                {fotos[q.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fotos[q.id]!}
                    alt={`${q.tipo} ${q.marca}`}
                    className="mb-3 h-36 w-full rounded-lg border border-zinc-200 object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-36 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
                    Sin foto
                  </div>
                )}
                <p className="font-semibold text-zinc-900">
                  {q.tipo} · {q.marca} {q.modelo}
                </p>
                <p className="text-xs text-zinc-500">
                  Cliente: {q.cliente ? `${q.cliente.nombre} ${q.cliente.apellido ?? ""}` : `#${q.clienteId}`}
                  {q.numeroSerie ? ` · S/N ${q.numeroSerie}` : ""}
                </p>
                {q.observaciones && (
                  <p className="mt-1 text-xs text-zinc-600">{q.observaciones}</p>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-zinc-700 hover:underline">
                    Subir / cambiar foto (maqueta)
                  </summary>
                  <div className="mt-2">
                    <ImageUploader
                      equipoKey={String(q.id)}
                      value={fotos[q.id] ?? null}
                      onChange={(v) => setFotos((p) => ({ ...p, [q.id]: v }))}
                    />
                  </div>
                </details>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
