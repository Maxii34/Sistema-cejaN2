"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiEdit,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUserPlus,
  FiUserX,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Modal } from "@/components/Modal";
import { Card, PageHeader, Badge, Empty, btnPrimary, btnSecondary, inputCls, IconTile } from "@/components/ui";
import type { ApiEnvelope, RolUsuario, Usuario } from "@/lib/types";

const Toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export default function UsuariosPage() {
  const { usuario, cargando, esAdmin } = useRequireAuth();
  const router = useRouter();
  const [lista, setLista] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolUsuario>("TECNICO");

  // edición
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [formEdit, setFormEdit] = useState({ nombre: "", email: "", rol: "TECNICO" as RolUsuario });
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const cargar = async () => {
    const res = await api.get<ApiEnvelope<Usuario[]>>("/api/usuario");
    setLista(res.data);
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

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/usuario", {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        rol,
      });
      setNombre(""); setEmail(""); setPassword(""); setRol("TECNICO");
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
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setGuardandoEdit(true);
    try {
      await api.put(`/api/usuario/${editando.id}`, {
        nombre: formEdit.nombre.trim(),
        email: formEdit.email.trim(),
        rol: formEdit.rol,
      });
      setEditando(null);
      await cargar();
      void Toast.fire({ icon: "success", title: "Usuario actualizado", text: "Los datos se guardaron correctamente." });
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

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;
  if (!esAdmin) return <p className="p-8">Solo administradores.</p>;

  const esYo = (u: Usuario) => u.id === usuario.id;

  const acciones = (u: Usuario) => (
    <div className="flex shrink-0 items-center justify-end gap-1.5">
      <button
        onClick={() => abrirEdicion(u)}
        title="Editar usuario"
        aria-label={`Editar a ${u.nombre}`}
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-stone-300 bg-white px-2 text-blue-700 shadow-sm active:bg-blue-50 sm:min-h-[40px] sm:min-w-[40px] sm:px-2.5"
      >
        <FiEdit size={15} />
      </button>
      <button
        onClick={() => void alternarActivo(u)}
        title={u.activo ? "Desactivar usuario" : "Activar usuario"}
        aria-label={`${u.activo ? "Desactivar a" : "Activar a"} ${u.nombre}`}
        disabled={esYo(u)}
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-stone-300 bg-white px-2 text-amber-700 shadow-sm active:bg-amber-50 disabled:opacity-40 sm:min-h-[40px] sm:min-w-[40px] sm:px-2.5"
      >
        {u.activo ? <FiUserX size={15} /> : <FiUserCheck size={15} />}
      </button>
      <button
        onClick={() => void eliminar(u)}
        title="Eliminar usuario"
        aria-label={`Eliminar a ${u.nombre}`}
        disabled={esYo(u)}
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-red-200 bg-white px-2 text-red-600 shadow-sm active:bg-red-50 disabled:opacity-40 sm:min-h-[40px] sm:min-w-[40px] sm:px-2.5"
      >
        <FiTrash2 size={15} />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader eyebrow="Administración" titulo="Usuarios" descripcion="Solo ADMIN. El backend permite un único administrador." />
        {error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</p>}
        <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[1fr_320px]">
          <Card className="order-last lg:order-none">
            {lista.length === 0 ? <Empty mensaje="Sin usuarios" /> : (
              <>
                {/* Cards en móvil: todo en una sola fila */}
                <ul className="space-y-2 sm:hidden">
                  {lista.map((u) => (
                    <li key={u.id} className="flex items-center gap-2 overflow-hidden rounded-xl border border-stone-200 p-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-sm font-extrabold text-white">
                        {(u.nombre[0] ?? "?").toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-stone-900">
                          {u.nombre} {esYo(u) && <span className="text-xs font-medium text-stone-400">(vos)</span>}
                        </span>
                        <span className="block truncate text-xs text-stone-500">{u.email}</span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          <Badge tono={u.rol === "ADMIN" ? "violet" : "blue"}>{u.rol}</Badge>
                          <Badge tono={u.activo ? "green" : "zinc"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                        </span>
                      </span>
                      {acciones(u)}
                    </li>
                  ))}
                </ul>
                {/* Tabla en sm+ */}
                <div className="tabla-scroll hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                        <th className="py-2 pr-3 font-bold">Usuario</th>
                        <th className="py-2 pr-3 font-bold">Rol</th>
                        <th className="py-2 pr-3 font-bold">Estado</th>
                        <th className="py-2 text-right font-bold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((u) => (
                        <tr key={u.id} className="border-b border-stone-100 last:border-0">
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-extrabold text-white">
                                {(u.nombre[0] ?? "?").toUpperCase()}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-stone-900">
                                  {u.nombre} {esYo(u) && <span className="text-xs font-medium text-stone-400">(vos)</span>}
                                </span>
                                <span className="block truncate text-xs text-stone-500">{u.email}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3">
                            <Badge tono={u.rol === "ADMIN" ? "violet" : "blue"}>{u.rol}</Badge>
                          </td>
                          <td className="py-2.5 pr-3">
                            <Badge tono={u.activo ? "green" : "zinc"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                          </td>
                          <td className="py-2.5">{acciones(u)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
          <Card className="order-first lg:order-none">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="violet"><FiShield size={16} /></IconTile> Nuevo usuario
            </h2>
            <form onSubmit={(e) => void crear(e)} className="mt-3 space-y-2">
              <input className={inputCls} required placeholder="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              <input className={inputCls} required type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inputCls} required type="password" minLength={6} placeholder="Contraseña * (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <select className={inputCls} value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)}>
                <option value="TECNICO">TECNICO</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button className={btnPrimary + " w-full"}>
                <FiUserPlus size={15} /> Crear usuario
              </button>
            </form>
          </Card>
        </div>
      </main>

      {editando && (
        <Modal titulo={`Editar: ${editando.nombre}`} onClose={() => setEditando(null)}>
          <form onSubmit={(e) => void guardarEdicion(e)} className="space-y-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Nombre</label>
              <input
                className={inputCls}
                required
                value={formEdit.nombre}
                onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Email</label>
              <input
                className={inputCls}
                required
                type="email"
                value={formEdit.email}
                onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">Rol</label>
              <select
                className={inputCls}
                value={formEdit.rol}
                onChange={(e) => setFormEdit({ ...formEdit, rol: e.target.value as RolUsuario })}
              >
                <option value="TECNICO">TECNICO</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" className={btnSecondary} onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button className={btnPrimary} disabled={guardandoEdit}>
                <FiEdit size={15} /> {guardandoEdit ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
