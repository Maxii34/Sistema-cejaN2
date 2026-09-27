"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiClipboard, FiDollarSign, FiLogIn, FiTool, FiZap } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { Card, inputCls, btnPrimary } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0c1428] p-4">
      <div className="hero-grid absolute inset-0" aria-hidden />
      <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" aria-hidden />
      <div className="absolute -right-16 bottom-1/4 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" aria-hidden />
      <div className="absolute left-1/2 top-0 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="mb-4 flex items-center justify-center gap-2.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 text-white shadow-[0_12px_28px_-10px_rgba(30,64,175,0.7)]">
            <FiZap size={24} strokeWidth={2.5} />
          </span>
          <div className="text-left">
            <p className="text-lg font-extrabold leading-tight text-white">
              CJ <span className="brand-text">Reparaciones</span>
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Sistema de taller
            </p>
          </div>
        </div>

        <Card className="relative overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-blue-800" aria-hidden />
          <h1 className="text-xl font-extrabold text-stone-900">
            Bienvenido de nuevo
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Ingresá con tu usuario del taller (ADMIN o TÉCNICO).
          </p>
          <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                Email
              </label>
              <input
                className={inputCls}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tecnico@taller.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                Contraseña
              </label>
              <input
                className={inputCls}
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}
            <button className={btnPrimary + " w-full"} disabled={cargando}>
              <FiLogIn size={17} />
              {cargando ? "Ingresando..." : "Ingresar al taller"}
            </button>
          </form>
        </Card>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: FiClipboard, label: "Órdenes" },
            { icon: FiTool, label: "Equipos" },
            { icon: FiDollarSign, label: "Pagos" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-xl bg-white/5 px-2 py-2.5 text-slate-300 ring-1 ring-inset ring-white/10 backdrop-blur"
            >
              <f.icon size={16} className="mx-auto text-blue-300" />
              <p className="mt-1 text-[11px] font-semibold">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
