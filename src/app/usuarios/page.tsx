"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Badge, Empty, btnPrimary, inputCls } from "@/components/ui";
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
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader titulo="Usuarios" descripcion="Solo ADMIN. El backend permite un único administrador." />
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            {lista.length === 0 ? <Empty mensaje="Sin usuarios" /> : (
              <ul className="divide-y divide-zinc-100 text-sm">
                {lista.map((u) => (
                  <li key={u.id} className="flex items-center justify-between py-2">
                    <span>{u.nombre} · {u.email}</span>
                    <span className="flex gap-2">
                      <Badge tono={u.rol === "ADMIN" ? "violet" : "blue"}>{u.rol}</Badge>
                      <Badge tono={u.activo ? "green" : "zinc"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">Nuevo usuario</h2>
            <form onSubmit={(e) => void crear(e)} className="mt-2 space-y-2">
              <input className={inputCls} required placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              <input className={inputCls} required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inputCls} required type="password" minLength={6} placeholder="Contraseña (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <select className={inputCls} value={rol} onChange={(e) => setRol(e.target.value)}>
                <option value="TECNICO">TECNICO</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button className={btnPrimary + " w-full"}>Crear</button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
