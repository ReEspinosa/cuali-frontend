import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, MoreHorizontal, Trash2, X } from "lucide-react";
import { api, API_BASE, getUser } from "../lib/api";
import Comentario, { type ComentarioNodo } from "./Comentario";

export type PublicacionDetalle = {
    id: string;
    autor: { id: string; nombre: string; escuela: string | null };
    contenido: string;
    categoria: string | null;
    visibilidad: string;
    imagenes: string[];
    total_likes: number;
    le_gusta: boolean;
    total_comentarios: number;
    created_at: string;
    es_autor: boolean;
};

type Props = {
    publicacion: PublicacionDetalle;
    onClose: () => void;
    onCambio: (actualizada: PublicacionDetalle) => void;
    onBorrada: (id: string) => void;
};

export default function PublicacionModal({ publicacion, onClose, onCambio, onBorrada }: Props) {
    const user = getUser();
    const [imagenIndex, setImagenIndex] = useState(0);
    const [comentarios, setComentarios] = useState<ComentarioNodo[]>([]);
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);

    async function cargarComentarios() {
        const data: ComentarioNodo[] = await api.listarComentarios(publicacion.id);
        setComentarios(data);
    }

    useEffect(() => {
        cargarComentarios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicacion.id]);

    async function handleLike() {
        const data: { le_gusta: boolean; total_likes: number } = await api.toggleLike(publicacion.id);
        onCambio({ ...publicacion, le_gusta: data.le_gusta, total_likes: data.total_likes });
    }

    async function handleComentar() {
        if (!nuevoComentario.trim()) return;
        setEnviando(true);
        try {
            await api.crearComentario(publicacion.id, { contenido: nuevoComentario.trim() });
            setNuevoComentario("");
            await cargarComentarios();
            onCambio({ ...publicacion, total_comentarios: publicacion.total_comentarios + 1 });
        } finally {
            setEnviando(false);
        }
    }

    async function handleBorrarPublicacion() {
        await api.borrarPublicacion(publicacion.id);
        onBorrada(publicacion.id);
        onClose();
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8" onClick={onClose}>
            <div
                className="relative flex max-h-full w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                >
                    <X size={16} />
                </button>

                {publicacion.imagenes.length > 0 && (
                    <div className="relative hidden w-1/2 flex-shrink-0 bg-black/5 sm:block">
                        <img
                            src={`${API_BASE}${publicacion.imagenes[imagenIndex]}`}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                        {publicacion.imagenes.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                                {publicacion.imagenes.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setImagenIndex(i)}
                                        className={`h-1.5 w-1.5 rounded-full ${i === imagenIndex ? "bg-white" : "bg-white/40"}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex w-full flex-col overflow-y-auto sm:w-1/2">
                    <div className="border-b border-black/5 p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-ink">{publicacion.autor.nombre}</p>
                                {publicacion.autor.escuela && (
                                    <p className="text-xs text-ink-soft">{publicacion.autor.escuela}</p>
                                )}
                            </div>
                            {publicacion.es_autor && (
                                <div className="relative">
                                    <button
                                        onClick={() => setMenuAbierto((v) => !v)}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-cuali-blue-soft"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                    {menuAbierto && (
                                        <div className="absolute right-0 top-9 z-10 w-40 rounded-xl border border-black/5 bg-white py-1 shadow-lg">
                                            <button
                                                onClick={handleBorrarPublicacion}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={14} />
                                                Borrar publicación
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{publicacion.contenido}</p>

                        <div className="mt-4 flex items-center gap-4">
                            <button onClick={handleLike} className="flex items-center gap-1.5 text-sm">
                                <Heart
                                    size={18}
                                    className={publicacion.le_gusta ? "fill-red-500 text-red-500" : "text-ink-soft"}
                                />
                                {publicacion.total_likes}
                            </button>
                            <span className="text-sm text-ink-soft">{publicacion.total_comentarios} comentarios</span>
                        </div>
                    </div>

                    <div className="flex-1 px-6 py-2">
                        {comentarios.length === 0 ? (
                            <p className="py-4 text-sm text-ink-soft">Sé el primero en comentar.</p>
                        ) : (
                            comentarios.map((c) => (
                                <Comentario key={c.id} comentario={c} publicacionId={publicacion.id} onCambio={cargarComentarios} />
                            ))
                        )}
                    </div>

                    <div className="flex items-center gap-2 border-t border-black/5 p-4">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cuali-blue-soft text-xs font-semibold text-cuali-blue-dark">
                            {user?.nombre?.[0] ?? "?"}
                        </span>
                        <input
                            value={nuevoComentario}
                            onChange={(e) => setNuevoComentario(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleComentar()}
                            placeholder="Escribe un comentario…"
                            className="flex-1 rounded-full border border-black/10 bg-cuali-blue-soft/40 px-4 py-2 text-sm outline-none focus:border-cuali-blue"
                        />
                        <button
                            onClick={handleComentar}
                            disabled={enviando || !nuevoComentario.trim()}
                            className="rounded-full bg-cuali-blue px-4 py-2 text-sm font-semibold text-linen disabled:opacity-50"
                        >
                            Enviar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}