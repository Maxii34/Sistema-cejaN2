// Tipos espejo del backend (Prisma + Zod)
export type RolUsuario = "ADMIN" | "TECNICO";
export type EstadoOrden =
  | "RECIBIDO"
  | "EN_DIAGNOSTICO"
  | "ESPERANDO_REPUESTO"
  | "EN_REPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";
export type EstadoPago = "PENDIENTE" | "PARCIAL" | "PAGADO";
export type MedioPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA_DEBITO"
  | "TARJETA_CREDITO"
  | "MERCADO_PAGO"
  | "OTRO";
export type CondicionFisica =
  | "BUEN_ESTADO"
  | "GOLPES_ABOLLADURAS"
  | "RAYONES_SUPERFICIALES"
  | "PIEZAS_ROTAS_FALTANTES";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  apellido?: string | null;
  dni?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
  createdAt?: string;
  equipos?: Equipo[];
}

export interface Equipo {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie?: string | null;
  observaciones?: string | null;
  clienteId: number;
  cliente?: Cliente;
  createdAt?: string;
  updatedAt?: string;
  // Solo front: imagen pendiente hasta que el backend soporte upload
  imagenPreview?: string | null;
}

export interface OrdenReparacion {
  id: number;
  numero: string;
  equipoId: number;
  equipo?: Equipo & { cliente?: Cliente };
  fechaIngreso: string;
  fallaReportada: string;
  accesorios?: string | null;
  condicionFisica: CondicionFisica[];
  detalleCondicionFisica?: string | null;
  diagnostico?: string | null;
  pruebasRealizadas?: string | null;
  recomendaciones?: string | null;
  costoEstimado?: number | string | null;
  autorizadoCliente: boolean;
  fechaAutorizacion?: string | null;
  reparacionRealizada?: string | null;
  manoDeObra: number | string;
  precioFinal?: number | string | null;
  estadoPago: EstadoPago;
  fechaEntrega?: string | null;
  garantiaDias: number;
  conformidadEntregaCliente: boolean;
  firmaClienteRecepcion: boolean;
  firmaTecnicoRecepcion: boolean;
  estado: EstadoOrden;
  creadoPorId?: number | null;
  tecnicoId?: number | null;
  tecnico?: Usuario | null;
  esGarantia?: boolean;
  ordenOrigenId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  pagos?: Pago[];
  repuestosUsados?: RepuestoUsado[];
  historialEstados?: HistorialEstado[];
  fotos?: FotoOrden[];
}

export interface Repuesto {
  id: number;
  nombre: string;
  descripcion?: string | null;
  stock: number;
  costo: number | string;
  precioVenta?: number | string | null;
}

export interface RepuestoUsado {
  id: number;
  ordenId: number;
  repuestoId: number;
  repuesto?: Repuesto;
  cantidad: number;
  costoUnitario: number | string;
  precioUnitario: number | string;
}

export interface Pago {
  id: number;
  ordenId: number;
  monto: number | string;
  medioPago: MedioPago;
  fecha: string;
  observaciones?: string | null;
}

export interface HistorialEstado {
  id: number;
  ordenId: number;
  estado: EstadoOrden;
  fecha: string;
  comentario?: string | null;
  usuario?: Usuario | null;
}

export interface FotoOrden {
  id: number;
  ordenId: number;
  url: string;
  publicId: string;
  fecha?: string;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  mensaje: string;
  data: T;
}

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPaginas: number };
}

export const ESTADO_ORDEN_LABEL: Record<EstadoOrden, string> = {
  RECIBIDO: "Recibido",
  EN_DIAGNOSTICO: "En diagnóstico",
  ESPERANDO_REPUESTO: "Esperando repuesto",
  EN_REPARACION: "En reparación",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const CONDICION_LABEL: Record<CondicionFisica, string> = {
  BUEN_ESTADO: "Buen estado",
  GOLPES_ABOLLADURAS: "Golpes / abolladuras",
  RAYONES_SUPERFICIALES: "Rayones superficiales",
  PIEZAS_ROTAS_FALTANTES: "Piezas rotas / faltantes",
};
