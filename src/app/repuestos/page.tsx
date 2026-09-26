"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Badge, Empty, btnPrimary, inputCls } from "@/components/ui";
import type { ApiEnvelope, Repuesto, OrdenReparacion, Paged } from "@/lib/types";

export default function RepuestosPage() {
  const { usuario, cargando } = useRequireAuth();
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [costo, setCosto] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("0");

  // asignar a orden
  const [ordenId, setOrdenId] = useState("");
  const [repId, setRepId] = useState("");
  const [cant, setCant] = useState("1");

  const cargar = async () => {
    const r = await api.get<ApiEnvelope<Repuesto[]>>("/api/repuesto");
    setRepuestos(r.data);
    const o = await api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>("/api/orden-reparacion");
    setOrdenes(Array.isArray(o.data) ? o.data : o.data.data);
  };

  useEffect(() => {
    if (!usuario) return;
    cargar().catch((e) => setError(e instanceof Error ? e.message : "Error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/repuesto", {
        nombre: nombre.trim(),
        costo: Number(costo),
        precioVenta: precio ? Number(precio) : null,
        stock: Number(stock),
      });
      setNombre(""); setCosto(""); setPrecio(""); setStock("0");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear");
    }
  };

  const asignar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rep = repuestos.find((r) => r.id === Number(repId));
      if (!rep) return;
      await api.post("/api/repuesto-usado", {
        ordenId: Number(ordenId),
        repuestoId: Number(repId),
        cantidad: Number(cant),
        costoUnitario: Number(rep.costo),
        precioUnitario: Number(rep.precioVenta ?? rep.costo),
      });
      setOrdenId(""); setRepId(""); setCant("1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo asignar");
    }
  };

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader titulo="Repuestos" descripcion="Stock y asignación de repuestos a órdenes." />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            {repuestos.length === 0 ? <Empty mensaje="Sin repuestos" /> : (
              <ul className="divide-y divide-zinc-100">
                {repuestos.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{r.nombre}</p>
                      <p className="text-xs text-zinc-600">Costo ${Number(r.costo).toFixed(2)} · Venta ${r.precioVenta != null ? Number(r.precioVenta).toFixed(2) : "—"}</p>
                    </div>
                    <Badge tono={r.stock > 0 ? "green" : "red"}>Stock {r.stock}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="space-y-4">
            <Card>
              <h2 className="font-semibold">Nuevo repuesto</h2>
              <form onSubmit={(e) => void crear(e)} className="mt-2 space-y-2">
                <input className={inputCls} required placeholder="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputCls} required type="number" min="0" step="0.01" placeholder="Costo" value={costo} onChange={(e) => setCosto(e.target.value)} />
                  <input className={inputCls} type="number" min="0" step="0.01" placeholder="Venta" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                  <input className={inputCls} type="number" min="0" step="1" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
                <button className={btnPrimary + " w-full"}>Guardar</button>
              </form>
            </Card>
            <Card>
              <h2 className="font-semibold">Asignar a orden</h2>
              <form onSubmit={(e) => void asignar(e)} className="mt-2 space-y-2">
                <select className={inputCls} value={ordenId} onChange={(e) => setOrdenId(e.target.value)} required>
                  <option value="">Orden...</option>
                  {ordenes.map((o) => <option key={o.id} value={o.id}>{o.numero}</option>)}
                </select>
                <select className={inputCls} value={repId} onChange={(e) => setRepId(e.target.value)} required>
                  <option value="">Repuesto...</option>
                  {repuestos.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                <input className={inputCls} type="number" min="1" step="1" value={cant} onChange={(e) => setCant(e.target.value)} />
                <button className={btnPrimary + " w-full"}>Asignar</button>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
