const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/** Mensaje amable para el usuario. Si el backend ya explicó el problema
 *  (validaciones, saldo, garantía), se respeta; si no, mensaje general
 *  sin códigos ni rutas. El detalle técnico va a la consola. */
function mensajeError(status: number, body: unknown, path: string): string {
  const b = body as { mensaje?: unknown; message?: unknown } | null;
  if (typeof b?.mensaje === "string" && b.mensaje.trim()) return b.mensaje;
  // eslint-disable-next-line no-console
  console.error(`API ${status} ${path}`, b);
  switch (status) {
    case 400:
      return "Revisá los datos ingresados e intentá de nuevo.";
    case 401:
      return "Tu sesión venció. Ingresá de nuevo.";
    case 403:
      return "No tenés permiso para hacer esto.";
    case 404:
      return "No se encontró lo que buscabas.";
    case 409:
      return "Esa información ya existe o entra en conflicto con otra.";
    case 500:
    case 502:
    case 503:
      return "Ocurrió un problema en el servidor. Intentá de nuevo en unos minutos.";
    default:
      return "Ocurrió un problema. Intentá de nuevo.";
  }
}

function errorRed(mensaje = "No hay conexión con el servidor. Revisá tu internet e intentá de nuevo.") {
  // eslint-disable-next-line no-console
  console.error(`API red: ${mensaje}`);
  return new Error(mensaje);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw errorRed();
  }

  if (res.status === 401 && retry && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        const r = await fetch(`${API_URL}/api/usuario/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (r.ok) {
          const body = await r.json();
          localStorage.setItem("accessToken", body.data.accessToken);
          localStorage.setItem("refreshToken", body.data.refreshToken);
          return apiFetch<T>(path, options, false);
        }
      } catch {
        // cae al logout
      }
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("usuario");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mensajeError(res.status, body, path));
  }
  return body as T;
}

/**
 * POST multipart para subir archivos (fotos a Cloudinary vía backend).
 * No fija Content-Type: el navegador agrega el boundary solo.
 * Incluye el Bearer token y el reintento de refresh ante 401.
 */
export async function apiPostArchivos<T>(path: string, archivos: File[], campo = "fotos"): Promise<T> {
  const form = new FormData();
  for (const a of archivos) form.append(campo, a);
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw errorRed();
  }
  if (res.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        const r = await fetch(`${API_URL}/api/usuario/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (r.ok) {
          const renovado = await r.json();
          localStorage.setItem("accessToken", renovado.data.accessToken);
          localStorage.setItem("refreshToken", renovado.data.refreshToken);
          return apiPostArchivos<T>(path, archivos, campo);
        }
      } catch {
        // cae al flujo normal de error
      }
    }
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mensajeError(res.status, body, path));
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
  postFotos: <T>(path: string, archivos: File[]) => apiPostArchivos<T>(path, archivos, "fotos"),
};

export { API_URL };
