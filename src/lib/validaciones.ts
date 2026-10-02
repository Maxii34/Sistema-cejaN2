import { z } from "zod";

/**
 * Los schemas de este archivo trabajan con los tipos de los inputs
 * (strings) y ESPEJAN las reglas del backend (solo lectura, sin modificarlo).
 * El resolver de RHF solo frena el submit y expone errores por campo;
 * la conversión a number/null se hace en las funciones `...APayload`
 * al enviar, para que el payload no cambie.
 */

/**
 * Login del taller.
 * Espeja `loginSchema` de Back `src/validators/usuario.validation.ts`.
 */
export const loginFormSchema = z.object({
  // Sin toLowerCase a propósito: el resolver devuelve valores transformados
  // y el backend no loweriza al comparar; el email se envía igual que hoy.
  email: z
    .string()
    .trim()
    .pipe(z.email("El email no es válido")),
  // Sin trim a propósito: la clave se envía tal cual, igual que hoy.
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

/** Payload idéntico al que se envía hoy en el login. */
export function loginAPayload(v: LoginFormValues) {
  return { email: v.email.trim(), password: v.password };
}

/**
 * Alta rápida de cliente (Ingreso).
 * Espeja `createClienteSchema` de Back `src/validators/cliente.validation.ts`.
 * Los opcionales aceptan "" (el payload los convierte a null, igual que hoy).
 * El `min(1, "DNI inválido")` del back se conserva para texto no vacío;
 * "" pasa y viaja como null como hoy.
 */
export const altaRapidaFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  apellido: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional(),
  dni: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .min(1, "DNI inválido")
        .max(20, "Máximo 20 caracteres"),
    ])
    .optional(),
  telefono: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .optional(),
});

export type AltaRapidaFormValues = z.infer<typeof altaRapidaFormSchema>;

/** Payload idéntico al que se envía hoy en el alta rápida. */
export function altaRapidaAPayload(v: AltaRapidaFormValues) {
  return {
    nombre: v.nombre.trim(),
    apellido: v.apellido?.trim() || null,
    telefono: v.telefono?.trim() || null,
    dni: v.dni?.trim() || null,
  };
}

/**
 * Crear usuario (Administración).
 * Espeja `crearUsuarioSchema` de Back `src/validators/usuario.validation.ts`.
 * Email SIN lowercase: el resolver devuelve valores transformados y el
 * backend compara sin lowerizar (misma lección que el login).
 */
export const crearUsuarioFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z
    .string()
    .trim()
    .pipe(z.email("El email no es válido")),
  // Sin trim a propósito: la clave se envía tal cual, igual que hoy.
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.enum(["ADMIN", "TECNICO"]),
});

export type CrearUsuarioFormValues = z.infer<typeof crearUsuarioFormSchema>;

/** Payload idéntico al que se envía hoy al crear usuario. */
export function crearUsuarioAPayload(v: CrearUsuarioFormValues) {
  return {
    nombre: v.nombre.trim(),
    email: v.email.trim(),
    password: v.password,
    rol: v.rol,
  };
}

/**
 * Crear equipo (ficha del cliente).
 * Espeja `createEquipoSchema` de Back `src/validators/equipo.validation.ts`.
 * `clienteId` viene de la ruta y se agrega en el payload, fuera del form.
 */
export const crearEquipoFormSchema = z.object({
  tipo: z
    .string()
    .trim()
    .min(1, "El tipo es requerido")
    .max(50, "Máximo 50 caracteres"),
  marca: z
    .string()
    .trim()
    .min(1, "La marca es requerida")
    .max(50, "Máximo 50 caracteres"),
  modelo: z
    .string()
    .trim()
    .min(1, "El modelo es requerido")
    .max(50, "Máximo 50 caracteres"),
  numeroSerie: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional(),
  observaciones: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional(),
});

export type CrearEquipoFormValues = z.infer<typeof crearEquipoFormSchema>;

/** Payload idéntico al que se envía hoy al crear equipo. */
export function crearEquipoAPayload(
  v: CrearEquipoFormValues,
  clienteId: number
) {
  return {
    tipo: v.tipo.trim(),
    marca: v.marca.trim(),
    modelo: v.modelo.trim(),
    numeroSerie: v.numeroSerie?.trim() || null,
    observaciones: v.observaciones?.trim() || null,
    clienteId,
  };
}

/**
 * Nueva recepción (ordenes/nueva).
 * Espeja `createOrdenReparacionSchema` de Back
 * `src/validators/ordenReparacion.validation.ts`.
 * `clienteId` es solo filtro del front (no viaja al back).
 * `condicionFisica` es fija, firmas/tecnico/creadoPor/origen van en el
 * payload desde datos vivos, y la foto queda fuera de RHF.
 * Los chequeos vivos (orden abierta, garantía vigente) quedan en el submit.
 */
export const recepcionFormSchema = z.object({
  clienteId: z.string().optional(),
  equipoId: z
    .string()
    .min(1, "Seleccioná un equipo")
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) > 0,
      "equipoId debe ser entero"
    ),
  fallaReportada: z
    .string()
    .trim()
    .min(1, "La falla reportada es requerida")
    .max(2000, "Máximo 2000 caracteres"),
  accesorios: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional(),
  costoEstimado: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)), "Debe ser un número")
      .refine((v) => Number(v) >= 0, "No puede ser negativo")
      .refine((v) => Number(v) <= 99999999.99, "Monto máximo excedido"),
  ]),
  detalleCondicion: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional(),
  modoGarantia: z.boolean(),
});

export type RecepcionFormValues = z.infer<typeof recepcionFormSchema>;

/** Payload idéntico al que se envía hoy al crear la recepción. */
export function recepcionAPayload(
  v: RecepcionFormValues,
  ctx: {
    origenGarantiaId: number | null;
    tecnicoId: number | null;
    creadoPorId: number | null;
  }
) {
  return {
    equipoId: Number(v.equipoId),
    fallaReportada: v.fallaReportada.trim(),
    accesorios: v.accesorios?.trim() || null,
    condicionFisica: ["BUEN_ESTADO"],
    detalleCondicionFisica: v.detalleCondicion?.trim() || null,
    costoEstimado: v.costoEstimado ? Number(v.costoEstimado) : null,
    firmaClienteRecepcion: false,
    firmaTecnicoRecepcion: false,
    tecnicoId: ctx.tecnicoId,
    creadoPorId: ctx.creadoPorId,
    esGarantia: v.modoGarantia,
    ordenOrigenId: v.modoGarantia && ctx.origenGarantiaId ? ctx.origenGarantiaId : null,
  };
}

/**
 * Fase Diagnóstico (ficha de orden).
 * Espeja `faseDiagnosticoSchema` de Back
 * `src/validators/ordenReparacion.validation.ts`.
 * `tecnicoId` viaja como string en el select; se convierte en el payload.
 * Sin admin a la vista, se autoasigna con setValue como hoy.
 */
export const faseDiagnosticoFormSchema = z.object({
  diagnostico: z
    .string()
    .trim()
    .min(1, "El diagnóstico es obligatorio")
    .max(2000, "Máximo 2000 caracteres"),
  pruebasRealizadas: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .optional(),
  tecnicoId: z
    .string()
    .min(1, "El técnico a cargo es obligatorio")
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) > 0,
      "El técnico a cargo es obligatorio"
    ),
});

export type FaseDiagnosticoFormValues = z.infer<
  typeof faseDiagnosticoFormSchema
>;

/** Payload idéntico al que se envía hoy en el diagnóstico. */
export function faseDiagnosticoAPayload(v: FaseDiagnosticoFormValues) {
  return {
    diagnostico: v.diagnostico.trim(),
    pruebasRealizadas: v.pruebasRealizadas?.trim() || null,
    tecnicoId: Number(v.tecnicoId),
  };
}

/**
 * Fase Reparación (ficha de orden).
 * Espeja `faseReparacionSchema` de Back
 * `src/validators/ordenReparacion.validation.ts`.
 */
export const faseReparacionFormSchema = z.object({
  reparacionRealizada: z
    .string()
    .trim()
    .min(1, "La reparación realizada es obligatoria")
    .max(2000, "Máximo 2000 caracteres"),
  manoDeObra: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)), "Debe ser un número")
      .refine((v) => Number(v) >= 0, "No puede ser negativo")
      .refine((v) => Number(v) <= 99999999.99, "Monto máximo excedido"),
  ]),
  recomendaciones: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .optional(),
});

export type FaseReparacionFormValues = z.infer<
  typeof faseReparacionFormSchema
>;

/** Payload idéntico al que se envía hoy en la reparación. */
export function faseReparacionAPayload(v: FaseReparacionFormValues) {
  return {
    reparacionRealizada: v.reparacionRealizada.trim(),
    manoDeObra: v.manoDeObra ? Number(v.manoDeObra) : 0,
    recomendaciones: v.recomendaciones?.trim() || null,
  };
}

/**
 * Fase Cierre (ficha de orden).
 * Espeja `faseCierreSchema` de Back
 * `src/validators/ordenReparacion.validation.ts`.
 * `precioFinal` es requerido en el back.
 */
export const faseCierreFormSchema = z.object({
  precioFinal: z
    .string()
    .trim()
    .min(1, "El precio final es obligatorio")
    .refine((v) => Number.isFinite(Number(v)), "Debe ser un número")
    .refine((v) => Number(v) >= 0, "No puede ser negativo")
    .refine((v) => Number(v) <= 99999999.99, "Monto máximo excedido"),
  conformidadEntregaCliente: z.boolean(),
});

export type FaseCierreFormValues = z.infer<typeof faseCierreFormSchema>;

/** Payload idéntico al que se envía hoy en el cierre. */
export function faseCierreAPayload(v: FaseCierreFormValues) {
  return {
    precioFinal: Number(v.precioFinal),
    conformidadEntregaCliente: v.conformidadEntregaCliente,
  };
}

/**
 * Editar cliente (ficha del cliente).
 * Espeja `updateClienteSchema` de Back `src/validators/cliente.validation.ts`
 * (sin mensajes propios: se usan los mismos textos en español que el create).
 * Se envían los 7 campos con null si están vacíos, igual que hoy.
 */
export const editarClienteFormSchema = z.object({
  nombre: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .min(1, "El nombre es requerido")
      .max(100, "Máximo 100 caracteres"),
  ]),
  apellido: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional(),
  dni: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .min(1, "DNI inválido")
      .max(20, "Máximo 20 caracteres"),
  ]),
  telefono: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .optional(),
  whatsapp: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .optional(),
  email: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(255, "Máximo 255 caracteres")
      .pipe(z.email("Email inválido")),
  ]),
  direccion: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional(),
});

export type EditarClienteFormValues = z.infer<
  typeof editarClienteFormSchema
>;

/** Payload idéntico al que se envía hoy al editar cliente. */
export function editarClienteAPayload(v: EditarClienteFormValues) {
  return {
    nombre: v.nombre.trim() === "" ? null : v.nombre.trim(),
    apellido: v.apellido?.trim() || null,
    dni: v.dni?.trim() || null,
    telefono: v.telefono?.trim() || null,
    whatsapp: v.whatsapp?.trim() || null,
    email: v.email?.trim() || null,
    direccion: v.direccion?.trim() || null,
  };
}

/**
 * Editar usuario (modal, solo ADMIN).
 * Espeja `actualizarUsuarioSchema` + `restablecerClaveSchema` de Back
 * `src/validators/usuario.validation.ts`.
 * La repetición de clave es regla solo del front (refine).
 * Claves sin trim, igual que hoy.
 */
export const editarUsuarioFormSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio"),
    email: z
      .string()
      .trim()
      .pipe(z.email("El email no es válido")),
    rol: z.enum(["ADMIN", "TECNICO"]),
    cambiarClave: z.boolean(),
    claveNueva: z.string(),
    claveRepetir: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.cambiarClave) return;
    if (v.claveNueva.length < 6) {
      ctx.addIssue({
        code: "custom",
        message: "La nueva clave debe tener al menos 6 caracteres.",
        path: ["claveNueva"],
      });
    }
    if (v.claveNueva !== v.claveRepetir) {
      ctx.addIssue({
        code: "custom",
        message: "La nueva clave y su repetición no coinciden.",
        path: ["claveRepetir"],
      });
    }
  });

export type EditarUsuarioFormValues = z.infer<
  typeof editarUsuarioFormSchema
>;

export const MEDIOS_PAGO = [
  "EFECTIVO",
  "TRANSFERENCIA",
  "TARJETA_DEBITO",
  "TARJETA_CREDITO",
  "MERCADO_PAGO",
  "OTRO",
] as const;

/**
 * Registrar cobro (Pagos).
 * Espeja `createPagoSchema` de Back `src/validators/pago.validation.ts`.
 * Los inputs son strings; la conversión a number se hace en el payload.
 * `registradoPorId` se agrega en el payload, fuera del form.
 * Los chequeos vivos (precio final, cancelada, saldo) quedan en el submit.
 */
export const registrarCobroFormSchema = z.object({
  ordenId: z
    .string()
    .min(1, "Seleccioná una orden")
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) > 0,
      "ordenId debe ser entero"
    ),
  monto: z
    .string()
    .trim()
    .min(1, "El monto debe ser mayor a 0")
    .refine(
      (v) => Number.isFinite(Number(v)),
      "El monto debe ser un número"
    )
    .refine((v) => Number(v) > 0, "El monto debe ser mayor a 0")
    .refine((v) => Number(v) <= 99999999.99, "Monto máximo excedido"),
  medio: z.enum(MEDIOS_PAGO),
});

export type RegistrarCobroFormValues = z.infer<
  typeof registrarCobroFormSchema
>;

/** Payload idéntico al que se envía hoy al registrar un cobro. */
export function registrarCobroAPayload(
  v: RegistrarCobroFormValues,
  registradoPorId: number | null
) {
  return {
    ordenId: Number(v.ordenId),
    monto: Number(v.monto),
    medioPago: v.medio,
    registradoPorId,
  };
}
