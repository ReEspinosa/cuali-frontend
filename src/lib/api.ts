const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const TOKEN_KEY = "cuali_token";
const USER_KEY = "cuali_user";

export type StoredUser = {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    tipo_escuela: string;
    genero: string;
    grado_imparte: string | null;
    nombre_escuela: string | null;
    estado: string | null;
};

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}
export function setUser(user: StoredUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearUser() {
    localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function request(path: string, options: RequestInit = {}) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    if (res.status === 401 && path !== "/auth/login") {
        clearToken();
        clearUser();
        window.location.href = "/login";
        throw new ApiError("Sesión expirada.", 401);
    }

    if (!res.ok) {
        let detail = "Ocurrió un error inesperado.";
        try {
            const data = await res.json();
            // FastAPI a veces regresa detail como string, a veces como lista de errores de validación
            if (typeof data.detail === "string") detail = data.detail;
            else if (Array.isArray(data.detail)) detail = data.detail[0]?.msg ?? detail;
        } catch {
            // sin JSON en la respuesta, se queda el mensaje genérico
        }
        throw new ApiError(detail, res.status);
    }

    if (res.status === 204) return null;
    return res.json();
}

type RegisterPayload = {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    password_confirm: string;
    rol: string;
    tipo_escuela: string;
    genero: string;
    grado_imparte?: string;
    nombre_escuela?: string;
    estado?: string;
};

type PlaneacionPayload = {
    grado: number;
    campo_formativo: string;
    contenido: string;
    pda: string;
    grupo: string;
    sesiones: number;
    tema: string;
};

export const api = {
    register: (payload: RegisterPayload) =>
        request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

    verifyEmail: (email: string, code: string) =>
        request("/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) }),

    resendCode: (email: string) =>
        request("/auth/resend-code", { method: "POST", body: JSON.stringify({ email }) }),

    login: (email: string, password: string) =>
        request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

    crearPlaneacion: (payload: PlaneacionPayload) =>
        request("/planeaciones", { method: "POST", body: JSON.stringify(payload) }),

    obtenerPlaneacion: (id: string) => request(`/planeaciones/${id}`),

    enviarMensaje: (id: string, content: string) =>
        request(`/planeaciones/${id}/mensajes`, { method: "POST", body: JSON.stringify({ content }) }),

    generarPlaneacion: (id: string) => request(`/planeaciones/${id}/generar`, { method: "POST" }),

    obtenerPerfil: () => request("/auth/me"),

    actualizarPerfil: (payload: {
        nombre: string;
        apellido: string;
        rol: string;
        tipo_escuela: string;
        genero: string;
        grado_imparte?: string;
        nombre_escuela?: string;
        estado?: string;
    }) => request("/auth/me", { method: "PUT", body: JSON.stringify(payload) }),

    async descargarPdfBlob(id: string): Promise<Blob> {
        const token = getToken();
        const res = await fetch(`${API_BASE}/planeaciones/${id}/pdf`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new ApiError("No se pudo descargar el PDF.", res.status);
        return res.blob();
    },

};