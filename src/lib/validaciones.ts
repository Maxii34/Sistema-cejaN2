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
