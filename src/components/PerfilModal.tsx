import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Pencil, LogOut } from "lucide-react";
import { api, setUser, clearToken, clearUser, type StoredUser } from "../lib/api";


type Props = {
    onClose: () => void;
};

const fieldClass =
    "rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-2.5 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue";

const ROLES: Record<string, string> = {
    maestro: "Maestro/a",
    director: "Director/a",
    estudiante: "Estudiante",
};
const TIPOS_ESCUELA: Record<string, string> = { publica: "Pública", privada: "Privada" };
const GENEROS: Record<string, string> = {
    mujer: "Mujer",
    hombre: "Hombre",
    prefiero_no_decirlo: "Prefiero no decirlo",
};

export default function PerfilModal({ onClose }: Props) {
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState<StoredUser | null>(null);
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Campos editables
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [rol, setRol] = useState("");
    const [tipoEscuela, setTipoEscuela] = useState("");
    const [genero, setGenero] = useState("");
    const [gradoImparte, setGradoImparte] = useState("");
    const [nombreEscuela, setNombreEscuela] = useState("");
    const [estado, setEstado] = useState("");

    useEffect(() => {
        api.obtenerPerfil().then((data: StoredUser) => {
            setPerfil(data);
            cargarCampos(data);
        });
    }, []);

    function cargarCampos(data: StoredUser) {
        setNombre(data.nombre);
        setApellido(data.apellido);
        setRol(data.rol);
        setTipoEscuela(data.tipo_escuela);
        setGenero(data.genero);
        setGradoImparte(data.grado_imparte ?? "");
        setNombreEscuela(data.nombre_escuela ?? "");
        setEstado(data.estado ?? "");
    }

    async function handleGuardar() {
        setError(null);
        setGuardando(true);
        try {
            const actualizado = await api.actualizarPerfil({
                nombre,
                apellido,
                rol,
                tipo_escuela: tipoEscuela,
                genero,
                grado_imparte: gradoImparte || undefined,
                nombre_escuela: nombreEscuela || undefined,
                estado: estado || undefined,
            });
            setPerfil(actualizado);
            setUser(actualizado);
            setEditando(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar.");
        } finally {
            setGuardando(false);
        }
    }

    function handleCancelar() {
        if (perfil) cargarCampos(perfil);
        setEditando(false);
        setError(null);
    }

    function handleLogout() {
        clearToken();
        clearUser();
        navigate("/login");
    }

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-cuali-blue-dark/95 px-6 py-10"
            onClick={onClose}
        >
            {/* 20 círculos blancos difuminados sobre el fondo azul del overlay */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className={`overlay-blob overlay-blob-${i % 10}`} style={{ opacity: 0.12 + (i % 3) * 0.05 }} />
                ))}
            </div>

            {/* Tarjeta blanca */}
            <div
                className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="card-blob card-blob-1" />
                    <div className="card-blob card-blob-2" />
                    <div className="card-blob card-blob-3" />
                    <div className="card-blob-white card-blob-white-1" />
                    <div className="card-blob-white card-blob-white-2" />
                    <div className="card-blob-white card-blob-white-3" />
                    <div className="card-blob-white card-blob-white-4" />
                    <div className="card-blob-white card-blob-white-5" />
                </div>

                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 z-10 text-ink-soft transition hover:text-ink"
                >
                    <X size={20} />
                </button>

                {!perfil ? (
                    <p className="relative z-10 py-10 text-center text-sm text-ink-soft">Cargando…</p>
                ) : (
                    <div className="relative z-10">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cuali-blue text-lg font-semibold text-linen">
                                {perfil.nombre[0]?.toUpperCase()}
                                {perfil.apellido[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h2 className="font-serif text-xl font-semibold text-ink">
                                    {perfil.nombre} {perfil.apellido}
                                </h2>
                                <p className="text-sm text-ink-soft">{perfil.email}</p>
                            </div>
                        </div>

                        {!editando ? (
                            <>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-ink-soft">Rol</p>
                                        <p className="mt-1 font-medium text-ink">{ROLES[perfil.rol] ?? perfil.rol}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-ink-soft">Tipo de escuela</p>
                                        <p className="mt-1 font-medium text-ink">{TIPOS_ESCUELA[perfil.tipo_escuela] ?? perfil.tipo_escuela}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-ink-soft">Género</p>
                                        <p className="mt-1 font-medium text-ink">{GENEROS[perfil.genero] ?? perfil.genero}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-ink-soft">Grado que impartes</p>
                                        <p className="mt-1 font-medium text-ink">{perfil.grado_imparte ? `${perfil.grado_imparte}°` : "No especificado"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-ink-soft">Escuela</p>
                                        <p className="mt-1 font-medium text-ink">{perfil.nombre_escuela || "No especificado"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-ink-soft">Estado</p>
                                        <p className="mt-1 font-medium text-ink">{perfil.estado || "No especificado"}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setEditando(true)}
                                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark"
                                >
                                    <Pencil size={15} />
                                    Editar información
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-ink-soft">Nombre</span>
                                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={fieldClass} />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-ink-soft">Apellido</span>
                                    <input value={apellido} onChange={(e) => setApellido(e.target.value)} className={fieldClass} />
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-ink-soft">Rol</span>
                                    <select value={rol} onChange={(e) => setRol(e.target.value)} className={fieldClass}>
                                        <option value="maestro">Maestro/a</option>
                                        <option value="director">Director/a</option>
                                        <option value="estudiante">Estudiante</option>
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-ink-soft">Tipo de escuela</span>
                                    <select value={tipoEscuela} onChange={(e) => setTipoEscuela(e.target.value)} className={fieldClass}>
                                        <option value="publica">Pública</option>
                                        <option value="privada">Privada</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-ink-soft">Género</span>
                                    <select value={genero} onChange={(e) => setGenero(e.target.value)} className={fieldClass}>
                                        <option value="mujer">Mujer</option>
                                        <option value="hombre">Hombre</option>
                                        <option value="prefiero_no_decirlo">Prefiero no decirlo</option>
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-ink-soft">Grado que impartes</span>
                                    <select value={gradoImparte} onChange={(e) => setGradoImparte(e.target.value)} className={fieldClass}>
                                        <option value="">No aplica</option>
                                        {[1, 2, 3, 4, 5, 6].map((g) => (
                                            <option key={g} value={g}>{g}°</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-ink-soft">Nombre de la escuela</span>
                                    <input value={nombreEscuela} onChange={(e) => setNombreEscuela(e.target.value)} className={fieldClass} />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-ink-soft">Estado</span>
                                    <input value={estado} onChange={(e) => setEstado(e.target.value)} className={fieldClass} />
                                </label>

                                {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}

                                <div className="col-span-2 mt-2 flex gap-3">
                                    <button
                                        onClick={handleCancelar}
                                        className="flex-1 rounded-xl bg-cuali-blue-soft py-3 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleGuardar}
                                        disabled={guardando}
                                        className="flex-1 rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-60"
                                    >
                                        {guardando ? "Guardando…" : "Guardar cambios"}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 border-t border-black/5 pt-4">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                                <LogOut size={15} />
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .overlay-blob { position: absolute; border-radius: 9999px; background: white; filter: blur(60px); }
        .overlay-blob-0 { width: 200px; height: 200px; top: 5%; left: 8%; }
        .overlay-blob-1 { width: 160px; height: 160px; top: 15%; right: 12%; }
        .overlay-blob-2 { width: 220px; height: 220px; top: 35%; left: 40%; }
        .overlay-blob-3 { width: 140px; height: 140px; top: 8%; left: 60%; }
        .overlay-blob-4 { width: 180px; height: 180px; top: 55%; right: 8%; }
        .overlay-blob-5 { width: 210px; height: 210px; bottom: 10%; left: 15%; }
        .overlay-blob-6 { width: 150px; height: 150px; bottom: 20%; right: 30%; }
        .overlay-blob-7 { width: 190px; height: 190px; bottom: -5%; right: -3%; }
        .overlay-blob-8 { width: 130px; height: 130px; top: 60%; left: 5%; }
        .overlay-blob-9 { width: 170px; height: 170px; bottom: 35%; left: 50%; }

        .card-blob { position: absolute; border-radius: 9999px; background: var(--blue-light); filter: blur(55px); }
        .card-blob-1 { width: 160px; height: 160px; top: -60px; right: -50px; opacity: 0.3; }
        .card-blob-2 { width: 130px; height: 130px; bottom: -50px; left: -40px; opacity: 0.25; background: var(--lavender); }
        .card-blob-3 { width: 110px; height: 110px; top: 40%; right: -40px; opacity: 0.2; background: var(--sage); }
        .card-blob-white {
          position: absolute;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(200,220,245,0.35) 70%);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 4px 16px rgba(78, 122, 181, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.8);
          filter: blur(2px);
        }
        .card-blob-white-1 { width: 90px; height: 90px; top: 8%; left: 8%; }
        .card-blob-white-2 { width: 60px; height: 60px; top: 45%; left: 25%; }
        .card-blob-white-3 { width: 100px; height: 100px; bottom: 12%; right: 15%; }
        .card-blob-white-4 { width: 50px; height: 50px; top: 20%; right: 10%; }
        .card-blob-white-5 { width: 75px; height: 75px; bottom: 25%; left: 42%; }
      `}</style>
        </div>,
        document.body
    );
}