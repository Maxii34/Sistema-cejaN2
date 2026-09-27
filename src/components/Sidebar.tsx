"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiDollarSign,
  FiHome,
  FiInbox,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiSettings,
  FiTool,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { href: "/", label: "Panel", icon: FiHome },
  { href: "/ingreso", label: "Ingreso", icon: FiInbox },
  { href: "/equipos", label: "Equipos", icon: FiTool, fullLabel: "Historial de equipos" },
  { href: "/pagos", label: "Pagos", icon: FiDollarSign },
  { href: "/usuarios", label: "Usuarios", icon: FiSettings },
];

// Tabs principales de la barra inferior móvil (mobile-first)
const TABS = [
  { href: "/", label: "Panel", icon: FiHome },
  { href: "/ingreso", label: "Ingreso", icon: FiInbox },
  { href: "/ordenes/nueva", label: "Nueva", icon: FiPlus, fab: true },
  { href: "/equipos", label: "Equipos", icon: FiTool },
  { href: "/pagos", label: "Pagos", icon: FiDollarSign },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, logout, esAdmin } = useAuth();
  const [abierto, setAbierto] = useState(false);

  const links = LINKS.filter((l) => l.href !== "/usuarios" || esAdmin);
  const inicial = (usuario?.nombre?.[0] ?? "C").toUpperCase();

  return (
    <>
      {/* Header móvil: sticky, compacto, con botón hamburguesa */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 lg:hidden">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white active:bg-zinc-800"
        >
          <FiMenu size={22} />
        </button>
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
          <FiSettings size={20} className="shrink-0 text-white" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold leading-tight text-white">
              CJ Reparaciones
            </span>
            <span className="block text-[11px] leading-tight text-zinc-400">
              Sistema de taller
            </span>
          </span>
        </Link>
        <span
          title={usuario?.nombre ?? ""}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-zinc-900"
        >
          {inicial}
        </span>
      </header>

      {/* Sidebar escritorio (se mantiene para pantallas grandes) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-950 text-zinc-200 lg:flex">
        <div className="px-5 py-5">
          <p className="flex items-center gap-2 text-lg font-bold text-white">
            <FiSettings size={20} /> CJ Reparaciones
          </p>
          <p className="text-xs text-zinc-300">Sistema de reparación</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => {
            const activo = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-white text-zinc-900"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <l.icon size={16} />
                {"fullLabel" in l && l.fullLabel ? l.fullLabel : l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-800 p-4">
          <p className="truncate text-sm font-medium text-white">
            {usuario?.nombre ?? "—"}
          </p>
          <p className="truncate text-xs text-zinc-300">
            {usuario?.email} · {usuario?.rol}
          </p>
          <button
            onClick={() => void logout()}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <FiLogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay + drawer móvil */}
      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setAbierto(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-zinc-950 text-zinc-200 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4">
              <p className="flex items-center gap-2 text-base font-bold text-white">
                <FiSettings size={19} /> CJ Reparaciones
              </p>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-300 active:bg-zinc-800"
              >
                <FiX size={22} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
              {links.map((l) => {
                const activo = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setAbierto(false)}
                    className={`flex min-h-[48px] items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium ${
                      activo
                        ? "bg-white text-zinc-900"
                        : "text-zinc-200 active:bg-zinc-800"
                    }`}
                  >
                    <l.icon size={18} />
                    {"fullLabel" in l && l.fullLabel ? l.fullLabel : l.label}
                  </Link>
                );
              })}
              <Link
                href="/ordenes/nueva"
                onClick={() => setAbierto(false)}
                className="flex min-h-[48px] items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-[15px] font-medium text-white active:bg-zinc-800"
              >
                <FiPlus size={18} /> Nueva recepción
              </Link>
            </nav>
            <div className="border-t border-zinc-800 p-4">
              <p className="truncate text-sm font-medium text-white">
                {usuario?.nombre ?? "—"}
              </p>
              <p className="truncate text-xs text-zinc-400">
                {usuario?.email} · {usuario?.rol}
              </p>
              <button
                onClick={() => {
                  setAbierto(false);
                  void logout();
                }}
                className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 px-3 py-2.5 text-[15px] font-medium text-white active:bg-zinc-700"
              >
                <FiLogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra inferior móvil: navegación con el pulgar */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5">
          {TABS.map((t) => {
            const activo = isActive(pathname, t.href);
            if ("fab" in t && t.fab) {
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-label="Nueva recepción"
                  className="flex flex-col items-center justify-center gap-0.5 py-1.5"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg ${
                      activo ? "bg-zinc-900 text-white" : "bg-zinc-900 text-white"
                    }`}
                  >
                    <FiPlus size={22} />
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-900">
                    {t.label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 py-1.5 ${
                  activo ? "text-zinc-900" : "text-zinc-500"
                }`}
              >
                <t.icon size={21} />
                <span className="text-[10px] font-medium">{t.label}</span>
                <span
                  className={`h-1 w-8 rounded-full ${activo ? "bg-zinc-900" : "bg-transparent"}`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
