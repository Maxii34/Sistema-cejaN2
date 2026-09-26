"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Badge, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import type { ApiEnvelope, EstadoOrden, OrdenReparacion, Usuario } from "@/lib/types";
import { ESTADO_ORDEN_LABEL, CONDICION_LABEL } from "@/lib/types";

export default function OrdenDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { usuario, cargando } = useRequireAuth();
  const router = useRouter();
  const [orden, setOrden] = useState<OrdenReparacion | null>(null);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);

  // edición técnica
  const [diag, setDiag] = useState("");
  const [pruebas, setPruebas] = useState("");
  const [reco, setReco] = useState("");
  const [reparacion, setReparacion] = useState("");
  const [mano, setMano] = useState("");
  const [precio, setPrecio] = useState("");
  const [estado, setEstado] = useState<EstadoOrden>("RECIBIDO");
  const [tecnicoId, setTecnicoId] = useState<string>("");
  const [autorizado, setAutorizado] = useState(false);
  const [conformidad, setConformidad] = useState(false);

  const cargar = async () => {
    const res = await api.get<ApiEnvelope<OrdenReparacion>>(`/api/orden-reparacion/${id}`);
    setOrden(res.data);
    setDiag(res.data.diagnostico ?? "");
    setPruebas(res.data.pruebasRealizadas ?? "");
    setReco(res.data.recomendaciones ?? "");
    setReparacion(res.data.reparacionRealizada ?? "");
    setMano(String(res.data.manoDeObra ?? 0));
    setPrecio(res.data.precioFinal != null ? String(res.data.precioFinal) : "");
    setEstado(res.data.estado);
    setTecnicoId(res.data.tecnicoId ? String(res.data.tecnicoId) : "");
    setAutorizado(res.data.autorizadoCliente);
    setConformidad(res.data.conformidadEntregaCliente);
  };

  useEffect(() => {
    if (!usuario || !id) return;
    (async () => {
      try {
        await cargar();
        const u = await api.get<ApiEnvelope<Usuario[]>>("/api/usuario");
        setTecnicos(u.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar orden");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, id]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/api/orden-reparacion/${id}`, {
        diagnostico: diag || null,
        pruebasRealizadas: pruebas || null,
        recomendaciones: reco || null,
        reparacionRealizada: reparacion || null,
        manoDeObra: mano ? Number(mano) : 0,
        precioFinal: precio ? Number(precio) : null,
        estado,
        tecnicoId: tecnicoId ? Number(tecnicoId) : null,
        autorizadoCliente: autorizado,
        conformidadEntregaCliente: conformidad,
      });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader
          titulo={orden ? `Orden ${orden.numero}` : `Orden #${id}`}
          descripcion={orden ? `${orden.equipo?.tipo ?? ""} ${orden.equipo?.marca ?? ""} ${orden.equipo?.modelo ?? ""} · Falla: ${orden.fallaReportada}` : ""}
          accion={
            <div className="flex gap-2">
              <button className={btnSecondary} onClick={() => router.push("/ordenes")}>← Volver</button>
              {orden && (
                <button className={btnSecondary} onClick={() => window.print()}>Imprimir ficha</button>
              )}
            </div>
          }
        />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {!orden ? (
          <p className="text-sm text-zinc-600">Cargando orden...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <div className="flex flex-wrap gap-2">
                  <Badge tono="blue">{ESTADO_ORDEN_LABEL[orden.estado]}</Badge>
                  <Badge tono={orden.estadoPago === "PAGADO" ? "green" : "amber"}>{orden.estadoPago}</Badge>
                  {orden.autorizadoCliente && <Badge tono="green">Autorizado</Badge>}
                </div>
                <dl className="mt-3 space-y-1 text-sm text-zinc-700">
                  <p><b>Cliente:</b> {orden.equipo?.cliente ? `${orden.equipo.cliente.nombre} ${orden.equipo.cliente.apellido ?? ""}` : `Equipo #${orden.equipoId}`}</p>
                  <p><b>Accesorios:</b> {orden.accesorios || "—"}</p>
                  <p><b>Condición:</b> {orden.condicionFisica.map((c) => CONDICION_LABEL[c]).join(", ")}</p>
                  {orden.detalleCondicionFisica && <p><b>Detalle:</b> {orden.detalleCondicionFisica}</p>}
                  <p><b>Garantía:</b> {orden.garantiaDias} días</p>
                  <p><b>Firmas recepción:</b> cliente {orden.firmaClienteRecepcion ? "✓" : "✗"} · técnico {orden.firmaTecnicoRecepcion ? "✓" : "✗"}</p>
                </dl>
              </Card>
              <Card>
                <h2 className="font-semibold">Diagnóstico y reparación</h2>
                <form onSubmit={(e) => void guardar(e)} className="mt-3 space-y-2">
                  <textarea className={inputCls} rows={2} placeholder="Diagnóstico" value={diag} onChange={(e) => setDiag(e.target.value)} />
                  <textarea className={inputCls} rows={2} placeholder="Pruebas realizadas" value={pruebas} onChange={(e) => setPruebas(e.target.value)} />
                  <textarea className={inputCls} rows={2} placeholder="Recomendaciones" value={reco} onChange={(e) => setReco(e.target.value)} />
                  <textarea className={inputCls} rows={2} placeholder="Reparación realizada" value={reparacion} onChange={(e) => setReparacion(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} type="number" min="0" step="0.01" placeholder="Mano de obra" value={mano} onChange={(e) => setMano(e.target.value)} />
                    <input className={inputCls} type="number" min="0" step="0.01" placeholder="Precio final" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                    <select className={inputCls} value={estado} onChange={(e) => setEstado(e.target.value as EstadoOrden)}>
                      {Object.entries(ESTADO_ORDEN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select className={inputCls} value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)}>
                      <option value="">Sin técnico</option>
                      {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.rol})</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autorizado} onChange={(e) => setAutorizado(e.target.checked)} /> Autorizado por cliente</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={conformidad} onChange={(e) => setConformidad(e.target.checked)} /> Conformidad de entrega</label>
                  <button className={btnPrimary + " w-full"}>Guardar avance</button>
                </form>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <h2 className="font-semibold">Pagos y repuestos</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Precio final: <b>${Number(orden.precioFinal ?? 0).toFixed(2)}</b> · Cobrado: <b>${(orden.pagos ?? []).reduce((a, p) => a + Number(p.monto), 0).toFixed(2)}</b>
                </p>
                <ul className="mt-2 divide-y divide-zinc-100 text-sm">
                  {(orden.pagos ?? []).map((p) => (
                    <li key={p.id} className="py-1.5">${Number(p.monto).toFixed(2)} · {p.medioPago} · {new Date(p.fecha).toLocaleDateString()}</li>
                  ))}
                  {(orden.pagos ?? []).length === 0 && <li className="py-1.5 text-zinc-600">Sin pagos. Cargalos en /pagos.</li>}
                </ul>
                <ul className="mt-2 divide-y divide-zinc-100 text-sm">
                  {(orden.repuestosUsados ?? []).map((r) => (
                    <li key={r.id} className="py-1.5">{r.repuesto?.nombre ?? `Repuesto #${r.repuestoId}`} × {r.cantidad} · ${Number(r.precioUnitario).toFixed(2)} c/u</li>
                  ))}
                  {(orden.repuestosUsados ?? []).length === 0 && <li className="py-1.5 text-zinc-600">Sin repuestos. Cargalos en /repuestos.</li>}
                </ul>
              </Card>
              <Card>
                <h2 className="font-semibold">Historial de estados</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {(orden.historialEstados ?? []).map((h) => (
                    <li key={h.id} className="text-zinc-700">
                      <b>{ESTADO_ORDEN_LABEL[h.estado]}</b> · {new Date(h.fecha).toLocaleString()} {h.comentario ? `— ${h.comentario}` : ""}
                    </li>
                  ))}
                  {(orden.historialEstados ?? []).length === 0 && <li className="text-zinc-600">Sin historial registrado.</li>}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
