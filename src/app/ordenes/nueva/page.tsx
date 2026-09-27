"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiCamera, FiPlus, FiSave, FiUser } from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, btnPrimary, btnSecondary, inputCls, IconTile } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import type { ApiEnvelope, Cliente, Equipo, Paged } from "@/lib/types";

// El backend exige al menos 1 condición física, como ahora es solo
// comentario se envía un valor neutro fijo.
const CONDICION_FIJA = ["BUEN_ESTADO"] as const;

function NuevaOrdenForm() {
  const { usuario, cargando } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clienteId, setClienteId] = useState<number | "">("");
  const [equipoId, setEquipoId] = useState<number | "">("");
  const [falla, setFalla] = useState("");
  const [accesorios, setAccesorios] = useState("");
  const [detalleCond, setDetalleCond] = useState("");
  const [costoEstimado, setCostoEstimado] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        // Carga única: clientes y TODOS los equipos (ya traen cliente
        // incluido). El filtrado por cliente se hace en el front para
        // evitar el fetch dependiente que dejaba el select vacío.
        const [rc, re] = await Promise.all([
          api.get<ApiEnvelope<Cliente[]>>("/api/cliente"),
          api.get<ApiEnvelope<Paged<Equipo> | Equipo[]>>("/api/equipo"),
        ]);
        setClientes(rc.data);
        const listaEq = Array.isArray(re.data) ? re.data : re.data.data;
        setEquipos(listaEq);
        // Preselección desde Historial (?equipoId=): equipo + su cliente
        const pre = searchParams.get("equipoId");
        if (pre) {
          const q = listaEq.find((e) => e.id === Number(pre));
          if (q) {
            setEquipoId(q.id);
            setClienteId(q.clienteId);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar datos");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  // Equipos del cliente elegido (o todos si aún no eligió)
  const equiposVisibles = useMemo(
    () =>
      clienteId === ""
        ? equipos
        : equipos.filter((q) => q.clienteId === clienteId),
    [equipos, clienteId]
  );

  const elegirEquipo = (id: number | "") => {
    setEquipoId(id);
    // Si el equipo es de otro cliente, se ajusta el cliente solo
    if (id !== "") {
      const q = equipos.find((e) => e.id === id);
      if (q && q.clienteId !== clienteId) setClienteId(q.clienteId);
    }
  };

  // Equipo elegido con su info completa para confirmar visualmente
  const equipoElegido = useMemo(
    () => (equipoId === "" ? null : (equipos.find((e) => e.id === equipoId) ?? null)),
    [equipos, equipoId]
  );
  const clienteDelEquipo = useMemo(() => {
    if (!equipoElegido) return null;
    return (
      equipoElegido.cliente ??
      clientes.find((c) => c.id === equipoElegido.clienteId) ??
      null
    );
  }, [equipoElegido, clientes]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoId || !falla.trim()) {
      setError("Completá cliente, equipo y falla reportada.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const res = await api.post<ApiEnvelope<{ id: number }>>("/api/orden-reparacion", {
        equipoId: Number(equipoId),
        fallaReportada: falla.trim(),
        accesorios: accesorios.trim() || null,
        condicionFisica: [...CONDICION_FIJA],
        detalleCondicionFisica: detalleCond.trim() || null,
        costoEstimado: costoEstimado ? Number(costoEstimado) : null,
        firmaClienteRecepcion: false,
        firmaTecnicoRecepcion: false,
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
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader
          eyebrow="Paso 1 · Recepción"
          titulo="Nueva recepción"
          descripcion="Elegí cliente y equipo, describí la falla y el estado físico del aparato."
          accion={
            <button className={btnSecondary + " gap-2"} onClick={() => router.push("/ingreso")}>
              <FiArrowLeft size={15} /> Volver
            </button>
          }
        />
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <form onSubmit={(e) => void guardar(e)} className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="blue"><FiUser size={16} /></IconTile> 1 · Cliente y equipo
            </h2>
            <div className="mt-3 space-y-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Cliente *</label>
                <select className={inputCls} value={clienteId} onChange={(e) => { setClienteId(e.target.value ? Number(e.target.value) : ""); setEquipoId(""); }} required>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellido ?? ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Equipo (N° de serie) *</label>
                <select className={inputCls} value={equipoId} onChange={(e) => elegirEquipo(e.target.value ? Number(e.target.value) : "")} required>
                  <option value="">
                    {equiposVisibles.length === 0
                      ? "Sin equipos"
                      : "Seleccionar N° de serie..."}
                  </option>
                  {equiposVisibles.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.numeroSerie ? `S/N ${q.numeroSerie}` : `Equipo #${q.id}`}
                    </option>
                  ))}
                </select>
                {clienteId !== "" && equiposVisibles.length === 0 && (
                  <Link
                    href={`/clientes/${clienteId}`}
                    className="mt-1.5 inline-flex min-h-[40px] items-center gap-1 text-[13px] font-semibold text-blue-700 hover:underline"
                  >
                    <FiPlus size={14} /> Crear un equipo en la ficha del cliente
                  </Link>
                )}
              </div>
              {equipoElegido && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-sm">
                  <p className="font-bold text-stone-900">
                    {equipoElegido.tipo} · {equipoElegido.marca} {equipoElegido.modelo}
                  </p>
                  <dl className="mt-1 space-y-0.5 break-words text-[13px] text-stone-600">
                    <p><b className="text-stone-800">Serie:</b> {equipoElegido.numeroSerie ?? "—"}</p>
                    <p>
                      <b className="text-stone-800">Cliente:</b>{" "}
                      {clienteDelEquipo
                        ? `${clienteDelEquipo.nombre} ${clienteDelEquipo.apellido ?? ""}`.trim()
                        : `#${equipoElegido.clienteId}`}
                    </p>
                    {equipoElegido.observaciones && (
                      <p><b className="text-stone-800">Obs:</b> {equipoElegido.observaciones}</p>
                    )}
                  </dl>
                </div>
              )}
              <label className="block text-xs font-medium text-zinc-600">Falla reportada *</label>
              <textarea className={inputCls} rows={3} required value={falla} onChange={(e) => setFalla(e.target.value)} placeholder="Ej: No enfría, hace ruido..." />
              <label className="block text-xs font-medium text-zinc-600">Accesorios incluidos / Otros (3-B)</label>
              <textarea className={inputCls} rows={2} value={accesorios} onChange={(e) => setAccesorios(e.target.value)} placeholder="Ej: Control remoto, cable, funda..." />
              <label className="block text-xs font-medium text-zinc-600">Costo estimado ($)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={costoEstimado} onChange={(e) => setCostoEstimado(e.target.value)} />
            </div>
          </Card>
          <div className="min-w-0 space-y-3 sm:space-y-4">
            <Card>
              <h2 className="flex items-center gap-2 font-bold text-stone-900">
                <IconTile tono="brand"><FiCamera size={16} /></IconTile> 2 · Estado físico y foto
              </h2>
              <label className="mt-3 block text-xs font-medium text-zinc-600">
                Condición física del equipo (comentario)
              </label>
              <textarea className={inputCls + " mt-1"} rows={3} value={detalleCond} onChange={(e) => setDetalleCond(e.target.value)} placeholder="Ej: Buen estado general, rayón en la tapa, falta una perilla..." />
              <div className="mt-3">
                <ImageUploader equipoKey={equipoId ? `nuevo-${equipoId}` : "nuevo"} value={foto} onChange={setFoto} />
              </div>
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

export default function NuevaOrdenPage() {
  return (
    <Suspense fallback={<p className="p-8">Cargando...</p>}>
      <NuevaOrdenForm />
    </Suspense>
  );
}
