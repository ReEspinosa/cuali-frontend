import { useRef, useState } from "react";
import { Paperclip, X, FileText } from "lucide-react";
import { api, type Adjunto } from "../lib/api";

type Props = {
    adjuntos: Adjunto[];
    onChange: (adjuntos: Adjunto[]) => void;
};

export default function AttachmentInput({ adjuntos, onChange }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [subiendo, setSubiendo] = useState(false);

    async function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        setSubiendo(true);
        try {
            const nuevos = await Promise.all(Array.from(files).map((f) => api.subirArchivo(f)));
            onChange([...adjuntos, ...nuevos]);
        } catch (err) {
            alert(err instanceof Error ? err.message : "No se pudo subir el archivo.");
        } finally {
            setSubiendo(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    function quitar(index: number) {
        onChange(adjuntos.filter((_, i) => i !== index));
    }

    return (
        <div className="flex flex-col gap-2">
            {adjuntos.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2">
                    {adjuntos.map((a, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-cuali-blue-light/50 bg-cuali-blue-soft px-3 py-1.5 text-xs text-ink"
                        >
                            {a.tipo === "imagen" ? (
                                <img src={a.url} alt={a.filename} className="h-6 w-6 rounded object-cover" />
                            ) : (
                                <FileText size={14} />
                            )}
                            <span className="max-w-[140px] truncate">{a.filename}</span>
                            <button onClick={() => quitar(i)} className="text-ink-soft hover:text-ink">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

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
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-cuali-blue-soft hover:text-ink disabled:opacity-50"
                title="Adjuntar archivo o imagen"
            >
                <Paperclip size={16} />
            </button>
        </div>
    );
}
