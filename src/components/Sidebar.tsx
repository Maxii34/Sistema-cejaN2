"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiClipboard,
  FiDollarSign,
  FiHome,
  FiInbox,
  FiLogOut,
  FiPackage,
  FiSettings,
  FiTool,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { href: "/", label: "Panel", icon: FiHome },
  { href: "/recepcion", label: "Recepción", icon: FiInbox },
  { href: "/ordenes", label: "Órdenes", icon: FiClipboard },
  { href: "/clientes", label: "Clientes", icon: FiUsers },
  { href: "/equipos", label: "Historial de equipos", icon: FiTool },
  { href: "/repuestos", label: "Repuestos", icon: FiPackage },
  { href: "/pagos", label: "Pagos", icon: FiDollarSign },
  { href: "/usuarios", label: "Usuarios", icon: FiSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, logout, esAdmin } = useAuth();

  const links = LINKS.filter((l) => l.href !== "/usuarios" || esAdmin);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-950 text-zinc-200">
      <div className="px-5 py-5">
        <p className="flex items-center gap-2 text-lg font-bold text-white">
          <FiSettings size={20} /> CJ Reparaciones
        </p>
        <p className="text-xs text-zinc-300">Sistema de reparación</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((l) => {
          const activo =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
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
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <p className="truncate text-sm font-medium text-white">
          {usuario?.nombre ?? "—"}
        </p>
        <p className="text-xs text-zinc-300">
          {usuario?.email} · {usuario?.rol}
        </p>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <FiLogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
