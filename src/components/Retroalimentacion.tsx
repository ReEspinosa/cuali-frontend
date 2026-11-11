import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { api, type ObjetivoRetroalimentacion } from "../lib/api";

type Props = {
    objetivoTipo: ObjetivoRetroalimentacion;
    objetivoId: string;
};

const MAX_COMENTARIO = 1000;

/**
 * "Me sirvio / no me sirvio" sobre una respuesta de Cuali.
 * Los votos se guardan en el backend (un voto por docente y respuesta) y son
 * la base para medir la calidad de las respuestas en la evaluacion.
 */
export default function Retroalimentacion({ objetivoTipo, objetivoId }: Props) {
    const [valor, setValor] = useState<1 | -1 | null>(null);
    const [comentario, setComentario] = useState("");
    const [estado, setEstado] = useState<"inicial" | "guardando" | "guardado" | "error">("inicial");
    const [comentarioEnviado, setComentarioEnviado] = useState(false);

    async function guardar(nuevoValor: 1 | -1, texto?: string) {
        setValor(nuevoValor);
        setEstado("guardando");
        try {
            await api.guardarRetroalimentacion({
                objetivo_tipo: objetivoTipo,
                objetivo_id: objetivoId,
                valor: nuevoValor,
                comentario: texto,
            });
            setEstado("guardado");
            if (texto) setComentarioEnviado(true);
        } catch {
            setEstado("error");
        }
    }

    const claseBoton = (activo: boolean) =>
        `flex h-8 w-8 items-center justify-center rounded-md border transition ${
            activo ? "border-tinta bg-tinta text-white" : "border-borde-fuerte bg-white text-tinta hover:border-tinta"
        }`;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[13px] text-tinta-tenue">
                <span>¿Te sirvió?</span>
                <button type="button" aria-label="Sí me sirvió" aria-pressed={valor === 1} onClick={() => guardar(1)} className={claseBoton(valor === 1)}>
                    <ThumbsUp size={15} aria-hidden="true" />
                </button>
                <button type="button" aria-label="No me sirvió" aria-pressed={valor === -1} onClick={() => guardar(-1)} className={claseBoton(valor === -1)}>
                    <ThumbsDown size={15} aria-hidden="true" />
                </button>
                {estado === "guardado" && !comentarioEnviado && <span>Gracias, lo tomamos en cuenta.</span>}
                {estado === "error" && <span className="text-error">No se pudo guardar. Intenta de nuevo.</span>}
            </div>

            {valor === -1 && estado === "guardado" && !comentarioEnviado && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (comentario.trim()) guardar(-1, comentario.trim());
                    }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <label htmlFor={`comentario-${objetivoId}`} className="sr-only">
                        Qué le faltó a la respuesta
                    </label>
                    <input
                        id={`comentario-${objetivoId}`}
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        maxLength={MAX_COMENTARIO}
                        placeholder="¿Qué le faltó? (opcional)"
                        className="h-9 min-w-0 flex-1 rounded-md border border-borde-fuerte bg-white px-3 text-sm outline-none focus:border-tinta"
                    />
                    <button type="submit" disabled={!comentario.trim()} className="h-9 rounded-md bg-tinta px-3 text-sm font-bold text-white disabled:opacity-40">
                        Enviar
                    </button>
                </form>
            )}
            {comentarioEnviado && <span className="text-[13px] text-tinta-tenue">Gracias por el comentario.</span>}
        </div>
    );
}
