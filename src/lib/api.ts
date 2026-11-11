export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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

export type Adjunto = {
    url: string;
    filename: string;
    tipo: string;
    texto_extraido?: string | null;
    // URL temporal (firmada por el backend) para mostrar la vista previa
    // justo despues de subir. No se guarda: caduca en una hora.
    url_firmada?: string;
};

export type PlaneacionResumen = {
    id: string;
    grado: number;
    campo_formativo: string;
    contenido: string;
    grupo: string;
    tema: string;
    status: string;
    created_at: string;
};

export type ObjetivoRetroalimentacion = "mensaje" | "chat_mensaje" | "planeacion" | "recurso";

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
        // En produccion la app vive bajo /cuali.ai/: "/login" a secas mandaba
        // a la raiz del servidor, fuera de la aplicacion.
        window.location.href = `${import.meta.env.BASE_URL}login`;
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

export type MetodologiaId = "proyectos_comunitarios" | "indagacion_steam" | "abp" | "aprendizaje_servicio";
export type Escenario = "aula" | "escuela" | "comunidad";

export type ContextoPayload = {
    metodologia: MetodologiaId;
    escenario: Escenario;
    minutos_por_sesion: number;
    num_alumnos: number | null;
    problematica: string;
    recursos_disponibles: string;
    ajustes_razonables: string;
    ejes_articuladores: string[];
    periodo: string;
    usar_dias_semana: boolean;
    /** AAAA-MM-DD. Con ella el backend calcula el dia real de cada sesion. */
    fecha_inicio: string | null;
    integracion: {
        modo: "ninguna" | "sugerida" | "elegida";
        contenidos: VinculoElegido[];
    };
};

export type VinculoElegido = { campo: string; contenido: string };
export type SugerenciaVinculo = VinculoElegido & { razon: string };

export type VinculoDoc = {
    campo: string;
    contenido: string;
    pdas: string[];
    sesion: string;
    actividad: string;
    evidencia: string;
    /** La sesion ya describe el vinculo: no se repite debajo de ella. */
    en_sesion?: boolean;
};

type PlaneacionPayload = {
    grado: number;
    campo_formativo: string;
    contenido: string;
    pda: string;
    grupo: string;
    sesiones: number;
    tema: string;
    contexto: ContextoPayload;
};

export type ContenidoCatalogo = { contenido: string; pda: string };
export type CatalogoGrado = {
    grado: number;
    campos_formativos: { campo_formativo: string; contenidos: ContenidoCatalogo[] }[];
};

export type LibroSep = { grado: number | null; materia: string; libro: string };

export type ResultadoLibro = {
    libro: string;
    materia: string;
    grado: number | null;
    paginas: string;
    seccion: string;
    fragmento: string;
};

export type Visibilidad = "privado" | "comunidad";

export type DocumentoDocente = {
    id: string;
    titulo: string;
    campo: string | null;
    grado: number | null;
    visibilidad: Visibilidad;
    tipo: string;
    filename: string;
    url_firmada: string;
    autor: string;
    es_mio: boolean;
    created_at: string;
};

export type MomentoDoc = { minutos: number; texto: string };

export type SesionDoc = {
    etiqueta: string;
    fases: string[];
    inicio: MomentoDoc;
    desarrollo: MomentoDoc;
    cierre: MomentoDoc;
    recursos: string[];
    tarea: string;
    citas: string[];
    vinculos: string[];
};

export type DocumentoPlaneacion = {
    version: number;
    escuela: string;
    docente: string;
    periodo: string;
    grado: number;
    grupo: string;
    fase: number | null;
    campo: string;
    metodologia: MetodologiaId;
    metodologia_nombre: string;
    tiempo: string;
    escenario: string;
    ejes: string[];
    titulo_proyecto: string;
    contenido: string;
    pdas: string[];
    intencion_didactica: string;
    proposito: string;
    sesiones: SesionDoc[];
    evaluacion: { criterios: string[]; evidencias: string[]; instrumentos: string[] };
    rubrica: { indicador: string; sobresaliente: string; satisfactorio: string; en_proceso: string }[];
    fuentes: { id: string; libro: string; paginas: string; seccion: string }[];
    ajustes_razonables: string;
    integracion: VinculoDoc[];
    pendientes: string[];
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

    listarPlaneaciones: (): Promise<PlaneacionResumen[]> => request("/planeaciones"),

    enviarMensaje: (id: string, content: string, adjuntos: Adjunto[] = []) =>
        request(`/planeaciones/${id}/mensajes`, { method: "POST", body: JSON.stringify({ content, adjuntos }) }),

    enviarMensajeConversacion: (id: string, content: string, adjuntos: Adjunto[] = [], use_rag: boolean = true) =>
        request(`/conversaciones/${id}/mensajes`, { method: "POST", body: JSON.stringify({ content, adjuntos, use_rag }) }),

    generarPlaneacion: (id: string): Promise<{ docx_url: string; documento: DocumentoPlaneacion }> =>
        request(`/planeaciones/${id}/generar`, { method: "POST" }),

    gradosConCatalogo: (): Promise<{ grados: number[] }> => request("/catalogo"),

    obtenerCatalogo: (grado: number): Promise<CatalogoGrado> => request(`/catalogo/${grado}`),

    sugerirVinculos: (grado: number, campo: string, contenido: string, tema: string): Promise<SugerenciaVinculo[]> => {
        const params = new URLSearchParams({ grado: String(grado), campo, contenido, tema });
        return request(`/planeaciones/vinculos/sugerencias?${params.toString()}`);
    },

    listarLibros: (grado: number): Promise<LibroSep[]> => request(`/libros?grado=${grado}`),

    buscarEnLibros: (q: string, grado: number | null): Promise<ResultadoLibro[]> => {
        const params = new URLSearchParams({ q });
        if (grado) params.set("grado", String(grado));
        return request(`/libros/buscar?${params.toString()}`);
    },

    crearDocumentoDocente: (payload: {
        url: string;
        titulo: string;
        campo: string | null;
        grado: number | null;
        visibilidad: Visibilidad;
        acepto_condiciones: boolean;
    }): Promise<DocumentoDocente> => request("/documentos", { method: "POST", body: JSON.stringify(payload) }),

    misDocumentos: (): Promise<DocumentoDocente[]> => request("/documentos/mios"),

    documentosComunidad: (filtros: { campo?: string; grado?: number; q?: string }): Promise<DocumentoDocente[]> => {
        const params = new URLSearchParams();
        if (filtros.campo) params.set("campo", filtros.campo);
        if (filtros.grado) params.set("grado", String(filtros.grado));
        if (filtros.q) params.set("q", filtros.q);
        return request(`/documentos/comunidad?${params.toString()}`);
    },

    cambiarVisibilidadDocumento: (id: string, visibilidad: Visibilidad, acepto_condiciones: boolean): Promise<DocumentoDocente> =>
        request(`/documentos/${id}`, { method: "PATCH", body: JSON.stringify({ visibilidad, acepto_condiciones }) }),

    borrarDocumentoDocente: (id: string) => request(`/documentos/${id}`, { method: "DELETE" }),

    obtenerDocumento: (id: string): Promise<DocumentoPlaneacion> => request(`/planeaciones/${id}/documento`),

    editarDocumento: (id: string, documento: DocumentoPlaneacion): Promise<DocumentoPlaneacion> =>
        request(`/planeaciones/${id}/documento`, { method: "PUT", body: JSON.stringify(documento) }),

    obtenerPerfil: () => request("/auth/me"),

    forgotPassword: (email: string) =>
        request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

    resetPassword: (token: string, password: string, password_confirm: string) =>
        request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password, password_confirm }) }),

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

    async descargarDocxBlob(id: string): Promise<Blob> {
        const token = getToken();
        const res = await fetch(`${API_BASE}/planeaciones/${id}/docx`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new ApiError("No se pudo descargar el documento.", res.status);
        return res.blob();
    },

    /**
     * Descarga un archivo protegido con la sesion del usuario.
     * Se usa para mostrar imagenes adjuntas: una etiqueta <img src> no puede
     * mandar el token, asi que se pide el archivo con fetch y se muestra
     * como blob. El backend valida que el archivo sea del usuario.
     */
    async descargarArchivoBlob(url: string): Promise<Blob> {
        const token = getToken();
        const res = await fetch(`${API_BASE}${url}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new ApiError("No se pudo cargar el archivo.", res.status);
        return res.blob();
    },

    guardarRetroalimentacion: (payload: {
        objetivo_tipo: ObjetivoRetroalimentacion;
        objetivo_id: string;
        valor: 1 | -1;
        comentario?: string;
    }) => request("/retroalimentacion", { method: "PUT", body: JSON.stringify(payload) }),

    async subirArchivo(file: File): Promise<Adjunto> {
        const token = getToken();
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/archivos`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!res.ok) throw new ApiError("No se pudo subir el archivo.", res.status);
        return res.json();
    },

    crearConversacion: () => request("/conversaciones", { method: "POST" }),

    listarConversaciones: () => request("/conversaciones"),

    obtenerConversacion: (id: string) => request(`/conversaciones/${id}`),

    generarDiapositivas: (payload: {
        titulo: string;
        descripcion: string;
        tema_color: string;
        num_diapositivas: number;
        texto_adjunto?: string;
    }) => request("/recursos/diapositivas", { method: "POST", body: JSON.stringify(payload) }),

    async descargarPptxBlob(id: string): Promise<Blob> {
        const token = getToken();
        const res = await fetch(`${API_BASE}/recursos/diapositivas/${id}/pptx`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new ApiError("No se pudo descargar la presentación.", res.status);
        return res.blob();
    },

    generarCuestionario: (payload: {
        titulo: string;
        descripcion: string;
        tipo_preguntas: string;
        num_preguntas: number;
        texto_adjunto?: string;
    }) => request("/recursos/cuestionarios", { method: "POST", body: JSON.stringify(payload) }),

    ajustarCuestionario: (
        id: string,
        payload: {
            titulo: string;
            tipo_preguntas: string;
            num_preguntas: number;
            preguntas_actuales: unknown[];
            instrucciones: string;
        }
    ) => request(`/recursos/cuestionarios/${id}/ajustar`, { method: "POST", body: JSON.stringify(payload) }),

    async descargarCuestionarioDocxBlob(id: string): Promise<Blob> {
        const token = getToken();
        const res = await fetch(`${API_BASE}/recursos/cuestionarios/${id}/docx`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new ApiError("No se pudo descargar el cuestionario.", res.status);
        return res.blob();
    },

    generarMapaMental: (payload: { tema: string; resumen: string; texto_adjunto?: string }) =>
        request("/recursos/mapas-mentales", { method: "POST", body: JSON.stringify(payload) }),

    generarMemorama: (payload: { tema: string; num_pares: number; texto_adjunto?: string }) =>
        request("/recursos/juegos/memorama", { method: "POST", body: JSON.stringify(payload) }),

    generarSopaDeLetras: (payload: { tema: string; num_palabras: number; texto_adjunto?: string }) =>
        request("/recursos/juegos/sopa-de-letras", { method: "POST", body: JSON.stringify(payload) }),

    generarRuleta: (payload: { tema: string; num_preguntas: number; texto_adjunto?: string }) =>
        request("/recursos/juegos/ruleta", { method: "POST", body: JSON.stringify(payload) }),

    generarCrucigrama: (payload: { tema: string; num_palabras: number; texto_adjunto?: string }) =>
        request("/recursos/juegos/crucigrama", { method: "POST", body: JSON.stringify(payload) }),

    generarAhorcado: (payload: { tema: string; num_palabras: number; texto_adjunto?: string }) =>
        request("/recursos/juegos/ahorcado", { method: "POST", body: JSON.stringify(payload) }),

    generarVerdaderoFalso: (payload: { tema: string; num_afirmaciones: number; texto_adjunto?: string }) =>
        request("/recursos/juegos/verdadero-falso", { method: "POST", body: JSON.stringify(payload) }),

    generarCartel: (payload: { tema: string; descripcion: string; tema_color: string; texto_adjunto?: string }) =>
        request("/recursos/carteles", { method: "POST", body: JSON.stringify(payload) }),

    laboratorioMensaje: (payload: { historial: { role: string; content: string }[]; mensaje: string }) =>
        request("/recursos/laboratorio/mensaje", { method: "POST", body: JSON.stringify(payload) }),

    laboratorioGenerar: (payload: { historial: { role: string; content: string }[] }) =>
        request("/recursos/laboratorio/generar", { method: "POST", body: JSON.stringify(payload) }),

    async descargarLaboratorioDocxBlob(id: string): Promise<Blob> {
        const token = getToken();
        const res = await fetch(`${API_BASE}/recursos/laboratorio/${id}/docx`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new ApiError("No se pudo descargar el documento.", res.status);
        return res.blob();
    },

    listarPublicaciones: (params: { busqueda?: string; categoria?: string; alcance?: string }) => {
        const qs = new URLSearchParams();
        if (params.busqueda) qs.set("busqueda", params.busqueda);
        if (params.categoria) qs.set("categoria", params.categoria);
        if (params.alcance) qs.set("alcance", params.alcance);
        return request(`/comunidad/publicaciones?${qs.toString()}`);
    },

    crearPublicacion: (payload: { contenido: string; categoria?: string | null; visibilidad: string; imagenes: string[] }) =>
        request("/comunidad/publicaciones", { method: "POST", body: JSON.stringify(payload) }),

    editarPublicacion: (
        id: string,
        payload: Partial<{ contenido: string; categoria: string | null; visibilidad: string; imagenes: string[] }>
    ) => request(`/comunidad/publicaciones/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

    borrarPublicacion: (id: string) => request(`/comunidad/publicaciones/${id}`, { method: "DELETE" }),

    toggleLike: (id: string) => request(`/comunidad/publicaciones/${id}/like`, { method: "POST" }),

    listarComentarios: (publicacionId: string) => request(`/comunidad/publicaciones/${publicacionId}/comentarios`),

    crearComentario: (publicacionId: string, payload: { contenido: string; parent_id?: string | null }) =>
        request(`/comunidad/publicaciones/${publicacionId}/comentarios`, { method: "POST", body: JSON.stringify(payload) }),

    borrarComentario: (id: string) => request(`/comunidad/comentarios/${id}`, { method: "DELETE" }),
};