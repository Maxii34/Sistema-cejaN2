"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiDollarSign,
  FiHome,
  FiInbox,
  FiLogOut,
  FiMail,
  FiMenu,
  FiPlus,
  FiSettings,
  FiTool,
  FiX,
  FiZap,
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

function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 text-white shadow-[0_8px_18px_-8px_rgba(30,64,175,0.7)]`}
    >
      <FiZap size={size === "lg" ? 22 : 18} strokeWidth={2.5} />
    </span>
  );
}

function UserCard({ alSalir, compacto = false }: { alSalir: () => void; compacto?: boolean }) {
  const { usuario, esAdmin } = useAuth();
  const inicial = (usuario?.nombre?.[0] ?? "C").toUpperCase();
  return (
    <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-900">
          {inicial}
          <span
            title="En línea"
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#131f3a]"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-bold text-white">
              {usuario?.nombre ?? "—"}
            </span>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-inset ${
                esAdmin
                  ? "bg-amber-400/15 text-amber-300 ring-amber-400/30"
                  : "bg-blue-400/15 text-blue-300 ring-blue-400/30"
              }`}
            >
              {usuario?.rol ?? "—"}
            </span>
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-slate-400">
            <FiMail size={11} className="shrink-0" />
            <span className="truncate">{usuario?.email ?? ""}</span>
          </p>
        </div>
      </div>
      <button
        onClick={alSalir}
        className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 font-semibold text-red-200 ring-1 ring-inset ring-red-400/20 hover:bg-red-500/20 ${
          compacto ? "min-h-[48px] py-2.5 text-[15px]" : "min-h-[44px] py-2 text-sm"
        }`}
      >
        <FiLogOut size={compacto ? 16 : 15} />
        Cerrar sesión
      </button>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, logout, esAdmin } = useAuth();
  const [abierto, setAbierto] = useState(false);

  const links = LINKS.filter((l) => l.href !== "/usuarios" || esAdmin);
  const inicial = (usuario?.nombre?.[0] ?? "C").toUpperCase();

  return (
    <>
      {/* Header móvil */}
      <header className="sticky top-0 z-40 flex items-center gap-2.5 border-b border-white/10 bg-gradient-to-r from-[#0c1428] via-[#14224a] to-[#0c1428] px-3 py-2.5 text-zinc-200 lg:hidden">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white active:bg-white/10"
        >
          <FiMenu size={22} />
        </button>
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5">
          <BrandMark />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-extrabold leading-tight text-white">
              Ceja Adulto <span className="brand-text">N2</span>
            </span>
            <span className="block text-[11px] font-medium leading-tight text-slate-400">
              Taller · Ingreso y órdenes
            </span>
          </span>
        </Link>
        <span
          title={usuario?.nombre ?? ""}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-900 ring-2 ring-white/20"
        >
          {inicial}
        </span>
      </header>

      {/* Sidebar escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-[#0c1428] via-[#111d3d] to-[#0c1428] text-zinc-200 lg:flex">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <BrandMark size="lg" />
          <div>
            <p className="text-lg font-extrabold leading-tight text-white">
              Ceja Adulto <span className="brand-text">N2</span>
            </p>
            <p className="text-xs font-medium text-slate-400">Taller de reparaciones</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => {
            const activo = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  activo
                    ? "bg-white/10 text-white ring-1 ring-inset ring-white/15"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <l.icon size={17} className={activo ? "text-blue-300" : ""} />
                {"fullLabel" in l && l.fullLabel ? l.fullLabel : l.label}
              </Link>
            );
          })}
          <Link
            href="/ordenes/nueva"
            className="brand-btn mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <FiPlus size={16} strokeWidth={2.5} /> Nueva recepción
          </Link>
        </nav>
        <div className="border-t border-white/10 p-4">
          <UserCard alSalir={() => void logout()} />
        </div>
      </aside>

      {/* Overlay + drawer móvil */}
      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
            onClick={() => setAbierto(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col bg-gradient-to-b from-[#0c1428] via-[#111d3d] to-[#0c1428] text-zinc-200 shadow-2xl">
            <div className="flex items-center gap-2.5 px-4 py-4">
              <BrandMark />
              <p className="min-w-0 flex-1 text-base font-extrabold text-white">
                Ceja Adulto <span className="brand-text">N2</span>
              </p>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 active:bg-white/10"
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
                    className={`flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold ${
                      activo
                        ? "bg-white/10 text-white ring-1 ring-inset ring-white/15"
                        : "text-slate-200 active:bg-white/10"
                    }`}
                  >
                    <l.icon size={19} className={activo ? "text-blue-300" : ""} />
                    {"fullLabel" in l && l.fullLabel ? l.fullLabel : l.label}
                  </Link>
                );
              })}
              <Link
                href="/ordenes/nueva"
                onClick={() => setAbierto(false)}
                className="brand-btn mt-1 flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-[15px] font-semibold text-white"
              >
                <FiPlus size={19} strokeWidth={2.5} /> Nueva recepción
              </Link>
            </nav>
            <div className="border-t border-white/10 p-4">
              <UserCard
                compacto
                alSalir={() => {
                  setAbierto(false);
                  void logout();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Barra inferior móvil */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
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
                  <span className="brand-btn -mt-6 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-800 p-3.5 text-white ring-4 ring-[#eef2f7]">
                    <FiPlus size={24} strokeWidth={2.5} />
                  </span>
                  <span className="text-[10px] font-bold text-blue-800">
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
                  activo ? "text-blue-800" : "text-stone-400"
                }`}
              >
                <t.icon size={21} strokeWidth={activo ? 2.5 : 2} />
                <span className="text-[10px] font-semibold">{t.label}</span>
                <span
                  className={`h-1 w-8 rounded-full ${activo ? "bg-blue-800" : "bg-transparent"}`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
