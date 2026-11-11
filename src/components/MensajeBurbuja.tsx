import { BookOpen, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Adjunto, ObjetivoRetroalimentacion } from "../lib/api";
import AuthImage from "./AuthImage";
import Logo from "./Logo";
import Retroalimentacion from "./Retroalimentacion";

export type Fuente = { documento: string; campo?: string | null; pagina?: number | string | null };

export type MensajeChat = {
    id: string;
    role: "user" | "assistant";
    content: string;
    adjuntos?: Adjunto[];
    sources?: Fuente[];
    /** Mensaje creado solo en el navegador (p. ej. un error): no se evalua. */
    local?: boolean;
};

type Props = {
    mensaje: MensajeChat;
    objetivoTipo: ObjetivoRetroalimentacion;
};

function Adjuntos({ adjuntos }: { adjuntos: Adjunto[] }) {
    return (
        <div className="mb-2 flex flex-wrap gap-2">
            {adjuntos.map((a, i) =>
                a.tipo === "imagen" ? (
                    <AuthImage key={i} url={a.url} alt={a.filename} className="h-24 w-24 rounded-md object-cover" />
                ) : (
                    <span key={i} className="flex items-center gap-1.5 rounded-md bg-white/15 px-2 py-1 text-xs">
                        <FileText size={13} aria-hidden="true" />
                        {a.filename}
                    </span>
                )
            )}
        </div>
    );
}

/**
 * Un mensaje del chat en estilo cuaderno: lo que escribe la docente va en
 * tinta azul a la derecha; la respuesta de Cuali va en una hoja con sus
 * fuentes de los libros SEP y la retroalimentacion.
 *
 * El Markdown se muestra con react-markdown, que NO interpreta HTML crudo:
 * una respuesta del modelo no puede inyectar scripts en la pagina.
 */
export default function MensajeBurbuja({ mensaje, objetivoTipo }: Props) {
    if (mensaje.role === "user") {
        return (
            <div className="flex justify-end">
                <div className="max-w-[min(560px,85%)] whitespace-pre-wrap rounded-[12px_12px_2px_12px] bg-tinta px-4 py-3 text-base leading-relaxed text-white">
                    {mensaje.adjuntos && mensaje.adjuntos.length > 0 && <Adjuntos adjuntos={mensaje.adjuntos} />}
                    {mensaje.content}
                </div>
            </div>
        );
    }

    const fuentes = mensaje.sources ?? [];
    return (
        <article className="sombra-recorte flex max-w-3xl flex-col gap-3 rounded-lg border-[1.5px] border-tinta bg-white px-5 py-4">
            <Logo className="text-base" />
            <div className="chat-markdown text-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{mensaje.content}</ReactMarkdown>
            </div>

            {fuentes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {fuentes.map((f, i) => (
                        <span
                            key={i}
                            title={f.campo ?? undefined}
                            className="flex items-center gap-1.5 rounded border border-borde bg-relleno px-2 py-1 text-xs font-bold"
                        >
                            <BookOpen size={13} aria-hidden="true" />
                            {f.documento}
                            {f.pagina ? ` · p. ${f.pagina}` : ""}
                        </span>
                    ))}
                </div>
            )}

            {!mensaje.local && (
                <div className="border-t border-cuadricula pt-3">
                    <Retroalimentacion objetivoTipo={objetivoTipo} objetivoId={mensaje.id} />
                </div>
            )}
        </article>
    );
}
