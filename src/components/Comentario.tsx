import { useState } from "react";
import { CornerDownRight, Trash2 } from "lucide-react";
import { api } from "../lib/api";

export type ComentarioNodo = {
    id: string;
    autor: { id: string; nombre: string; escuela: string | null };
    contenido: string;
    created_at: string;
    es_autor: boolean;
    respuestas: ComentarioNodo[];
};

type Props = {
    comentario: ComentarioNodo;
    publicacionId: string;
    onCambio: () => void;
    nivel?: number;
};

export default function Comentario({ comentario, publicacionId, onCambio, nivel = 0 }: Props) {
    const [respondiendo, setRespondiendo] = useState(false);
    const [texto, setTexto] = useState("");
    const [enviando, setEnviando] = useState(false);

    async function handleResponder() {
        if (!texto.trim()) return;
        setEnviando(true);
        try {
            await api.crearComentario(publicacionId, { contenido: texto.trim(), parent_id: comentario.id });
            setTexto("");
            setRespondiendo(false);
            onCambio();
        } finally {
            setEnviando(false);
        }
    }

    async function handleBorrar() {
        await api.borrarComentario(comentario.id);
        onCambio();
    }

    return (
        <div className={nivel > 0 ? "ml-6 border-l border-black/5 pl-4" : ""}>
            <div className="py-2">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{comentario.autor.nombre}</p>
                    {comentario.es_autor && (
                        <button onClick={handleBorrar} className="text-ink-soft hover:text-red-500">
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
                <p className="text-sm text-ink-soft">{comentario.contenido}</p>
                <button
                    onClick={() => setRespondiendo((v) => !v)}
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-cuali-blue-dark hover:underline"
                >
                    <CornerDownRight size={12} />
                    Responder
                </button>

                {respondiendo && (
                    <div className="mt-2 flex gap-2">
                        <input
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleResponder()}
                            placeholder="Escribe una respuesta…"
                            className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-cuali-blue"
                            autoFocus
                        />
                        <button
                            onClick={handleResponder}
                            disabled={enviando || !texto.trim()}
                            className="rounded-lg bg-cuali-blue px-3 py-1.5 text-xs font-semibold text-linen disabled:opacity-50"
                        >
                            Enviar
                        </button>
                    </div>
                )}
            </div>

            {comentario.respuestas.map((r) => (
                <Comentario key={r.id} comentario={r} publicacionId={publicacionId} onCambio={onCambio} nivel={nivel + 1} />
            ))}
        </div>
    );
}