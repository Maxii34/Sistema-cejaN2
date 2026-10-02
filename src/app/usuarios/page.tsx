"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiEdit,
  FiEye,
  FiEyeOff,
  FiLock,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUserPlus,
  FiUserX,
  FiUsers,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { Toast } from "@/lib/toast";
import {
  crearUsuarioAPayload,
  crearUsuarioFormSchema,
  type CrearUsuarioFormValues,
} from "@/lib/validaciones";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { AnimatePresence } from "motion/react";
import { Modal } from "@/components/Modal";
import { Lista, ItemLi, Reveal } from "@/components/motion";
import { Card, PageHeader, Badge, Empty, btnPrimary, btnSecondary, inputCls, IconTile, Spinner, CargandoPagina } from "@/components/ui";
import { Field } from "@/components/Field";
import type { ApiEnvelope, RolUsuario, Usuario } from "@/lib/types";

const ROL_INFO: Record<RolUsuario, { titulo: string; detalle: string; caja: string }> = {
  ADMIN: {
    titulo: "Administrador · acceso total",
    detalle: "Puede hacer todo: clientes, equipos, recepciones, pagos y gestionar usuarios. Solo puede existir un ADMIN.",
    caja: "border-violet-200 bg-violet-50 text-violet-900 ring-violet-200/60",
  },
  TECNICO: {
    titulo: "Técnico · trabajo diario",
    detalle: "Puede gestionar clientes, equipos, recepciones, diagnósticos, reparaciones y pagos. No puede crear ni administrar usuarios.",
    caja: "border-blue-200 bg-blue-50 text-blue-900 ring-blue-200/60",
  },
};

export default function UsuariosPage() {
  const { usuario, cargando, esAdmin } = useRequireAuth();
  const router = useRouter();
  const [lista, setLista] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);
  const {
    register: registerNuevo,
    handleSubmit: handleNuevo,
    reset: resetNuevo,
    watch: watchNuevo,
    formState: { errors: erroresNuevo, isSubmitting: creandoUsuario },
  } = useForm<CrearUsuarioFormValues>({
    resolver: zodResolver(crearUsuarioFormSchema),
    defaultValues: { nombre: "", email: "", password: "", rol: "TECNICO" },
  });
  const rolNuevo = watchNuevo("rol");

  // edición
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [formEdit, setFormEdit] = useState({ nombre: "", email: "", rol: "TECNICO" as RolUsuario });
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // Restablecer clave (solo ADMIN): nueva + repetir, va a PUT /:id/password
  const [cambiarClave, setCambiarClave] = useState(false);
  const [claveNueva, setClaveNueva] = useState("");
  const [claveRepetir, setClaveRepetir] = useState("");
  const [verNueva, setVerNueva] = useState(false);
  const [verRepetir, setVerRepetir] = useState(false);

  // ADMIN siempre fijo arriba, luego por nombre
  const listaOrdenada = useMemo(
    () =>
      [...lista].sort((a, b) => {
        if (a.rol !== b.rol) return a.rol === "ADMIN" ? -1 : 1;
        return a.nombre.localeCompare(b.nombre, "es");
      }),
    [lista]
  );

  const cargar = async () => {
    setCargandoLista(true);
    try {
      const res = await api.get<ApiEnvelope<Usuario[]>>("/api/usuario");
      setLista(res.data);
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    if (!usuario) return;
    if (!esAdmin) {
      router.replace("/");
      return;
    }
    cargar().catch((e) => setError(e instanceof Error ? e.message : "Error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, esAdmin]);

  const crear = async (values: CrearUsuarioFormValues) => {
    if (creandoUsuario) return;
    try {
      await api.post("/api/usuario", crearUsuarioAPayload(values));
      resetNuevo();
      await cargar();
      void Toast.fire({ icon: "success", title: "Usuario creado", text: "El usuario ya puede ingresar al taller." });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo crear (recordá: solo 1 ADMIN)";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo crear", text: mensaje });
    }
  };

  const abrirEdicion = (u: Usuario) => {
    setFormEdit({ nombre: u.nombre, email: u.email, rol: u.rol });
    setEditando(u);
    // resetea la sección de clave
    setCambiarClave(false);
    setClaveNueva("");
    setClaveRepetir("");
    setVerNueva(false);
    setVerRepetir(false);
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    if (cambiarClave) {
      if (claveNueva.length < 6) {
        void Toast.fire({ icon: "error", title: "Clave muy corta", text: "La nueva clave debe tener al menos 6 caracteres." });
        return;
      }
      if (claveNueva !== claveRepetir) {
        void Toast.fire({ icon: "error", title: "No coinciden", text: "La nueva clave y su repetición no coinciden." });
        return;
      }
    }
    setGuardandoEdit(true);
    try {
      await api.put(`/api/usuario/${editando.id}`, {
        nombre: formEdit.nombre.trim(),
        email: formEdit.email.trim(),
        rol: formEdit.rol,
      });
      let claveOk = false;
      if (cambiarClave) {
        await api.put(`/api/usuario/${editando.id}/password`, { password: claveNueva });
        claveOk = true;
      }
      setEditando(null);
      await cargar();
      void Toast.fire({
        icon: "success",
        title: "Usuario actualizado",
        text: claveOk ? "Datos y contraseña guardados correctamente." : "Los datos se guardaron correctamente.",
      });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo actualizar";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo actualizar", text: mensaje });
    } finally {
      setGuardandoEdit(false);
    }
  };

  const alternarActivo = async (u: Usuario) => {
    const vaAActivar = !u.activo;
    const confirm = await Swal.fire({
      icon: "question",
      title: vaAActivar ? "¿Activar usuario?" : "¿Desactivar usuario?",
      text: vaAActivar
        ? `"${u.nombre}" volverá a poder ingresar al sistema.`
        : `"${u.nombre}" ya no podrá ingresar al sistema. Podrás reactivarlo cuando quieras.`,
      showCancelButton: true,
      confirmButtonText: vaAActivar ? "Sí, activar" : "Sí, desactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: vaAActivar ? "#047857" : "#b45309",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.put(`/api/usuario/${u.id}`, { activo: vaAActivar });
      await cargar();
      void Toast.fire({
        icon: "success",
        title: vaAActivar ? "Usuario activado" : "Usuario desactivado",
        text: vaAActivar ? `"${u.nombre}" ya puede ingresar.` : `"${u.nombre}" quedó sin acceso.`,
      });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo cambiar el estado";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "Error", text: mensaje });
    }
  };

  const eliminar = async (u: Usuario) => {
    if (!u.activo) {
      void Toast.fire({ icon: "info", title: "Usuario ya desactivado", text: `"${u.nombre}" ya está desactivado. Reactivalo para volver a gestionarlo.` });
      return;
    }
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar usuario?",
      text: `Se eliminará a "${u.nombre}" (${u.email}). Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.del(`/api/usuario/${u.id}`);
      await cargar();
      void Toast.fire({ icon: "success", title: "Usuario eliminado", text: `"${u.nombre}" fue eliminado del sistema.` });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo eliminar";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo eliminar", text: mensaje });
    }
  };

  if (cargando || !usuario) return <CargandoPagina />;
  if (!esAdmin) return <p className="p-8">Solo administradores.</p>;

  const esYo = (u: Usuario) => u.id === usuario.id;

  const acciones = (u: Usuario) => (
    <div className="flex shrink-0 items-center justify-end gap-1.5">
      <button
        onClick={() => abrirEdicion(u)}
        title={u.activo ? "Editar usuario" : "Usuario desactivado — reactivalo para editar"}
        aria-label={`Editar a ${u.nombre}`}
        disabled={!u.activo}
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-stone-300 bg-white px-2 text-blue-700 shadow-sm transition-all hover:-translate-y-px hover:border-blue-300 hover:shadow-md active:translate-y-0 active:bg-blue-50 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm sm:min-h-[40px] sm:min-w-[40px] sm:px-2.5"
      >
        <FiEdit size={15} />
      </button>
      <button
        onClick={() => void alternarActivo(u)}
        title={u.activo ? "Desactivar usuario" : "Activar usuario"}
        aria-label={`${u.activo ? "Desactivar a" : "Activar a"} ${u.nombre}`}
        disabled={esYo(u)}
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-stone-300 bg-white px-2 text-amber-700 shadow-sm transition-all hover:-translate-y-px hover:border-amber-300 hover:shadow-md active:translate-y-0 active:bg-amber-50 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm sm:min-h-[40px] sm:min-w-[40px] sm:px-2.5"
      >
        {u.activo ? <FiUserX size={15} /> : <FiUserCheck size={15} />}
      </button>
      <button
        onClick={() => void eliminar(u)}
        title={esYo(u) ? "No podés eliminarte a vos mismo" : u.activo ? "Eliminar usuario" : "Usuario ya desactivado"}
        aria-label={`Eliminar a ${u.nombre}`}
        disabled={esYo(u) || !u.activo}
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-red-200 bg-white px-2 text-red-600 shadow-sm transition-all hover:-translate-y-px hover:border-red-300 hover:shadow-md active:translate-y-0 active:bg-red-50 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm sm:min-h-[40px] sm:min-w-[40px] sm:px-2.5"
      >
        <FiTrash2 size={15} />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader eyebrow="Administración" titulo="Usuarios" descripcion="Solo administradores. Puede haber un único administrador." />
        {error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</p>}
        <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[1fr_320px]">
          <Card className="order-last lg:order-none">
            <div className="flex items-center gap-3">
              <IconTile tono="blue"><FiUsers size={18} /></IconTile>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-stone-900">Equipo del taller</h2>
                <p className="text-xs font-normal text-stone-500">
                  {listaOrdenada.length} usuario{listaOrdenada.length !== 1 ? "s" : ""} · el ADMIN queda fijo arriba
                </p>
              </div>
              <Badge tono="violet">
                <FiShield size={12} /> {listaOrdenada.filter((x) => x.rol === "ADMIN").length} ADMIN
              </Badge>
            </div>
            <div className="mt-3">
            {cargandoLista ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
                <Spinner tamano="md" /> Cargando usuarios...
              </div>
            ) : listaOrdenada.length === 0 ? <Empty mensaje="Sin usuarios" /> : (
                <Lista className="tabla-scroll max-h-[380px] space-y-2 overflow-y-auto pb-1 pr-1 text-sm sm:max-h-[420px]">
                  {listaOrdenada.map((u) => {
                    const esAdminFila = u.rol === "ADMIN";
                    return (
                    <ItemLi
                      key={u.id}
                      className={`group flex items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:gap-3 ${
                        esAdminFila
                          ? "border-violet-200 bg-gradient-to-r from-violet-50 via-white to-white ring-1 ring-inset ring-violet-100 hover:shadow-[0_18px_36px_-18px_rgba(109,40,217,0.35)]"
                          : `border-stone-200/70 bg-stone-50/60 hover:border-blue-200 hover:bg-white hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.35)] ${u.activo ? "" : "opacity-75"}`
                      }`}
                    >
                      <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                        esAdminFila
                          ? "bg-gradient-to-br from-violet-600 to-violet-800 shadow-[0_8px_16px_-8px_rgba(109,40,217,0.7)] ring-2 ring-violet-200"
                          : "bg-blue-800 shadow-[0_8px_16px_-8px_rgba(30,64,175,0.6)] ring-2 ring-blue-100"
                      } ${u.activo ? "" : "saturate-50"}`}>
                        {(u.nombre[0] ?? "?").toUpperCase()}
                        <span
                          title={u.activo ? "Activo" : "Inactivo"}
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${u.activo ? "bg-emerald-500" : "bg-stone-400"}`}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="block truncate text-sm font-semibold text-stone-900">
                            {u.nombre} {esYo(u) && <span className="text-xs font-medium text-stone-400">(vos)</span>}
                          </span>
                          {esAdminFila && <FiShield size={13} className="shrink-0 text-violet-700" />}
                        </span>
                        <span className="block truncate text-xs text-stone-500">{u.email}</span>
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          <Badge tono={esAdminFila ? "violet" : "blue"}>{u.rol}</Badge>
                          <Badge tono={u.activo ? "green" : "zinc"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                        </span>
                      </span>
                      {acciones(u)}
                    </ItemLi>
                    );
                  })}
                </Lista>
              )}
            </div>
          </Card>
          <Reveal className="order-first lg:order-none" delay={0.08}><Card>
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="violet"><FiShield size={16} /></IconTile> Nuevo usuario
            </h2>
            <form onSubmit={(e) => void handleNuevo(crear)(e)} noValidate className="mt-3 space-y-2">
              <Field id="nuevo-nombre" label="Nombre" required error={erroresNuevo.nombre?.message}>
                <input id="nuevo-nombre" className={inputCls} required type="text" autoComplete="name" placeholder="Ej: Juan Pérez" {...registerNuevo("nombre")} />
              </Field>
              <Field id="nuevo-email" label="Email" required error={erroresNuevo.email?.message}>
                <input id="nuevo-email" className={inputCls} required type="email" autoComplete="email" placeholder="Ej: juan@taller.com" {...registerNuevo("email")} />
              </Field>
              <Field id="nuevo-password" label="Contraseña" required error={erroresNuevo.password?.message}>
                <input id="nuevo-password" className={inputCls} required type="password" autoComplete="new-password" minLength={6} placeholder="Mínimo 6 caracteres" {...registerNuevo("password")} />
              </Field>
              <div>
                <label htmlFor="nuevo-rol" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Rol <span className="font-bold text-red-600">*</span></label>
                <select id="nuevo-rol" className={inputCls} {...registerNuevo("rol")}>
                  <option value="TECNICO">TÉCNICO</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {erroresNuevo.rol?.message && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">{erroresNuevo.rol.message}</p>
                )}
                <p className={`mt-1.5 rounded-xl border px-3 py-2 text-xs leading-snug ring-1 ring-inset ${ROL_INFO[rolNuevo].caja}`}>
                  <b className="block text-[11px] font-bold uppercase tracking-wider opacity-80">{ROL_INFO[rolNuevo].titulo}</b>
                  <span className="mt-0.5 block">{ROL_INFO[rolNuevo].detalle}</span>
                </p>
              </div>
              <button className={btnPrimary + " w-full"} disabled={creandoUsuario}>
                <FiUserPlus size={15} /> {creandoUsuario ? "Creando..." : "Crear usuario"}
              </button>
            </form>
          </Card>
          </Reveal>
        </div>
      </main>

      <AnimatePresence>
      {editando && (
        <Modal titulo={`Editar: ${editando.nombre}`} onClose={() => setEditando(null)}>
          <form onSubmit={(e) => void guardarEdicion(e)} className="space-y-2">
            <div>
              <label htmlFor="edit-u-nombre" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Nombre</label>
              <input
                id="edit-u-nombre"
                name="nombre"
                className={inputCls}
                required
                autoComplete="name"
                value={formEdit.nombre}
                onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="edit-u-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Email</label>
              <input
                id="edit-u-email"
                name="email"
                className={inputCls}
                required
                type="email"
                autoComplete="email"
                value={formEdit.email}
                onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="edit-u-rol" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Rol</label>
              <select
                id="edit-u-rol"
                name="rol"
                className={inputCls}
                value={formEdit.rol}
                onChange={(e) => setFormEdit({ ...formEdit, rol: e.target.value as RolUsuario })}
              >
                <option value="TECNICO">TÉCNICO</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <p className={`mt-1.5 rounded-xl border px-3 py-2 text-xs leading-snug ring-1 ring-inset ${ROL_INFO[formEdit.rol].caja}`}>
                <b className="block text-[11px] font-bold uppercase tracking-wider opacity-80">{ROL_INFO[formEdit.rol].titulo}</b>
                <span className="mt-0.5 block">{ROL_INFO[formEdit.rol].detalle}</span>
              </p>
            </div>
            {/* Restablecer contraseña (solo ADMIN) */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-blue-800"
                  checked={cambiarClave}
                  onChange={(e) => setCambiarClave(e.target.checked)}
                />
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-bold text-stone-800">
                  <FiLock size={14} className="shrink-0 text-blue-800" />
                  Cambiar contraseña
                </span>
              </label>
              {cambiarClave && (
                <div className="mt-2 space-y-2 border-t border-stone-200/70 pt-2">
                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                    <div>
                      <label htmlFor="clave-nueva" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Nueva clave</label>
                      <div className="relative">
                        <input
                          id="clave-nueva"
                          name="nuevaClave"
                          className={inputCls + " pr-11"}
                          type={verNueva ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Mínimo 6 caracteres"
                          value={claveNueva}
                          onChange={(e) => setClaveNueva(e.target.value)}
                        />
                        <button
                          type="button"
                          aria-label={verNueva ? "Ocultar nueva clave" : "Mostrar nueva clave"}
                          onClick={() => setVerNueva((v) => !v)}
                          className="absolute inset-y-0 right-1 flex w-9 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700"
                        >
                          {verNueva ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="clave-repetir" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Repetir nueva clave</label>
                      <div className="relative">
                        <input
                          id="clave-repetir"
                          name="repetirClave"
                          className={inputCls + " pr-11"}
                          type={verRepetir ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Repetí la nueva clave"
                          value={claveRepetir}
                          onChange={(e) => setClaveRepetir(e.target.value)}
                        />
                        <button
                          type="button"
                          aria-label={verRepetir ? "Ocultar confirmación" : "Mostrar confirmación"}
                          onClick={() => setVerRepetir((v) => !v)}
                          className="absolute inset-y-0 right-1 flex w-9 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700"
                        >
                          {verRepetir ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {claveNueva !== "" && claveNueva.length < 6 && (
                    <p className="text-xs font-medium text-amber-700">La nueva clave debe tener al menos 6 caracteres.</p>
                  )}
                  {claveNueva !== "" && claveRepetir !== "" && (
                    claveNueva === claveRepetir
                      ? <p className="text-xs font-semibold text-emerald-700">Las claves nuevas coinciden ✓</p>
                      : <p className="text-xs font-semibold text-red-600">Las claves nuevas no coinciden.</p>
                  )}
                  <p className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] leading-snug text-blue-800 ring-1 ring-inset ring-blue-200/70">
                    Como administrador, fijás una nueva contraseña sin necesidad de la anterior. El usuario deberá ingresar con la nueva.
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" className={btnSecondary} onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button className={btnPrimary} disabled={guardandoEdit || (cambiarClave && (claveNueva.length < 6 || claveNueva !== claveRepetir))}>
                <FiEdit size={15} /> {guardandoEdit ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      </AnimatePresence>
    </div>
  );
}
