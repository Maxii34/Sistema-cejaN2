"use client";

import Link from "next/link";
import {
  FiBookOpen,
  FiCheckCircle,
  FiClipboard,
  FiDollarSign,
  FiPlus,
  FiRefreshCw,
  FiTool,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useRequireAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, IconTile, CargandoPagina } from "@/components/ui";
import { Reveal } from "@/components/motion";

function Paso({ n, titulo, texto }: { n: number; titulo: string; texto: string }) {
  return (
    <li className="flex gap-3 border-b border-dashed border-stone-200 pb-3 last:border-0 last:pb-0">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-800 text-[13px] font-extrabold text-white">
        {n}
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-stone-900">{titulo}</span>
        <span className="block text-sm text-stone-500">{texto}</span>
      </span>
    </li>
  );
}

export default function ManualPage() {
  const { usuario, cargando } = useRequireAuth();

  if (cargando || !usuario) return <CargandoPagina />;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 pb-28 sm:p-6 lg:pb-6">
        <PageHeader
          eyebrow="Ayuda"
          titulo="Manual de uso"
          descripcion="Cómo trabaja el taller día a día, explicado paso a paso."
        />

        <Reveal className="columns-1 gap-3 sm:gap-4 lg:columns-2">
          <Card className="mb-3 break-inside-avoid shadow-md transition-all duration-200 sm:mb-4 sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.4)]">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="brand"><FiRefreshCw size={16} /></IconTile> El recorrido de un equipo
            </h2>
            <ol className="mt-3 space-y-3">
              <Paso n={1} titulo="Registrá al cliente" texto="En Ingreso, con el alta rápida (nombre, DNI y teléfono). Después podés completar sus datos desde su ficha." />
              <Paso n={2} titulo="Cargale su equipo" texto="En la ficha del cliente, botón Agregar equipo: tipo, marca, modelo y número de serie." />
              <Paso n={3} titulo="Creá la recepción" texto="Con el botón + o Nueva recepción. Elegí cliente y número de serie, describí la falla y el estado en que llega el aparato." />
              <Paso n={4} titulo="Diagnóstico" texto="El técnico revisa el equipo, anota qué encontró y qué probó. La orden pasa a En diagnóstico." />
              <Paso n={5} titulo="Autorización" texto="Se le avisa al cliente. Si acepta, pasa a En reparación; si falta un repuesto, queda En espera." />
              <Paso n={6} titulo="Reparación" texto="Se anota qué se arregló y la mano de obra. La orden queda Lista." />
              <Paso n={7} titulo="Cobro y entrega" texto="Se carga el precio final, se cobra en Pagos y se entrega marcando la conformidad del cliente." />
            </ol>
          </Card>

          <Card className="mb-3 break-inside-avoid shadow-md transition-all duration-200 sm:mb-4 sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.4)]">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="blue"><FiTool size={16} /></IconTile> Fases de una orden
            </h2>
            <p className="mt-2 border-b border-dashed border-stone-200 pb-2 text-sm text-stone-500">
              La ficha de cada orden se completa por etapas: solo se habilita la fase que corresponde al estado actual. Las anteriores quedan guardadas y visibles, las siguientes bloqueadas hasta que avances.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-inset ring-stone-200/60"><b>1 · Diagnóstico:</b> qué tiene el equipo y qué se probó.</li>
              <li className="rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-inset ring-stone-200/60"><b>2 · Autorización:</b> el cliente acepta o se espera un repuesto.</li>
              <li className="rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-inset ring-stone-200/60"><b>3 · Reparación:</b> qué se arregló y cuánto sale la mano de obra.</li>
              <li className="rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-inset ring-stone-200/60"><b>4 · Cierre:</b> precio final, cobro y entrega con conformidad.</li>
            </ul>
          </Card>

          <Card className="mb-3 break-inside-avoid shadow-md transition-all duration-200 sm:mb-4 sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.4)]">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="green"><FiDollarSign size={16} /></IconTile> Cobros
            </h2>
            <ol className="mt-3 space-y-3">
              <Paso n={1} titulo="Elegí la orden" texto="Al elegirla ves su precio, lo ya cobrado y el saldo. El monto se completa solo con lo que falta." />
              <Paso n={2} titulo="Registrá el cobro" texto="Elegí el medio de pago y tocá Registrar. El sistema no deja cobrar de más." />
              <Paso n={3} titulo="Volvé a la orden" texto="Con el botón Volver, la ficha ya muestra lo cobrado y el estado del pago." />
            </ol>
            <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-[13px] text-blue-900 ring-1 ring-inset ring-blue-200/60">
              Tip: desde la ficha, el botón “Ir a cobrar esta orden” te lleva a Pagos con todo ya cargado.
            </p>
          </Card>

          <Card className="mb-3 break-inside-avoid shadow-md transition-all duration-200 sm:mb-4 sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.4)]">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="violet"><FiClipboard size={16} /></IconTile> Garantías y reingresos
            </h2>
            <p className="mt-2 border-b border-dashed border-stone-200 pb-2 text-sm text-stone-500">
              Si un equipo vuelve porque falló lo mismo dentro de la garantía (90 días desde la entrega):
            </p>
            <ol className="mt-3 space-y-3">
              <Paso n={1} titulo="Buscalo en Historial" texto="Su tarjeta muestra si tiene garantía vigente." />
              <Paso n={2} titulo="Tocá el + verde" texto="La recepción se crea marcada como garantía, vinculada a la orden anterior." />
              <Paso n={3} titulo="Ojo con duplicados" texto="Si el equipo ya tiene una orden abierta, el sistema no deja crear otra: te lleva a la orden que ya está en curso." />
            </ol>
          </Card>

          <Card className="mb-3 break-inside-avoid shadow-md transition-all duration-200 sm:mb-4 sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.4)]">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="blue"><FiUsers size={16} /></IconTile> Clientes y equipos
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li className="flex gap-2 border-b border-dashed border-stone-200/80 pb-2 last:border-0 last:pb-0"><FiCheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" /> En <b>Ingreso</b> están todos los clientes: buscá por nombre, DNI o teléfono, abrí la ficha o eliminá.</li>
              <li className="flex gap-2 border-b border-dashed border-stone-200/80 pb-2 last:border-0 last:pb-0"><FiCheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" /> En la <b>ficha del cliente</b> ves sus datos y su tabla de equipos con serie, fecha de ingreso y estado.</li>
              <li className="flex gap-2 border-b border-dashed border-stone-200/80 pb-2 last:border-0 last:pb-0"><FiCheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" /> En <b>Historial de equipos</b> ves cada aparato con foto, cliente y todas sus visitas al taller.</li>
            </ul>
          </Card>

          <Card className="mb-3 break-inside-avoid shadow-md transition-all duration-200 sm:mb-4 sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_36px_-18px_rgba(30,64,175,0.4)]">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <IconTile tono="brand"><FiUser size={16} /></IconTile> Roles y accesos rápidos
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li className="flex gap-2 border-b border-dashed border-stone-200/80 pb-2 last:border-0 last:pb-0"><FiCheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" /> Hay dos roles: <b>ADMIN</b> (todo, incluso Usuarios) y <b>TÉCNICO</b> (trabajo diario del taller).</li>
              <li className="flex gap-2 border-b border-dashed border-stone-200/80 pb-2 last:border-0 last:pb-0"><FiCheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" /> El botón <b>+</b> de abajo abre siempre una nueva recepción.</li>
              <li className="flex gap-2 border-b border-dashed border-stone-200/80 pb-2 last:border-0 last:pb-0"><FiCheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" /> En el <b>Panel</b> ves el resumen y las últimas órdenes con cliente, técnico y horarios.</li>
              <li className="flex gap-2 border-b border-dashed border-stone-200/80 pb-2 last:border-0 last:pb-0"><FiPlus size={15} className="mt-0.5 shrink-0 text-emerald-600" /> ¿Dudas? Este manual está siempre al final del menú lateral: <Link href="/manual" className="font-semibold text-blue-800 hover:underline">Manual de uso</Link>.</li>
            </ul>
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-[13px] text-stone-500 ring-1 ring-inset ring-stone-200/60">
              <FiBookOpen size={14} className="shrink-0 text-blue-700" /> Si algo no te deja avanzar, leé el mensaje en pantalla: siempre dice qué falta completar.
            </p>
          </Card>
        </Reveal>
      </main>
    </div>
  );
}
