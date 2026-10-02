"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiBox,
  FiCalendar,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiInfo,
  FiLock,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { Toast } from "@/lib/toast";
import {
  faseCierreAPayload,
  faseCierreFormSchema,
  faseDiagnosticoAPayload,
  faseDiagnosticoFormSchema,
  faseReparacionAPayload,
  faseReparacionFormSchema,
  type FaseCierreFormValues,
  type FaseDiagnosticoFormValues,
  type FaseReparacionFormValues,
} from "@/lib/validaciones";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { FotosOrden } from "@/components/FotosOrden";
import { Card, PageHeader, Badge, btnPrimary, btnSecondary, inputCls, IconTile, Spinner, CargandoPagina } from "@/components/ui";
import { Field } from "@/components/Field";
import { Reveal } from "@/components/motion";
import type { ApiEnvelope, MedioPago, OrdenReparacion, Usuario } from "@/lib/types";
import { ESTADO_ORDEN_LABEL, CONDICION_LABEL } from "@/lib/types";

const MEDIO_LABEL: Record<MedioPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA_DEBITO: "Débito",
  TARJETA_CREDITO: "Crédito",
  MERCADO_PAGO: "Mercado Pago",
  OTRO: "Otro",
};

function TagOpcional() {
  return (
    <span className="ml-1.5 rounded-full bg-stone-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold normal-case tracking-normal text-stone-500 ring-1 ring-inset ring-stone-200">
      Opcional
    </span>
  );
}

function Req() {
  return (
    <span className="ml-0.5 align-middle font-bold text-red-600" aria-label="obligatorio">
      *
    </span>
  );
}

type FaseKey = "diagnostico" | "autorizacion" | "reparacion" | "cierre";

function FaseCard({
  paso,
  titulo,
  estado,
  resumen,
  children,
}: {
  paso: number;
  titulo: string;
  estado: "lista" | "actual" | "bloqueada";
  resumen?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card className={estado === "bloqueada" ? "opacity-70" : ""}>
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
            estado === "lista"
              ? "bg-emerald-600 text-white"
              : estado === "actual"
                ? "bg-blue-800 text-white"
                : "bg-stone-200 text-stone-500"
          }`}
        >
          {estado === "lista" ? <FiCheck size={16} /> : estado === "bloqueada" ? <FiLock size={14} /> : paso}
        </span>
        <h2 className="min-w-0 flex-1 truncate font-bold text-stone-900">
          {paso}. {titulo}
        </h2>
        <Badge tono={estado === "lista" ? "green" : estado === "actual" ? "blue" : "zinc"}>
          {estado === "lista" ? "Lista" : estado === "actual" ? "Actual" : "Bloqueada"}
        </Badge>
      </div>
      {estado === "actual" && children && <div className="mt-3">{children}</div>}
      {estado === "lista" && resumen && (
        <div className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-[13px] text-stone-600 ring-1 ring-inset ring-stone-200/60">
          {resumen}
        </div>
      )}
      {estado === "bloqueada" && (
        <p className="mt-2 text-xs text-stone-400">Se desbloquea al completar la fase anterior.</p>
      )}
    </Card>
  );
}

export default function OrdenDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { usuario, cargando, esAdmin } = useRequireAuth();
  const router = useRouter();
  const [orden, setOrden] = useState<OrdenReparacion | null>(null);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);

  // formularios por fase (precarga con reset al cargar la orden)
  const {
    register: registerDiag,
    handleSubmit: handleDiag,
    reset: resetDiag,
    watch: watchDiag,
    formState: { errors: erroresDiag },
  } = useForm<FaseDiagnosticoFormValues>({
    resolver: zodResolver(faseDiagnosticoFormSchema),
    defaultValues: { diagnostico: "", pruebasRealizadas: "", tecnicoId: "" },
  });
  const {
    register: registerRep,
    handleSubmit: handleRep,
    reset: resetRep,
    formState: { errors: erroresRep },
  } = useForm<FaseReparacionFormValues>({
    resolver: zodResolver(faseReparacionFormSchema),
    defaultValues: { reparacionRealizada: "", manoDeObra: "", recomendaciones: "" },
  });
  const {
    register: registerCierre,
    handleSubmit: handleCierre,
    reset: resetCierre,
    watch: watchCierre,
    formState: { errors: erroresCierre },
  } = useForm<FaseCierreFormValues>({
    resolver: zodResolver(faseCierreFormSchema),
    defaultValues: { precioFinal: "", conformidadEntregaCliente: true },
  });
  const tecnicoIdVivo = watchDiag("tecnicoId");
  const precioVivo = watchCierre("precioFinal");
  const [faseEnCurso, setFaseEnCurso] = useState<FaseKey | null>(null);

  const cargar = async () => {
    const res = await api.get<ApiEnvelope<OrdenReparacion>>(`/api/orden-reparacion/${id}`);
    setOrden(res.data);
    resetDiag({
      diagnostico: res.data.diagnostico ?? "",
      pruebasRealizadas: res.data.pruebasRealizadas ?? "",
      tecnicoId: res.data.tecnicoId ? String(res.data.tecnicoId) : tecnicoIdVivo,
    });
    resetRep({
      reparacionRealizada: res.data.reparacionRealizada ?? "",
      manoDeObra: String(res.data.manoDeObra ?? 0),
      recomendaciones: res.data.recomendaciones ?? "",
    });
    // Si aún no hay precio final, sugerir la mano de obra para que no quede en 0.
    // El usuario puede ajustarlo antes de Cerrar y entregar.
    resetCierre({
      precioFinal:
        res.data.precioFinal != null
          ? String(res.data.precioFinal)
          : Number(res.data.manoDeObra ?? 0) > 0
            ? String(res.data.manoDeObra)
            : "",
      conformidadEntregaCliente: res.data.conformidadEntregaCliente,
    });
    return res.data;
  };

  useEffect(() => {
    if (!usuario || !id) return;
    (async () => {
      try {
        const od = await cargar();
        // Aviso cuando la foto de recepción no se pudo subir sola
        if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fotoPendiente") === "1") {
          void Toast.fire({
            icon: "info",
            title: "Foto pendiente",
            text: "La foto no se pudo subir. Agregala desde Fotos de evidencia.",
          });
          router.replace(`/ordenes/${id}`);
        }
        if (esAdmin) {
          const u = await api.get<ApiEnvelope<Usuario[]>>("/api/usuario");
          setTecnicos(u.data);
        } else if (!od.tecnicoId) {
          // El técnico se autoasigna: no necesita el listado (solo ADMIN)
          resetDiag({
            diagnostico: od.diagnostico ?? "",
            pruebasRealizadas: od.pruebasRealizadas ?? "",
            tecnicoId: String(usuario.id),
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar orden");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, id]);

  const trasGuardar = async (titulo: string, texto: string) => {
    await cargar();
    void Toast.fire({ icon: "success", title: titulo, text: texto });
  };

  const fallaGuardar = (e: unknown, titulo = "No se pudo guardar") => {
    const mensaje = e instanceof Error ? e.message : titulo;
    setError(mensaje);
    void Toast.fire({ icon: "error", title: titulo, text: mensaje });
  };

  const guardarDiagnostico = async (values: FaseDiagnosticoFormValues) => {
    if (faseEnCurso !== null) return;
    setError(null);
    setFaseEnCurso("diagnostico");
    try {
      await api.patch(
        `/api/orden-reparacion/${id}/diagnostico`,
        faseDiagnosticoAPayload(values)
      );
      await trasGuardar("Diagnóstico guardado", "La orden pasó a En diagnóstico.");
    } catch (e) {
      fallaGuardar(e);
    } finally {
      setFaseEnCurso(null);
    }
  };

  const guardarAutorizacion = async (decision: "AUTORIZADO" | "ESPERA_REPUESTO") => {
    setError(null);
    setFaseEnCurso("autorizacion");
    try {
      await api.patch(`/api/orden-reparacion/${id}/autorizacion`, { decision });
      await trasGuardar(
        decision === "AUTORIZADO" ? "Cliente autorizó" : "A la espera de repuesto",
        decision === "AUTORIZADO" ? "La orden pasó a En reparación." : "La orden quedó Esperando repuesto."
      );
    } catch (e) {
      fallaGuardar(e);
    } finally {
      setFaseEnCurso(null);
    }
  };

  const guardarReparacion = async (values: FaseReparacionFormValues) => {
    if (faseEnCurso !== null) return;
    setError(null);
    setFaseEnCurso("reparacion");
    try {
      await api.patch(
        `/api/orden-reparacion/${id}/reparacion`,
        faseReparacionAPayload(values)
      );
      await trasGuardar("Reparación guardada", "La orden quedó Lista.");
    } catch (e) {
      fallaGuardar(e);
    } finally {
      setFaseEnCurso(null);
    }
  };

  const guardarCierre = async (values: FaseCierreFormValues) => {
    if (faseEnCurso !== null) return;
    setError(null);
    setFaseEnCurso("cierre");
    try {
      await api.patch(
        `/api/orden-reparacion/${id}/cierre`,
        faseCierreAPayload(values)
      );
      await trasGuardar("Cierre guardado", "Precio guardado. Ahora podés ir a cobrar esta orden desde el recuadro azul.");
    } catch (e) {
      fallaGuardar(e);
    } finally {
      setFaseEnCurso(null);
    }
  };

  if (cargando || !usuario) return <CargandoPagina />;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader
          eyebrow="Ficha de reparación"
          titulo={orden ? `Orden ${orden.numero}` : `Orden #${id}`}
          descripcion={orden ? `${orden.equipo?.tipo ?? ""} ${orden.equipo?.marca ?? ""} ${orden.equipo?.modelo ?? ""} · Falla: ${orden.fallaReportada}` : ""}
          accion={
            <button
              className={btnSecondary + " gap-2"}
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
            >
              <FiArrowLeft size={15} /> Volver
            </button>
          }
        />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {!orden ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
            <Spinner tamano="md" /> Cargando orden...
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <Reveal className="min-w-0 space-y-3 sm:space-y-4">
              <Card>
                <div className="flex flex-wrap gap-2">
                  <Badge tono="blue">{ESTADO_ORDEN_LABEL[orden.estado]}</Badge>
                  <Badge tono={orden.estadoPago === "PAGADO" ? "green" : "amber"}>{orden.estadoPago}</Badge>
                  {orden.autorizadoCliente && <Badge tono="green">Autorizado</Badge>}
                </div>
                <ul className="mt-3 space-y-2.5 text-sm">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                      <FiUser size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">Cliente</span>
                      <span className="block truncate font-semibold text-stone-800">
                        {orden.equipo?.cliente ? `${orden.equipo.cliente.nombre} ${orden.equipo.cliente.apellido ?? ""}`.trim() : `Equipo #${orden.equipoId}`}
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                      <FiBox size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">Accesorios</span>
                      <span className="block break-words font-semibold text-stone-800">{orden.accesorios || "—"}</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                      <FiInfo size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">Condición</span>
                      <span className="block break-words font-semibold text-stone-800">{orden.condicionFisica.map((c) => CONDICION_LABEL[c]).join(", ")}</span>
                      {orden.detalleCondicionFisica && (
                        <span className="mt-0.5 block break-words text-[13px] font-normal text-stone-500">{orden.detalleCondicionFisica}</span>
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                      <FiShield size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">Garantía</span>
                      <span className="font-ficha block font-bold text-stone-900">{orden.garantiaDias} días</span>
                    </span>
                  </li>
                </ul>
              </Card>
              {(() => {
                const idx = ["EN_DIAGNOSTICO", "ESPERANDO_REPUESTO"].includes(orden.estado)
                  ? 1
                  : orden.estado === "EN_REPARACION"
                    ? 2
                    : orden.estado === "LISTO"
                      ? 3
                      : orden.estado === "RECIBIDO"
                        ? 0
                        : 4;
                const ef = (i: number): "lista" | "actual" | "bloqueada" =>
                  idx > i || idx === 4 ? "lista" : idx === i ? "actual" : "bloqueada";
                const tecNombre = orden.tecnico?.nombre ?? (tecnicoIdVivo && usuario && Number(tecnicoIdVivo) === usuario.id ? usuario.nombre : null);
                return (
                  <>
                    <FaseCard
                      paso={1}
                      titulo="Diagnóstico"
                      estado={ef(0)}
                      resumen={orden.diagnostico ? <><b className="text-stone-800">{orden.diagnostico}</b>{orden.pruebasRealizadas ? ` · ${orden.pruebasRealizadas}` : ""}{tecNombre ? ` · Téc: ${tecNombre}` : ""}</> : "Sin diagnóstico cargado."}
                    >
                      <form onSubmit={(e) => void handleDiag(guardarDiagnostico)(e)} noValidate className="space-y-2">
                        <Field id="fase-diag" label="Diagnóstico" required error={erroresDiag.diagnostico?.message}>
                          <textarea id="fase-diag" className={inputCls} rows={2} placeholder="Ej: Placa con soldadura fría en la fuente..." {...registerDiag("diagnostico")} />
                        </Field>
                        <Field id="fase-pruebas" label="Pruebas realizadas" marca={<TagOpcional />} error={erroresDiag.pruebasRealizadas?.message}>
                          <textarea id="fase-pruebas" className={inputCls} rows={2} placeholder="Ej: Medición de tensión, prueba de encendido..." {...registerDiag("pruebasRealizadas")} />
                        </Field>
                        {esAdmin ? (
                          <Field id="fase-tecnico" label="Técnico a cargo" required error={erroresDiag.tecnicoId?.message}>
                            <select id="fase-tecnico" className={inputCls} value={tecnicoIdVivo} {...registerDiag("tecnicoId")}>
                              <option value="">Seleccionar técnico...</option>
                              {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.rol})</option>)}
                            </select>
                          </Field>
                        ) : (
                          <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-900 ring-1 ring-inset ring-blue-200">
                            Te asignás esta orden: <b>{usuario.nombre}</b>
                          </p>
                        )}
                        <button className={btnPrimary + " w-full gap-2"} disabled={faseEnCurso !== null}>
                          <FiSave size={15} /> {faseEnCurso === "diagnostico" ? "Guardando..." : "Guardar diagnóstico"}
                        </button>
                      </form>
                    </FaseCard>

                    <FaseCard
                      paso={2}
                      titulo="Autorización del cliente"
                      estado={ef(1)}
                      resumen={orden.autorizadoCliente ? <><b className="text-stone-800">Autorizado</b>{orden.fechaAutorizacion ? ` · ${new Date(orden.fechaAutorizacion).toLocaleDateString("es-AR")}` : ""}</> : orden.estado === "ESPERANDO_REPUESTO" ? "A la espera de repuesto." : "Sin autorización."}
                    >
                      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => void guardarAutorizacion("AUTORIZADO")}
                          disabled={faseEnCurso !== null}
                          className={btnPrimary + " gap-2"}
                        >
                          <FiCheck size={16} /> {faseEnCurso === "autorizacion" ? "Guardando..." : "Cliente autoriza"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void guardarAutorizacion("ESPERA_REPUESTO")}
                          disabled={faseEnCurso !== null}
                          className={btnSecondary + " gap-2"}
                        >
                          <FiClock size={15} /> Espera repuesto
                        </button>
                      </div>
                    </FaseCard>

                    <FaseCard
                      paso={3}
                      titulo="Reparación"
                      estado={ef(2)}
                      resumen={orden.reparacionRealizada ? <><b className="text-stone-800">{orden.reparacionRealizada}</b>{` · Mano de obra $${Number(orden.manoDeObra ?? 0).toFixed(2)}`}{orden.recomendaciones ? ` · ${orden.recomendaciones}` : ""}</> : "Sin reparación cargada."}
                    >
                      <form onSubmit={(e) => void handleRep(guardarReparacion)(e)} noValidate className="space-y-2">
                        <Field id="fase-reparacion" label="Reparación realizada" required error={erroresRep.reparacionRealizada?.message}>
                          <textarea id="fase-reparacion" className={inputCls} rows={2} placeholder="Ej: Se resoldó la fuente y se cambió el fusible..." {...registerRep("reparacionRealizada")} />
                        </Field>
                        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                          <Field id="fase-mano" label="Mano de obra ($)" marca={<TagOpcional />} error={erroresRep.manoDeObra?.message}>
                            <input id="fase-mano" className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" {...registerRep("manoDeObra")} />
                          </Field>
                          <Field id="fase-reco" label="Recomendaciones" marca={<TagOpcional />} error={erroresRep.recomendaciones?.message}>
                            <textarea id="fase-reco" className={inputCls} rows={1} placeholder="Ej: Cambiar el cable..." {...registerRep("recomendaciones")} />
                          </Field>
                        </div>
                        <button className={btnPrimary + " w-full gap-2"} disabled={faseEnCurso !== null}>
                          <FiSave size={15} /> {faseEnCurso === "reparacion" ? "Guardando..." : "Guardar reparación"}
                        </button>
                      </form>
                    </FaseCard>

                    <FaseCard
                      paso={4}
                      titulo="Cierre y entrega"
                      estado={ef(3)}
                      resumen={orden.precioFinal != null ? <><b className="text-stone-800">${Number(orden.precioFinal).toFixed(2)}</b>{orden.conformidadEntregaCliente ? " · Conforme" : ""}{orden.fechaEntrega ? ` · ${new Date(orden.fechaEntrega).toLocaleDateString("es-AR")}` : ""}</> : "Sin precio cargado."}
                    >
                      <form onSubmit={(e) => void handleCierre(guardarCierre)(e)} noValidate className="space-y-2">
                        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Mano de obra ($)</label>
                            <div className="font-ficha rounded-xl bg-stone-50 px-3 py-2 text-[15px] font-bold text-stone-900 ring-1 ring-inset ring-stone-200">
                              ${Number(orden.manoDeObra ?? 0).toFixed(2)}
                            </div>
                            <p className="mt-1 text-[11px] text-stone-500">Viene de la fase Reparación.</p>
                          </div>
                          <Field id="fase-precio" label="Precio final ($)" required error={erroresCierre.precioFinal?.message}>
                            <input id="fase-precio" className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" {...registerCierre("precioFinal")} />
                          </Field>
                        </div>
                        {(() => {
                          const cobrado = (orden.pagos ?? []).reduce((a, p) => a + Number(p.monto), 0);
                          const precioNum = precioVivo.trim() === "" || Number.isNaN(Number(precioVivo)) ? 0 : Number(precioVivo);
                          const saldoVivo = Math.round((precioNum - cobrado) * 100) / 100;
                          const precioGuardado = orden.precioFinal != null ? Number(orden.precioFinal) : null;
                          const saldoGuardado = precioGuardado != null ? Math.round((precioGuardado - cobrado) * 100) / 100 : null;
                          const cobroHabilitado = precioGuardado != null && saldoGuardado != null && saldoGuardado > 0;
                          return (
                            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-sm ring-1 ring-inset ring-blue-200/60">
                              <p className="text-[13px] text-blue-900">
                                Precio total <b className="font-ficha">${precioNum.toFixed(2)}</b>
                                {" · "}Cobrado <b className="font-ficha">${cobrado.toFixed(2)}</b>
                                {precioGuardado != null ? (
                                  <> de <b className="font-ficha">${precioGuardado.toFixed(2)}</b></>
                                ) : (
                                  " (sin precio final guardado)"
                                )}
                                {saldoGuardado != null && saldoGuardado > 0 && <> · Saldo <b className="font-ficha">${saldoGuardado.toFixed(2)}</b></>}
                                {saldoGuardado != null && saldoGuardado <= 0 && <> · <b>Pagado ✓</b></>}
                              </p>
                              {precioVivo.trim() !== "" && precioGuardado != null && Number(precioVivo) !== precioGuardado && (
                                <p className="mt-1 text-xs font-semibold text-amber-800">
                                  Cambiaste el precio a ${precioNum.toFixed(2)} (saldo nuevo ${saldoVivo.toFixed(2)}). Guardá con Cerrar y entregar para aplicarlo.
                                </p>
                              )}
                              <p className="mt-1 text-xs text-blue-800">
                                {cobroHabilitado
                                  ? "Precio guardado: ya podés cobrar esta orden en Pagos."
                                  : "Guardá el precio con Cerrar y entregar; recién ahí aparece el botón para cobrar."}
                              </p>
                              {cobroHabilitado && (
                                <Link
                                  href={`/pagos?ordenId=${orden.id}`}
                                  className="mt-2 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-blue-800 px-4 py-2 text-sm font-semibold text-white active:bg-blue-900"
                                >
                                  <FiDollarSign size={15} /> Ir a cobrar esta orden
                                </Link>
                              )}
                            </div>
                          );
                        })()}
                        <label className="flex min-h-[44px] items-center gap-2.5 text-[15px] sm:text-sm">
                          <input type="checkbox" className="h-5 w-5 shrink-0 accent-blue-800" {...registerCierre("conformidadEntregaCliente")} />
                          Cliente conforme / equipo entregado
                        </label>
                        <button className={btnPrimary + " w-full gap-2"} disabled={faseEnCurso !== null}>
                          <FiSave size={15} /> {faseEnCurso === "cierre" ? "Guardando..." : "Cerrar y entregar"}
                        </button>
                      </form>
                    </FaseCard>
                  </>
                );
              })()}
            </Reveal>
            <Reveal delay={0.08} className="min-w-0 space-y-3 sm:space-y-4">
              <Card>
                <h2 className="flex items-center gap-2 font-bold text-stone-900">
                  <IconTile tono="green"><FiDollarSign size={16} /></IconTile>
                  <span className="min-w-0 flex-1">
                    Pagos
                    <span className="block text-xs font-normal text-stone-500">
                      {(orden.pagos ?? []).length} cobro{(orden.pagos ?? []).length !== 1 ? "s" : ""} registrado{(orden.pagos ?? []).length !== 1 ? "s" : ""}
                    </span>
                  </span>
                  <Badge tono={orden.estadoPago === "PAGADO" ? "green" : "amber"}>{orden.estadoPago}</Badge>
                </h2>
                {(() => {
                  const cobrado = (orden.pagos ?? []).reduce((a, p) => a + Number(p.monto), 0);
                  const precio = orden.precioFinal != null ? Number(orden.precioFinal) : null;
                  const saldo = precio != null ? Math.round((precio - cobrado) * 100) / 100 : null;
                  return (
                    <dl className="mt-3 space-y-1.5 rounded-xl bg-stone-50 p-3 text-sm ring-1 ring-inset ring-stone-200/70">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Precio final</dt>
                        <dd className="font-ficha font-bold text-stone-900">{precio != null ? `$${precio.toFixed(2)}` : "Sin definir"}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-stone-200/70 pt-1.5">
                        <dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Cobrado</dt>
                        <dd className="font-ficha font-bold text-emerald-700">${cobrado.toFixed(2)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-stone-200/70 pt-1.5">
                        <dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Saldo</dt>
                        <dd className={`font-ficha font-bold ${saldo != null && saldo <= 0 ? "text-emerald-700" : "text-blue-800"}`}>
                          {saldo != null ? (saldo <= 0 ? "Pagado ✓" : `$${saldo.toFixed(2)}`) : "—"}
                        </dd>
                      </div>
                    </dl>
                  );
                })()}
                {(orden.pagos ?? []).length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-3 py-2.5 text-center text-sm text-stone-500">
                    Todavía no hay pagos registrados.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {(orden.pagos ?? []).map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-2.5 rounded-xl border border-stone-200/70 bg-white px-3 py-2 text-sm shadow-sm"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                          <FiDollarSign size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-ficha block font-bold text-stone-900">
                            ${Number(p.monto).toFixed(2)}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                            <FiCalendar size={11} className="shrink-0" />
                            {new Date(p.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                          </span>
                        </span>
                        <Badge tono="green">
                          <FiCreditCard size={11} /> {MEDIO_LABEL[p.medioPago]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <FotosOrden
                ordenId={orden.id}
                fotos={orden.fotos ?? []}
                onCambio={() => void cargar()}
                nombreCliente={
                  orden.equipo?.cliente
                    ? `${orden.equipo.cliente.nombre} ${orden.equipo.cliente.apellido ?? ""}`.trim()
                    : undefined
                }
              />
              <Card>
                <h2 className="flex items-center gap-2 font-bold text-stone-900">
                  <IconTile tono="violet"><FiClock size={16} /></IconTile>
                  <span className="min-w-0 flex-1">
                    Historial de estados
                    <span className="block text-xs font-normal text-stone-500">
                      {(orden.historialEstados ?? []).length} movimiento{(orden.historialEstados ?? []).length !== 1 ? "s" : ""}
                    </span>
                  </span>
                </h2>
                {(orden.historialEstados ?? []).length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-3 py-2.5 text-center text-sm text-stone-500">
                    Sin historial registrado.
                  </p>
                ) : (
                  <ol className="mt-3">
                    {(orden.historialEstados ?? []).map((h, i, arr) => (
                      <li key={h.id} className="relative flex gap-2.5 pb-3 last:pb-0">
                        {i < arr.length - 1 && (
                          <span aria-hidden className="absolute bottom-0 left-[7px] top-5 w-px bg-stone-200" />
                        )}
                        <span
                          aria-hidden
                          className={`mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full ring-4 ring-white ${
                            i === 0 ? "bg-blue-800" : "bg-stone-300"
                          }`}
                        />
                        <div className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-inset ring-stone-200/60">
                          <p className="text-sm font-bold text-stone-900">
                            {ESTADO_ORDEN_LABEL[h.estado]}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                            <FiCalendar size={11} className="shrink-0" />
                            {new Date(h.fecha).toLocaleString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {h.comentario && (
                            <p className="mt-1 break-words text-[13px] text-stone-600">{h.comentario}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </Reveal>
          </div>
        )}
      </main>
    </div>
  );
}
