import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ChevronLeft, Download, FlaskConical, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "../../components/Sidebar";
import { api } from "../../lib/api";

type Mensaje = { role: "user" | "assistant"; content: string };

export default function Laboratorio() {
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [input, setInput] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [docxUrl, setDocxUrl] = useState<{ id: string; titulo: string } | null>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [mensajes]);

    async function handleEnviar() {
        const texto = input.trim();
        if (!texto || enviando) return;

        setInput("");
        setEnviando(true);
        setError(null);
        setDocxUrl(null);

        const nuevoHistorial = [...mensajes, { role: "user" as const, content: texto }];
        setMensajes(nuevoHistorial);

        try {
            const data: { content: string } = await api.laboratorioMensaje({
                historial: mensajes,
                mensaje: texto,
            });
            setMensajes([...nuevoHistorial, { role: "assistant", content: data.content }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocurrió un error, intenta de nuevo.");
        } finally {
            setEnviando(false);
        }
    }

    async function handleGenerarDocumento() {
        if (mensajes.length < 2) {
            setError("Platica un poco más con Cuali antes de generar el documento.");
            return;
        }
        setError(null);
        setGenerando(true);
        try {
            const data: { id: string; titulo: string } = await api.laboratorioGenerar({ historial: mensajes });
            setDocxUrl({ id: data.id, titulo: data.titulo });
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el documento.");
        } finally {
            setGenerando(false);
        }
    }

    async function handleDescargar() {
        if (!docxUrl) return;
        const blob = await api.descargarLaboratorioDocxBlob(docxUrl.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docxUrl.titulo.slice(0, 30)}.docx`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                </div>

                <div className="relative z-10 border-b border-black/5 bg-white/70 px-10 py-5 backdrop-blur-md">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                        <div>
                            <button
                                onClick={() => navigate("/recursos")}
                                className="mb-1 flex items-center gap-2 text-xs text-ink-soft transition hover:text-ink"
                            >
                                <ChevronLeft size={14} />
                                Volver a Recursos
                            </button>
                            <h1 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
                                <FlaskConical size={18} />
                                Laboratorio
                            </h1>
                        </div>
                        <button
                            onClick={handleGenerarDocumento}
                            disabled={generando}
                            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-cuali-blue px-4 py-2.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-50"
                        >
                            {generando ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                            {generando ? "Generando…" : "Generar documento"}
                        </button>
                    </div>
                </div>

                <div ref={scrollRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto px-10 py-8">
                    <div className="mx-auto flex max-w-3xl flex-col gap-5">
                        {mensajes.length === 0 && (
                            <div className="rounded-2xl border border-black/5 bg-white px-5 py-4 text-sm text-ink-soft shadow-sm">
                                Cuéntame qué recurso quieres crear — algo que no encaje en las otras categorías, y lo
                                armamos juntos. Cuando quede listo, dale a "Generar documento" para descargarlo.
                            </div>
                        )}

                        {mensajes.map((m, i) => (
                            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                                        m.role === "user"
                                            ? "bg-cuali-blue text-linen"
                                            : "border border-black/5 bg-white text-ink shadow-sm"
                                    }`}
                                >
                                    {m.role === "assistant" ? (
                                        <div className="chat-markdown">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        m.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {enviando && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl border border-black/5 bg-white px-5 py-3 text-sm text-ink-soft shadow-sm">
                                    Cuali está escribiendo…
                                </div>
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        {docxUrl && (
                            <div className="flex items-center justify-between rounded-2xl border border-cuali-blue-light/50 bg-cuali-blue-soft px-5 py-4">
                                <p className="text-sm font-medium text-ink">Documento listo: {docxUrl.titulo}</p>
                                <button
                                    onClick={handleDescargar}
                                    className="flex items-center gap-2 rounded-xl bg-cuali-blue px-4 py-2 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark"
                                >
                                    <Download size={14} />
                                    Descargar .docx
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-10 px-10 pb-8">
                    <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-3xl border border-cuali-blue-light/50 bg-cuali-blue-soft/70 px-6 py-4 shadow-lg backdrop-blur-xl">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEnviar();
                                }
                            }}
                            placeholder="Escribe tu idea…"
                            rows={1}
                            style={{ maxHeight: "160px" }}
                            onInput={(e) => {
                                const el = e.currentTarget;
                                el.style.height = "auto";
                                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                            }}
                            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft"
                        />
                        <button
                            onClick={handleEnviar}
                            disabled={!input.trim() || enviando}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-full bg-cuali-blue-dark text-white transition disabled:opacity-40"
                        >
                            <ArrowUp size={16} />
                        </button>
                    </div>
                </div>

                <style>{`
          .content-blob { position: absolute; border-radius: 9999px; filter: blur(60px); }
          .content-blob-1 { width: 380px; height: 380px; top: -120px; right: -60px; background: var(--blue); opacity: 0.3; }
          .content-blob-2 { width: 300px; height: 300px; top: 40%; left: -80px; background: var(--blue-light); opacity: 0.55; }
          .content-blob-3 { width: 320px; height: 320px; bottom: -100px; right: 10%; background: var(--blue); opacity: 0.25; }

          .chat-markdown p { margin: 0 0 0.6em 0; }
          .chat-markdown p:last-child { margin-bottom: 0; }
          .chat-markdown ul, .chat-markdown ol { margin: 0.4em 0 0.6em 1.2em; padding: 0; }
          .chat-markdown li { margin-bottom: 0.25em; }
          .chat-markdown strong { font-weight: 600; }
        `}</style>
            </div>
        </div>
    );
}