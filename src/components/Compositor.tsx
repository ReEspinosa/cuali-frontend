import { ArrowUp } from "lucide-react";
import type { Adjunto } from "../lib/api";
import AttachmentInput, { AttachmentPreview } from "./AttachmentInput";

type Props = {
    valor: string;
    onCambio: (texto: string) => void;
    onEnviar: () => void;
    adjuntos: Adjunto[];
    onAdjuntos: (adjuntos: Adjunto[]) => void;
    enviando: boolean;
    placeholder?: string;
    /** Interruptor "Responder con los libros SEP" (solo en el chat general). */
    usarLibros?: boolean;
    onUsarLibros?: (valor: boolean) => void;
};

const MAX_MENSAJE = 8000; // mismo tope que el backend

/** Caja para escribir a Cuali: texto, adjuntos y, opcionalmente, el uso de libros SEP. */
export default function Compositor({
    valor,
    onCambio,
    onEnviar,
    adjuntos,
    onAdjuntos,
    enviando,
    placeholder = "Escribe tu mensaje",
    usarLibros,
    onUsarLibros,
}: Props) {
    const puedeEnviar = (valor.trim().length > 0 || adjuntos.length > 0) && !enviando;

    return (
        <div className="flex flex-col gap-2">
            <AttachmentPreview adjuntos={adjuntos} onChange={onAdjuntos} />
            <div className="sombra-recorte-sm flex flex-col gap-2 rounded-[10px] border-[1.5px] border-tinta bg-white px-3 py-2.5">
                <div className="flex items-end gap-2">
                    <AttachmentInput adjuntos={adjuntos} onChange={onAdjuntos} />
                    <label className="sr-only" htmlFor="compositor">
                        Mensaje
                    </label>
                    <textarea
                        id="compositor"
                        value={valor}
                        onChange={(e) => onCambio(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (puedeEnviar) onEnviar();
                            }
                        }}
                        onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = "auto";
                            el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                        }}
                        rows={1}
                        maxLength={MAX_MENSAJE}
                        placeholder={placeholder}
                        style={{ maxHeight: "200px" }}
                        className="min-w-0 flex-1 resize-none bg-transparent py-2 text-base text-tinta outline-none placeholder:text-tinta-tenue"
                    />
                    <button
                        type="button"
                        onClick={onEnviar}
                        disabled={!puedeEnviar}
                        aria-label="Enviar"
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-tinta text-white transition hover:bg-tinta-fuerte disabled:opacity-40"
                    >
                        <ArrowUp size={18} aria-hidden="true" />
                    </button>
                </div>

                {onUsarLibros && (
                    <label className="flex cursor-pointer items-center gap-2.5 px-1 text-[13px] font-bold">
                        <input
                            type="checkbox"
                            role="switch"
                            checked={!!usarLibros}
                            onChange={(e) => onUsarLibros(e.target.checked)}
                            className="peer sr-only"
                        />
                        <span
                            aria-hidden="true"
                            className={`relative h-5 w-9 rounded-full transition ${usarLibros ? "bg-etica" : "bg-borde-fuerte"}`}
                        >
                            <span
                                className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white transition-all ${usarLibros ? "left-[19px]" : "left-[3px]"}`}
                            />
                        </span>
                        Responder con los libros SEP
                    </label>
                )}
            </div>
        </div>
    );
}
