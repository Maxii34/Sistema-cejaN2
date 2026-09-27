"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiShield, FiUserPlus } from "react-icons/fi";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Badge, Empty, btnPrimary, inputCls, IconTile } from "@/components/ui";
import type { ApiEnvelope, Usuario } from "@/lib/types";

export default function UsuariosPage() {
  const { usuario, cargando, esAdmin } = useRequireAuth();
  const router = useRouter();
  const [lista, setLista] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("TECNICO");

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
      await api.post("/api/usuario", { nombre, email, password, rol });
      setNombre(""); setEmail(""); setPassword("");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear (recordá: solo 1 ADMIN)");
    }
  };

  if (cargando || !usuario) return <p className="p-8">Cargando...</p>;
  if (!esAdmin) return <p className="p-8">Solo administradores.</p>;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader eyebrow="Administración" titulo="Usuarios" descripcion="Solo ADMIN. El backend permite un único administrador." />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[1fr_320px]">
          <Card className="order-last lg:order-none">
            {lista.length === 0 ? <Empty mensaje="Sin usuarios" /> : (
              <ul className="divide-y divide-zinc-100 text-sm">
                {lista.map((u) => (
                  <li key={u.id} className="flex flex-col gap-1.5 py-2.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <span className="flex min-w-0 items-center gap-2">
                      <FiUserPlus size={15} className="shrink-0 text-zinc-400" />
                      <span className="truncate">{u.nombre} · {u.email}</span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <Badge tono={u.rol === "ADMIN" ? "violet" : "blue"}>{u.rol}</Badge>
                      <Badge tono={u.activo ? "green" : "zinc"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="order-first lg:order-none">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="violet"><FiShield size={16} /></IconTile> Nuevo usuario
            </h2>
            <form onSubmit={(e) => void crear(e)} className="mt-2 space-y-2">
              <input className={inputCls} required placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              <input className={inputCls} required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inputCls} required type="password" minLength={6} placeholder="Contraseña (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <select className={inputCls} value={rol} onChange={(e) => setRol(e.target.value)}>
                <option value="TECNICO">TECNICO</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button className={btnPrimary + " w-full gap-2"}>
                <FiUserPlus size={15} /> Crear
              </button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
