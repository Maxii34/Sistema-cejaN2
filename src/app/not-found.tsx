import Link from "next/link";
import { FiAlertTriangle, FiArrowLeft, FiHome } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200">
          <FiAlertTriangle size={28} />
        </p>
        <p className="font-ficha mt-4 text-5xl font-bold text-zinc-900">404</p>
        <h1 className="mt-2 text-xl font-bold text-zinc-900">
          Página no encontrada
        </h1>
        <p className="mt-1 text-sm font-normal text-zinc-600">
          La ruta que buscás no existe o fue movida. Volvé al panel o al
          ingreso de clientes y órdenes.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <FiHome size={15} /> Ir al panel
          </Link>
          <Link
            href="/ingreso"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <FiArrowLeft size={15} /> Ir a ingreso
          </Link>
        </div>
      </div>
    </div>
  );
}
