import type { ReactNode } from "react";

/**
 * Campo de formulario: label + input + error por campo.
 * Mantiene las clases y textos del proyecto; solo agrega el <p> de error.
 */
export function Field({
  id,
  label,
  required = false,
  marca,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  marca?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500"
      >
        {label}{" "}
        {required && <span className="font-bold text-red-600">*</span>}
        {marca}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
