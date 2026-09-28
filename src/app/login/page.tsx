"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiClipboard, FiDollarSign, FiEye, FiEyeOff, FiLogIn, FiTool, FiZap } from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { Card, inputCls, btnPrimary } from "@/components/ui";
import { Reveal } from "@/components/motion";

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

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email.trim(), password);
      void Toast.fire({
        icon: "success",
        title: "Sesión iniciada",
        text: "Bienvenido al taller.",
      });
      router.replace("/");
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo iniciar sesión";
      setError(mensaje);
      void Toast.fire({ icon: "error", title: "No se pudo ingresar", text: mensaje });
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

      <Reveal className="relative w-full max-w-sm" y={20}>
        <div className="mb-4 flex items-center justify-center gap-2.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 text-white shadow-[0_12px_28px_-10px_rgba(30,64,175,0.7)]">
            <FiZap size={24} strokeWidth={2.5} />
          </span>
          <div className="text-left">
            <p className="text-lg font-extrabold leading-tight text-white">
              Ceja Adulto <span className="brand-text">N2</span>
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Taller de reparaciones
            </p>
          </div>
        </div>

        <Card className="relative overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-blue-800" aria-hidden />
          <h1 className="text-xl font-extrabold text-stone-900">
            Bienvenido de nuevo
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Accedé al sistema para gestionar recepciones, equipos y pagos del taller.
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
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  type={verPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="inline-flex min-h-[44px] min-w-[48px] shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-500 shadow-sm active:bg-stone-100"
                >
                  {verPassword ? <FiEyeOff size={19} /> : <FiEye size={19} />}
                </button>
              </div>
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
      </Reveal>
    </div>
  );
}
