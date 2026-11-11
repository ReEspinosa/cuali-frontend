import { useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { API_BASE, api, type Adjunto } from "../lib/api";

type Props = {
    adjuntos: Adjunto[];
    onChange: (adjuntos: Adjunto[]) => void;
};

const MAX_ADJUNTOS = 5; // mismo tope que el backend

export function AttachmentPreview({ adjuntos, onChange }: Props) {
    if (adjuntos.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {adjuntos.map((a, i) => (
                <div key={`${a.url}-${i}`} className="flex items-center gap-2 rounded-md border border-borde bg-white px-2.5 py-1.5 text-xs">
                    {a.tipo === "imagen" && a.url_firmada ? (
                        // Vista previa con la URL firmada que devolvio la subida.
                        <img src={`${API_BASE}${a.url_firmada}`} alt="" className="h-6 w-6 rounded object-cover" />
                    ) : (
                        <FileText size={14} aria-hidden="true" />
                    )}
                    <span className="max-w-[180px] truncate">{a.filename}</span>
                    <button
                        type="button"
                        onClick={() => onChange(adjuntos.filter((_, j) => j !== i))}
                        aria-label={`Quitar ${a.filename}`}
                        className="text-tinta-tenue hover:text-tinta"
                    >
                        <X size={13} aria-hidden="true" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default function AttachmentInput({ adjuntos, onChange }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        setError(null);
        const disponibles = MAX_ADJUNTOS - adjuntos.length;
        if (files.length > disponibles) {
            setError(`Puedes adjuntar hasta ${MAX_ADJUNTOS} archivos por mensaje.`);
            if (inputRef.current) inputRef.current.value = "";
            return;
        }
        setSubiendo(true);
        try {
            const nuevos = await Promise.all(Array.from(files).map((f) => api.subirArchivo(f)));
            onChange([...adjuntos, ...nuevos]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo subir el archivo.");
        } finally {
            setSubiendo(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    return (
        <div className="relative flex-shrink-0">
            <input
                ref={inputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={subiendo}
                aria-label="Adjuntar archivo o imagen"
                title="Adjuntar archivo o imagen"
                className="flex h-11 w-11 items-center justify-center rounded-md text-tinta-tenue transition hover:bg-relleno hover:text-tinta disabled:opacity-50"
            >
                <Paperclip size={18} aria-hidden="true" />
            </button>
            {error && (
                <p role="alert" className="absolute bottom-full left-0 mb-2 w-64 rounded-md bg-error-tinte px-3 py-2 text-xs text-error">
                    {error}
                </p>
            )}
        </div>
    );
}
