"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiCamera, FiPlus, FiSave, FiUser } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import {
  recepcionAPayload,
  recepcionFormSchema,
  type RecepcionFormValues,
} from "@/lib/validaciones";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, btnPrimary, btnSecondary, inputCls, IconTile, CargandoPagina } from "@/components/ui";
import { Field } from "@/components/Field";
import { Reveal } from "@/components/motion";
import { ImageUploader } from "@/components/ImageUploader";
import type { ApiEnvelope, Cliente, Equipo, OrdenReparacion, Paged } from "@/lib/types";

function NuevaOrdenForm() {
  const { usuario, cargando } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenReparacion[]>([]);
  const {
    register: registerRec,
    handleSubmit: handleRec,
    setValue: setRec,
    watch: watchRec,
    formState: { errors: erroresRec, isSubmitting: guardando },
  } = useForm<RecepcionFormValues>({
    resolver: zodResolver(recepcionFormSchema),
    defaultValues: {
      clienteId: "",
      equipoId: "",
      fallaReportada: "",
      accesorios: "",
      costoEstimado: "",
      detalleCondicion: "",
      modoGarantia: false,
    },
  });
  const clienteIdVivo = watchRec("clienteId");
  const equipoIdVivo = watchRec("equipoId");
  const modoGarantia = watchRec("modoGarantia");
  const clienteId = clienteIdVivo === "" || clienteIdVivo == null ? "" : Number(clienteIdVivo);
  const equipoId = equipoIdVivo === "" ? "" : Number(equipoIdVivo);
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        // Carga única: clientes y TODOS los equipos (ya traen cliente
        // incluido). El filtrado por cliente se hace en el front para
        // evitar el fetch dependiente que dejaba el select vacío.
        const [rc, re, ro] = await Promise.all([
          api.get<ApiEnvelope<Cliente[]>>("/api/cliente"),
          api.get<ApiEnvelope<Paged<Equipo> | Equipo[]>>("/api/equipo"),
          api.get<ApiEnvelope<Paged<OrdenReparacion> | OrdenReparacion[]>>("/api/orden-reparacion"),
        ]);
        setClientes(rc.data);
        const listaEq = Array.isArray(re.data) ? re.data : re.data.data;
        setEquipos(listaEq);
        const listaOr = Array.isArray(ro.data) ? ro.data : ro.data.data;
        setOrdenes(listaOr);
        // Preselección desde Historial (?equipoId=): equipo + su cliente
        const pre = searchParams.get("equipoId");
        if (pre) {
          const q = listaEq.find((e) => e.id === Number(pre));
          if (q) {
            setRec("equipoId", String(q.id));
            setRec("clienteId", String(q.clienteId));
            // Modo garantía (?garantia=1) solo si hay origen vigente
            if (searchParams.get("garantia") === "1") {
              const ords = listaOr.filter((o) => o.equipoId === q.id);
              const ent = ords.find((o) => o.estado === "ENTREGADO" && o.fechaEntrega);
              if (ent?.fechaEntrega) {
                const limite = new Date(ent.fechaEntrega);
                limite.setDate(limite.getDate() + (ent.garantiaDias ?? 90));
                if (limite.getTime() >= Date.now()) setRec("modoGarantia", true);
              }
            }
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

  const elegirEquipo = (id: string) => {
    setRec("equipoId", id);
    setRec("modoGarantia", false);
    // Si el equipo es de otro cliente, se ajusta el cliente solo
    if (id !== "") {
      const q = equipos.find((e) => e.id === Number(id));
      if (q && q.clienteId !== clienteId) setRec("clienteId", String(q.clienteId));
    }
  };

  // Órdenes del equipo elegido: abierta (bloquea) u origen de garantía
  const ordenesDelEquipo = useMemo(
    () => (equipoId === "" ? [] : ordenes.filter((o) => o.equipoId === equipoId)),
    [ordenes, equipoId]
  );
  const ordenAbierta = useMemo(
    () => ordenesDelEquipo.find((o) => !["ENTREGADO", "CANCELADO"].includes(o.estado)) ?? null,
    [ordenesDelEquipo]
  );
  const origenGarantia = useMemo(() => {
    const ent = ordenesDelEquipo.find((o) => o.estado === "ENTREGADO" && o.fechaEntrega);
    if (!ent?.fechaEntrega) return null;
    const limite = new Date(ent.fechaEntrega);
    limite.setDate(limite.getDate() + (ent.garantiaDias ?? 90));
    return limite.getTime() >= Date.now() ? ent : null;
  }, [ordenesDelEquipo]);

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

  const guardar = async (values: RecepcionFormValues) => {
    if (guardando) return;
    if (ordenAbierta) {
      setError(`Este equipo ya tiene la orden ${ordenAbierta.numero} abierta. Abrila para continuar ahí.`);
      return;
    }
    if (values.modoGarantia && !origenGarantia) {
      setError("Ya no hay garantía vigente para este equipo. Desactivá el modo garantía.");
      return;
    }
    setError(null);
    try {
      const res = await api.post<ApiEnvelope<{ id: number }>>(
        "/api/orden-reparacion",
        recepcionAPayload(values, {
          origenGarantiaId: origenGarantia?.id ?? null,
          tecnicoId: usuario?.id ?? null,
          creadoPorId: usuario?.id ?? null,
        })
      );
      // Si hay foto local, se sube a la orden recién creada (Cloudinary)
      let fotoPendiente = false;
      if (foto) {
        try {
          const blob = await (await fetch(foto)).blob();
          const archivo = new File([blob], `recepcion-${res.data.id}.jpg`, {
            type: blob.type || "image/jpeg",
          });
          await api.postFotos(`/api/orden-reparacion/${res.data.id}/fotos`, [archivo]);
          try {
            localStorage.removeItem(`equipo-img:${equipoId}`);
          } catch {
            // noop
          }
        } catch {
          // La orden ya existe: la foto queda local y se avisa en la ficha
          try {
            localStorage.setItem(`equipo-img:${equipoId}`, foto);
          } catch {
            // noop
          }
          fotoPendiente = true;
        }
      }
      router.push(
        `/ordenes/${res.data.id}${fotoPendiente ? "?fotoPendiente=1" : ""}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la orden");
    }
  };

  if (cargando || !usuario) return <CargandoPagina />;

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
        <form onSubmit={(e) => void handleRec(guardar)(e)} noValidate className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <Reveal><Card>
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="blue"><FiUser size={16} /></IconTile> 1 · Cliente y equipo
            </h2>
            <div className="mt-3 space-y-2">
              <div>
                <label htmlFor="recepcion-cliente" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Cliente *</label>
                <select
                  id="recepcion-cliente"
                  className={inputCls}
                  required
                  {...registerRec("clienteId", {
                    onChange: (e) => {
                      setRec("clienteId", e.target.value);
                      setRec("equipoId", "");
                    },
                  })}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellido ?? ""}</option>
                  ))}
                </select>
              </div>
              <Field id="recepcion-equipo" label="Equipo (N° de serie)" required error={erroresRec.equipoId?.message}>
                <select
                  id="recepcion-equipo"
                  className={inputCls}
                  required
                  {...registerRec("equipoId", {
                    onChange: (e) => elegirEquipo(e.target.value),
                  })}
                >
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
              </Field>
              {equipoElegido && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-sm">
                  <p className="font-bold text-stone-900">
                    {equipoElegido.tipo} · {equipoElegido.marca} {equipoElegido.modelo}
                  </p>
                  <div className="mt-1 space-y-0.5 break-words text-[13px] text-stone-600">
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
                  </div>
                </div>
              )}
              {ordenAbierta && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm ring-1 ring-inset ring-amber-200">
                  <p className="font-bold text-amber-900">
                    Este equipo ya ingresó: orden {ordenAbierta.numero}
                  </p>
                  <p className="mt-0.5 text-[13px] text-amber-800">
                    Está abierta y no se puede crear otra recepción. Continuá en la orden existente.
                  </p>
                  <Link
                    href={`/ordenes/${ordenAbierta.id}`}
                    className="mt-2 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white active:bg-amber-700"
                  >
                    Abrir {ordenAbierta.numero}
                  </Link>
                </div>
              )}
              {!ordenAbierta && origenGarantia && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm ring-1 ring-inset ring-emerald-200">
                  <p className="font-bold text-emerald-900">
                    Garantía vigente de {origenGarantia.numero}
                  </p>
                  <p className="mt-0.5 text-[13px] text-emerald-800">
                    Entregada el {origenGarantia.fechaEntrega ? new Date(origenGarantia.fechaEntrega).toLocaleDateString("es-AR") : "—"}.
                  </p>
                  <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-2.5 font-semibold text-emerald-900">
                    <input
                      type="checkbox"
                      className="h-5 w-5 shrink-0 accent-emerald-700"
                      {...registerRec("modoGarantia")}
                    />
                    Ingresar por garantía
                  </label>
                </div>
              )}
              <Field id="recepcion-falla" label="Falla reportada" required error={erroresRec.fallaReportada?.message}>
                <textarea id="recepcion-falla" className={inputCls} rows={3} required placeholder="Ej: No enfría, hace ruido..." {...registerRec("fallaReportada")} />
              </Field>
              <Field id="recepcion-accesorios" label="Accesorios que deja el cliente" error={erroresRec.accesorios?.message}>
                <textarea id="recepcion-accesorios" className={inputCls} rows={2} placeholder="Ej: Control remoto, cable, funda..." {...registerRec("accesorios")} />
              </Field>
              <Field id="recepcion-costo" label="Costo estimado ($)" error={erroresRec.costoEstimado?.message}>
                <input id="recepcion-costo" className={inputCls} type="number" min="0" step="0.01" {...registerRec("costoEstimado")} />
              </Field>
            </div>
          </Card>
          </Reveal>
          <Reveal delay={0.08} className="min-w-0 space-y-3 sm:space-y-4">
            <Card>
              <h2 className="flex items-center gap-2 font-bold text-stone-900">
                <IconTile tono="brand"><FiCamera size={16} /></IconTile> 2 · Estado físico y foto
              </h2>
              <div className="mt-3">
                <Field id="recepcion-condicion" label="Condición física del equipo (comentario)" error={erroresRec.detalleCondicion?.message}>
                  <textarea id="recepcion-condicion" className={inputCls + " mt-1"} rows={3} placeholder="Ej: Buen estado general, rayón en la tapa, falta una perilla..." {...registerRec("detalleCondicion")} />
                </Field>
              </div>
              <div className="mt-3">
                <ImageUploader equipoKey={equipoId ? `nuevo-${equipoId}` : "nuevo"} value={foto} onChange={setFoto} />
              </div>
              <button className={btnPrimary + " mt-4 w-full gap-2"} disabled={guardando || !!ordenAbierta}>
                <FiSave size={15} />
                {guardando ? "Guardando..." : modoGarantia ? "Crear ingreso por garantía" : "Crear orden de reparación"}
              </button>
            </Card>
          </Reveal>
        </form>
      </main>
    </div>
  );
}

export default function NuevaOrdenPage() {
  return (
    <Suspense fallback={<CargandoPagina />}>
      <NuevaOrdenForm />
    </Suspense>
  );
}
