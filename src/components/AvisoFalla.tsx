import { RotateCw, TriangleAlert } from "lucide-react";
import type { Adjunto } from "../lib/api";

/** Mensaje que no obtuvo respuesta: se guarda para poder reenviarlo tal cual. */
export type EnvioFallido = {
    idLocal: string;
    texto: string;
    adjuntos: Adjunto[];
    motivo: string;
};

type Props = {
    fallo: EnvioFallido;
    onReintentar: () => void;
    deshabilitado: boolean;
};

/**
 * Aviso cuando Cuali no pudo responder. El backend no guarda nada en ese
 * caso, asi que reintentar reenvia el mismo mensaje sin duplicarlo.
 */
export default function AvisoFalla({ fallo, onReintentar, deshabilitado }: Props) {
    return (
        <div role="alert" className="flex flex-wrap items-center gap-3 self-start rounded-lg border border-marcatexto bg-marcatexto-suave px-4 py-3">
            <TriangleAlert size={18} className="flex-shrink-0 text-marcatexto-texto" aria-hidden="true" />
            <span className="text-sm text-marcatexto-texto">{fallo.motivo}</span>
            <button
                type="button"
                onClick={onReintentar}
                disabled={deshabilitado}
                className="flex h-9 items-center gap-1.5 rounded-md bg-tinta px-3 text-sm font-bold text-white transition hover:bg-tinta-fuerte disabled:opacity-40"
            >
                <RotateCw size={14} aria-hidden="true" />
                Reintentar
            </button>
        </div>
    );
}
