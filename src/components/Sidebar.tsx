"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/ordenes", label: "Órdenes" },
  { href: "/clientes", label: "Clientes" },
  { href: "/equipos", label: "Equipos" },
  { href: "/repuestos", label: "Repuestos" },
  { href: "/pagos", label: "Pagos" },
  { href: "/usuarios", label: "Usuarios" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, logout, esAdmin } = useAuth();

  const links = LINKS.filter((l) => l.href !== "/usuarios" || esAdmin);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-950 text-zinc-200">
      <div className="px-5 py-5">
        <p className="text-lg font-bold text-white">CJ Reparaciones</p>
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
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activo
                  ? "bg-white text-zinc-900"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
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
          className="mt-3 w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
