"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ApiEnvelope, Usuario } from "@/lib/types";

interface LoginResponse {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
}

interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  esAdmin: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (raw) setUsuario(JSON.parse(raw));
    } catch {
      // sin sesión
    }
    setCargando(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<ApiEnvelope<LoginResponse>>(
      "/api/usuario/login",
      { email, password }
    );
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
    setUsuario(res.data.usuario);
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem("refreshToken");
    if (rt) {
      try {
        await api.post("/api/usuario/logout", { refreshToken: rt });
      } catch {
        // igual limpiamos sesión local
      }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("usuario");
    setUsuario(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthCtx>(
    () => ({
      usuario,
      cargando,
      login,
      logout,
      esAdmin: usuario?.rol === "ADMIN",
    }),
    [usuario, cargando, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function useRequireAuth() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!cargando && !usuario) router.replace("/login");
  }, [cargando, usuario, router]);
  return { usuario, cargando };
}
