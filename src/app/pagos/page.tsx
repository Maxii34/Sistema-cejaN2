"use client";

import { useEffect, useState } from "react";
import { FiDollarSign, FiPlus } from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Empty, btnPrimary, inputCls } from "@/components/ui";
import type { ApiEnvelope, MedioPago, OrdenReparacion, Pago, Paged } from "@/lib/types";

const MEDIOS: MedioPago[] = ["EFECTIVO", "TRANSFERENCIA", "TARJETA_DEBITO", "TARJETA_CREDITO", "MERCADO_PAGO", "OTRO"];

export default function PagosPage() {
  const { usuario, cargando } = useRequireAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ordenId, setOrdenId] = useState("");
  const [monto, setMonto] = useState("");
  const [medio, setMedio] = useState<MedioPago>("EFECTIVO");
  const [obs, setObs] = useState("");

  const cargar = async () => {
    const p = await api.get<ApiEnvelope<Paged<Pago> | Pago[]>>("/api/pago");
    setPagos(Array.isArray(p.data) ? p.data : p.data.data);
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
      await api.post("/api/pago", {
        ordenId: Number(ordenId),
        monto: Number(monto),
        medioPago: medio,
        observaciones: obs.trim() || null,
        registradoPorId: usuario?.id ?? null,
      });
      setOrdenId(""); setMonto(""); setObs("");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar pago");
    }
  };

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  const total = pagos.reduce((a, p) => a + Number(p.monto), 0);

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader titulo="Pagos" descripcion={`Total cobrado: $${total.toFixed(2)}`} />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            {pagos.length === 0 ? <Empty mensaje="Sin pagos" /> : (
              <ul className="divide-y divide-zinc-100 text-sm">
                {pagos.map((p) => (
                  <li key={p.id} className="flex justify-between py-2">
                    <span>Orden #{p.ordenId} · {p.medioPago} · {new Date(p.fecha).toLocaleDateString()}</span>
                    <b>${Number(p.monto).toFixed(2)}</b>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-semibold">
              <FiDollarSign size={16} /> Registrar cobro
            </h2>
            <form onSubmit={(e) => void crear(e)} className="mt-2 space-y-2">
              <select className={inputCls} required value={ordenId} onChange={(e) => setOrdenId(e.target.value)}>
                <option value="">Orden...</option>
                {ordenes.map((o) => <option key={o.id} value={o.id}>{o.numero} · ${o.precioFinal != null ? Number(o.precioFinal).toFixed(2) : "s/p"}</option>)}
              </select>
              <input className={inputCls} required type="number" min="0.01" step="0.01" placeholder="Monto *" value={monto} onChange={(e) => setMonto(e.target.value)} />
              <select className={inputCls} value={medio} onChange={(e) => setMedio(e.target.value as MedioPago)}>
                {MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input className={inputCls} placeholder="Observaciones" value={obs} onChange={(e) => setObs(e.target.value)} />
              <button className={btnPrimary + " w-full gap-2"}>
                <FiPlus size={15} /> Registrar
              </button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
