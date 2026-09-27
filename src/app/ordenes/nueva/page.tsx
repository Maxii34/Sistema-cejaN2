"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCamera, FiPenTool, FiSave, FiUser } from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import type { ApiEnvelope, Cliente, CondicionFisica, Equipo } from "@/lib/types";
import { CONDICION_LABEL } from "@/lib/types";

const CONDICIONES = Object.keys(CONDICION_LABEL) as CondicionFisica[];

export default function NuevaOrdenPage() {
  const { usuario, cargando } = useRequireAuth();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clienteId, setClienteId] = useState<number | "">("");
  const [equipoId, setEquipoId] = useState<number | "">("");
  const [falla, setFalla] = useState("");
  const [accesorios, setAccesorios] = useState("");
  const [condicion, setCondicion] = useState<CondicionFisica[]>(["BUEN_ESTADO"]);
  const [detalleCond, setDetalleCond] = useState("");
  const [costoEstimado, setCostoEstimado] = useState("");
  const [firmaC, setFirmaC] = useState(false);
  const [firmaT, setFirmaT] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        const res = await api.get<ApiEnvelope<Cliente[]>>("/api/cliente");
        setClientes(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar clientes");
      }
    })();
  }, [usuario]);

  useEffect(() => {
    if (!clienteId) {
      setEquipos([]);
      return;
    }
    (async () => {
      try {
        const res = await api.get<ApiEnvelope<Equipo[]>>(
          `/api/equipo/cliente/${clienteId}`
        );
        setEquipos(res.data);
      } catch {
        setEquipos([]);
      }
    })();
  }, [clienteId]);

  const toggleCond = (c: CondicionFisica) =>
    setCondicion((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoId || condicion.length === 0 || !falla.trim()) {
      setError("Completá cliente, equipo, falla y al menos 1 condición física.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const res = await api.post<ApiEnvelope<{ id: number }>>("/api/orden-reparacion", {
        equipoId: Number(equipoId),
        fallaReportada: falla.trim(),
        accesorios: accesorios.trim() || null,
        condicionFisica: condicion,
        detalleCondicionFisica: detalleCond.trim() || null,
        costoEstimado: costoEstimado ? Number(costoEstimado) : null,
        firmaClienteRecepcion: firmaC,
        firmaTecnicoRecepcion: firmaT,
        tecnicoId: usuario?.id ?? null,
        creadoPorId: usuario?.id ?? null,
      });
      // La foto queda en localStorage como pendiente (maqueta sin backend)
      if (foto) {
        try {
          localStorage.setItem(`equipo-img:${equipoId}`, foto);
        } catch {
          // noop
        }
      }
      router.push(`/ordenes/${res.data.id}`);
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
          titulo="Nueva recepción (ficha 3-A / 3-B / 5)"
          descripcion="Replica la ficha papel: datos del equipo, estado físico, accesorios y firmas."
          accion={
            <button className={btnSecondary + " gap-2"} onClick={() => router.push("/ordenes")}>
              <FiArrowLeft size={15} /> Volver
            </button>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <form onSubmit={(e) => void guardar(e)} className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="flex items-center gap-2 font-semibold">
              <FiUser size={16} /> 1 · Cliente y equipo
            </h2>
            <div className="mt-3 space-y-2">
              <select className={inputCls} value={clienteId} onChange={(e) => { setClienteId(e.target.value ? Number(e.target.value) : ""); setEquipoId(""); }} required>
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.apellido ?? ""}</option>
                ))}
              </select>
              <select className={inputCls} value={equipoId} onChange={(e) => setEquipoId(e.target.value ? Number(e.target.value) : "")} required disabled={!clienteId}>
                <option value="">Seleccionar equipo...</option>
                {equipos.map((q) => (
                  <option key={q.id} value={q.id}>{q.tipo} {q.marca} {q.modelo}</option>
                ))}
              </select>
              <label className="block text-xs font-medium text-zinc-600">Falla reportada *</label>
              <textarea className={inputCls} rows={3} required value={falla} onChange={(e) => setFalla(e.target.value)} placeholder="Ej: No enfría, hace ruido..." />
              <label className="block text-xs font-medium text-zinc-600">Accesorios incluidos / Otros (3-B)</label>
              <textarea className={inputCls} rows={2} value={accesorios} onChange={(e) => setAccesorios(e.target.value)} placeholder="Ej: Control remoto, cable, funda..." />
              <label className="block text-xs font-medium text-zinc-600">Costo estimado ($)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={costoEstimado} onChange={(e) => setCostoEstimado(e.target.value)} />
            </div>
          </Card>
          <div className="space-y-4">
            <Card>
              <h2 className="flex items-center gap-2 font-semibold">
                <FiCamera size={16} /> 2 · Condición física (3-A)
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {CONDICIONES.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                    <input type="checkbox" checked={condicion.includes(c)} onChange={() => toggleCond(c)} />
                    {CONDICION_LABEL[c]}
                  </label>
                ))}
              </div>
              <textarea className={inputCls + " mt-2"} rows={2} value={detalleCond} onChange={(e) => setDetalleCond(e.target.value)} placeholder="Detalle de condición física..." />
              <div className="mt-3">
                <ImageUploader equipoKey={equipoId ? `nuevo-${equipoId}` : "nuevo"} value={foto} onChange={setFoto} />
              </div>
            </Card>
            <Card>
              <h2 className="flex items-center gap-2 font-semibold">
                <FiPenTool size={16} /> 3 · Conformidad de recepción (5)
              </h2>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={firmaC} onChange={(e) => setFirmaC(e.target.checked)} />
                Firma cliente recepción
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={firmaT} onChange={(e) => setFirmaT(e.target.checked)} />
                Firma técnico recepción
              </label>
              <button className={btnPrimary + " mt-4 w-full gap-2"} disabled={guardando}>
                <FiSave size={15} />
                {guardando ? "Guardando..." : "Crear orden de reparación"}
              </button>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}
