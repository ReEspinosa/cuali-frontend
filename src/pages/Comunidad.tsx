import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, ImagePlus, MessageCircle, Plus, Search, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import PublicacionModal, { type PublicacionDetalle } from "../components/PublicacionModal";
import { api, API_BASE } from "../lib/api";

const CATEGORIAS = ["Recursos", "Ideas", "Preguntas", "Celebraciones"];
const COLORES_SIN_IMAGEN: Record<string, string> = {
    Recursos: "#4E7AB5",
    Ideas: "#4E9A8B",
    Preguntas: "#6B5CA5",
    Celebraciones: "#C1698A",
};

function ModalCrearPublicacion({
                                   onClose,
                                   onCreada,
                               }: {
    onClose: () => void;
    onCreada: (pub: PublicacionDetalle) => void;
}) {
    const [contenido, setContenido] = useState("");
    const [categoria, setCategoria] = useState<string | null>(null);
    const [visibilidad, setVisibilidad] = useState<"publico" | "escuela">("publico");
    const [imagenes, setImagenes] = useState<string[]>([]);
    const [subiendo, setSubiendo] = useState(false);
    const [publicando, setPublicando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleImagenes(files: FileList | null) {
        if (!files || files.length === 0) return;
        setSubiendo(true);
        try {
            const subidas = await Promise.all(
                Array.from(files).map(async (f) => {
                    const r = await api.subirArchivo(f);
                    return r.url;
                })
            );
            setImagenes((prev) => [...prev, ...subidas]);
        } catch {
            setError("No se pudieron subir algunas imágenes.");
        } finally {
            setSubiendo(false);
        }
    }

    async function handlePublicar() {
        if (!contenido.trim()) {
            setError("Escribe algo antes de publicar.");
            return;
        }
        setError(null);
        setPublicando(true);
        try {
            const pub: PublicacionDetalle = await api.crearPublicacion({
                contenido: contenido.trim(),
                categoria,
                visibilidad,
                imagenes,
            });
            onCreada(pub);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo publicar.");
        } finally {
            setPublicando(false);
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="font-serif text-xl font-semibold text-ink">Nueva publicación</h2>
                    <button onClick={onClose} className="text-ink-soft hover:text-ink">
                        <X size={18} />
                    </button>
                </div>

                <textarea
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    rows={4}
                    placeholder="¿Qué quieres compartir con otros maestros?"
                    className="mb-4 w-full resize-none rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                />

                {imagenes.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {imagenes.map((url, i) => (
                            <div key={i} className="relative h-16 w-16">
                                <img src={`${API_BASE}${url}`} alt="" className="h-16 w-16 rounded-lg object-cover" />
                                <button
                                    onClick={() => setImagenes((prev) => prev.filter((_, j) => j !== i))}
                                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                                >
                                    <X size={11} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImagenes(e.target.files)}
                />
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={subiendo}
                    className="mb-5 flex items-center gap-2 rounded-xl border border-dashed border-cuali-blue-light px-4 py-2.5 text-sm text-ink-soft transition hover:border-cuali-blue hover:text-ink"
                >
                    <ImagePlus size={15} />
                    {subiendo ? "Subiendo…" : "Agregar imágenes"}
                </button>

                <p className="mb-2 text-sm font-semibold text-ink">Categoría (opcional)</p>
                <div className="mb-5 flex flex-wrap gap-2">
                    {CATEGORIAS.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCategoria(categoria === c ? null : c)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                categoria === c ? "bg-cuali-blue text-linen" : "bg-cuali-blue-soft text-ink hover:bg-cuali-blue-light"
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                <p className="mb-2 text-sm font-semibold text-ink">¿Quién puede verlo?</p>
                <div className="mb-6 flex gap-2">
                    <button
                        onClick={() => setVisibilidad("publico")}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                            visibilidad === "publico" ? "bg-cuali-blue text-linen" : "bg-cuali-blue-soft text-ink"
                        }`}
                    >
                        Público
                    </button>
                    <button
                        onClick={() => setVisibilidad("escuela")}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                            visibilidad === "escuela" ? "bg-cuali-blue text-linen" : "bg-cuali-blue-soft text-ink"
                        }`}
                    >
                        Solo mi escuela
                    </button>
                </div>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                <button
                    onClick={handlePublicar}
                    disabled={publicando}
                    className="w-full rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-50"
                >
                    {publicando ? "Publicando…" : "Publicar"}
                </button>
            </div>
        </div>,
        document.body
    );
}

export default function Comunidad() {
    const [publicaciones, setPublicaciones] = useState<PublicacionDetalle[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState<string | null>(null);
    const [alcance, setAlcance] = useState<"todo" | "escuela">("todo");
    const [modalCrear, setModalCrear] = useState(false);
    const [seleccionada, setSeleccionada] = useState<PublicacionDetalle | null>(null);

    async function cargar() {
        setCargando(true);
        try {
            const data: PublicacionDetalle[] = await api.listarPublicaciones({
                busqueda: busqueda || undefined,
                categoria: categoria || undefined,
                alcance,
            });
            setPublicaciones(data);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoria, alcance]);

    useEffect(() => {
        const t = setTimeout(cargar, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda]);

    async function handleLikeRapido(pub: PublicacionDetalle) {
        const data: { le_gusta: boolean; total_likes: number } = await api.toggleLike(pub.id);
        setPublicaciones((prev) =>
            prev.map((p) => (p.id === pub.id ? { ...p, le_gusta: data.le_gusta, total_likes: data.total_likes } : p))
        );
    }

    function handleCambio(actualizada: PublicacionDetalle) {
        setPublicaciones((prev) => prev.map((p) => (p.id === actualizada.id ? actualizada : p)));
        setSeleccionada(actualizada);
    }

    function handleBorrada(id: string) {
        setPublicaciones((prev) => prev.filter((p) => p.id !== id));
    }

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-10 py-10">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h1 className="font-serif text-3xl font-semibold text-ink">Comunidad</h1>
                        <button
                            onClick={() => setModalCrear(true)}
                            className="flex items-center gap-2 rounded-xl bg-cuali-blue px-4 py-2.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark"
                        >
                            <Plus size={16} />
                            Publicar
                        </button>
                    </div>

                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <div className="flex flex-1 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 shadow-sm">
                            <Search size={15} className="text-ink-soft" />
                            <input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar en la comunidad…"
                                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setAlcance("todo")}
                                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                                    alcance === "todo" ? "bg-cuali-blue text-linen" : "bg-white text-ink shadow-sm"
                                }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setAlcance("escuela")}
                                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                                    alcance === "escuela" ? "bg-cuali-blue text-linen" : "bg-white text-ink shadow-sm"
                                }`}
                            >
                                Mi escuela
                            </button>
                        </div>
                    </div>

                    <div className="mb-8 flex flex-wrap gap-2">
                        <button
                            onClick={() => setCategoria(null)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                categoria === null ? "bg-cuali-blue text-linen" : "bg-white text-ink shadow-sm hover:bg-cuali-blue-soft"
                            }`}
                        >
                            Todas las categorías
                        </button>
                        {CATEGORIAS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCategoria(categoria === c ? null : c)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                    categoria === c ? "bg-cuali-blue text-linen" : "bg-white text-ink shadow-sm hover:bg-cuali-blue-soft"
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    {cargando ? (
                        <p className="text-sm text-ink-soft">Cargando…</p>
                    ) : publicaciones.length === 0 ? (
                        <p className="text-sm text-ink-soft">Todavía no hay publicaciones aquí. ¡Sé el primero!</p>
                    ) : (
                        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
                            {publicaciones.map((pub) => (
                                <div
                                    key={pub.id}
                                    onClick={() => setSeleccionada(pub)}
                                    className="mb-4 inline-block w-full cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg"
                                >
                                    {pub.imagenes.length > 0 ? (
                                        <div className="relative">
                                            <img src={`${API_BASE}${pub.imagenes[0]}`} alt="" className="w-full object-cover" />
                                            {pub.imagenes.length > 1 && (
                                                <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                    +{pub.imagenes.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            className="flex min-h-[140px] items-center justify-center p-5 text-center"
                                            style={{ background: COLORES_SIN_IMAGEN[pub.categoria ?? ""] ?? "#4E7AB5" }}
                                        >
                                            <p className="text-sm font-medium text-white">{pub.contenido.slice(0, 120)}</p>
                                        </div>
                                    )}

                                    <div className="p-3">
                                        {pub.imagenes.length > 0 && (
                                            <p className="mb-2 line-clamp-2 text-sm text-ink">{pub.contenido}</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-xs text-ink-soft">{pub.autor.nombre}</p>
                                            <div className="flex items-center gap-3 text-ink-soft">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLikeRapido(pub);
                                                    }}
                                                    className="flex items-center gap-1 text-xs"
                                                >
                                                    <Heart size={13} className={pub.le_gusta ? "fill-red-500 text-red-500" : ""} />
                                                    {pub.total_likes}
                                                </button>
                                                <span className="flex items-center gap-1 text-xs">
                                                    <MessageCircle size={13} />
                                                    {pub.total_comentarios}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <style>{`
          .content-blob { position: absolute; border-radius: 9999px; filter: blur(60px); }
          .content-blob-1 { width: 400px; height: 400px; top: -120px; right: -60px; background: var(--blue); opacity: 0.25; }
          .content-blob-2 { width: 320px; height: 320px; top: 30%; left: -100px; background: var(--blue-light); opacity: 0.4; }
          .content-blob-3 { width: 340px; height: 340px; bottom: -100px; right: 5%; background: var(--blue); opacity: 0.2; }
        `}</style>
            </div>

            {modalCrear && (
                <ModalCrearPublicacion
                    onClose={() => setModalCrear(false)}
                    onCreada={(pub) => setPublicaciones((prev) => [pub, ...prev])}
                />
            )}

            {seleccionada && (
                <PublicacionModal
                    publicacion={seleccionada}
                    onClose={() => setSeleccionada(null)}
                    onCambio={handleCambio}
                    onBorrada={handleBorrada}
                />
            )}
        </div>
    );
}