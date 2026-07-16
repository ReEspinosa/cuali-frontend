import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUp, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";
import AttachmentInput, { AttachmentPreview } from "../components/AttachmentInput";
import type { Adjunto } from "../lib/api";

type Mensaje = {
    id: string;
    role: "user" | "assistant";
    content: string;
    adjuntos?: Adjunto[];
};

type PlaneacionDetalle = {
    id: string;
    grado: number;
    campo_formativo: string;
    contenido: string;
    grupo: string;
    sesiones: number;
    tema: string;
    status: string;
    mensajes: Mensaje[];
};

export default function Chat() {
    const { planeacionId } = useParams<{ planeacionId: string }>();
    const navigate = useNavigate();

    const [planeacion, setPlaneacion] = useState<PlaneacionDetalle | null>(null);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [adjuntosPendientes, setAdjuntosPendientes] = useState<Adjunto[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!planeacionId) {
            navigate("/planeacion/nueva");
            return;
        }

        api
            .obtenerPlaneacion(planeacionId)
            .then((data: PlaneacionDetalle) => {
                setPlaneacion(data);
                setMensajes(data.mensajes);
            })
            .catch((err) => setLoadError(err.message));
    }, [planeacionId, navigate]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [mensajes]);

    async function handleSend() {
        const text = input.trim();
        if ((!text && adjuntosPendientes.length === 0) || sending || !planeacionId) return;

        const adjuntosAEnviar = adjuntosPendientes;
        setAdjuntosPendientes([]);
        setInput("");
        setSending(true);

        const mensajeLocal: Mensaje = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            adjuntos: adjuntosAEnviar,
        };
        setMensajes((prev) => [...prev, mensajeLocal]);

        try {
            const respuesta = await api.enviarMensaje(planeacionId, text, adjuntosAEnviar);
            setMensajes((prev) => [...prev, respuesta]);
        } catch (err) {
            setMensajes((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `Ocurrió un error: ${err instanceof Error ? err.message : "intenta de nuevo"}`,
                },
            ]);
        } finally {
            setSending(false);
        }
    }

    const MIN_MENSAJES_PARA_GENERAR = 5;

    async function handleGenerarPlaneacion() {
        if (!planeacionId) return;

        const mensajesDelMaestro = mensajes.filter((m) => m.role === "user").length;
        if (mensajesDelMaestro < MIN_MENSAJES_PARA_GENERAR) {
            alert(
                "Aún no hay información suficiente para generar la planeación. " +
                "Sigue platicando con Cuali un poco más y vuelve a intentarlo."
            );
            return;
        }

        setGenerando(true);
        try {
            await api.generarPlaneacion(planeacionId);
            const blob = await api.descargarDocxBlob(planeacionId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `planeacion_${planeacionId}.docx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert(err instanceof Error ? err.message : "No se pudo generar el documento.");
        } finally {
            setGenerando(false);
        }
    }

    if (loadError) {
        return (
            <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
                <Sidebar />
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm text-red-600">{loadError}</p>
                </div>
            </div>
        );
    }

    if (!planeacion) {
        return (
            <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
                <Sidebar />
                <div className="flex flex-1 items-center justify-center text-sm text-ink-soft">Cargando…</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                    <div className="content-blob content-blob-4" />
                    <div className="content-blob content-blob-5" />
                    <div className="content-blob content-blob-6" />
                    <div className="content-blob content-blob-7" />
                    <div className="content-blob content-blob-8" />
                    <div className="content-blob content-blob-9" />
                </div>

                <div className="relative z-10 border-b border-black/5 bg-white/70 px-10 py-5 backdrop-blur-md">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-6">
                        <div>
                            <h1 className="font-serif text-xl font-semibold text-ink">
                                {planeacion.contenido.length > 60
                                    ? planeacion.contenido.slice(0, 60) + "…"
                                    : planeacion.contenido}
                            </h1>
                            <p className="mt-1 text-xs text-ink-soft">
                                {planeacion.campo_formativo} · {planeacion.grado}° "{planeacion.grupo}" · {planeacion.sesiones} sesión(es)
                            </p>
                        </div>
                        <button
                            onClick={handleGenerarPlaneacion}
                            disabled={generando}
                            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-cuali-blue px-4 py-2.5 text-sm font-semibold text-linen shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-cuali-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <FileDown size={16} />
                            {generando ? "Generando…" : "Generar planeación"}
                        </button>
                    </div>
                </div>

                <div ref={scrollRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto px-10 py-8">
                    <div className="mx-auto flex max-w-3xl flex-col gap-5">
                        {mensajes.length === 0 && (
                            <div className="rounded-2xl border border-black/5 bg-white px-5 py-4 text-sm text-ink-soft shadow-sm">
                                Cuéntame qué tienes en mente para esta clase y armamos la planeación juntos.
                            </div>
                        )}

                        {mensajes.map((m) => (
                            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                                        m.role === "user"
                                            ? "bg-cuali-blue text-linen"
                                            : "border border-black/5 bg-white text-ink shadow-sm"
                                    }`}
                                >
                                    {m.adjuntos && m.adjuntos.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {m.adjuntos.map((a, i) =>
                                                    a.tipo === "imagen" ? (
                                                        <img
                                                            key={i}
                                                            src={`http://localhost:8000${a.url}`}
                                                            alt={a.filename}
                                                            className="h-24 w-24 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <span key={i} className="rounded-lg bg-black/10 px-2 py-1 text-xs">
                            {a.filename}
                          </span>
                                                    )
                                            )}
                                        </div>
                                    )}
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

                        {sending && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl border border-black/5 bg-white px-5 py-3 text-sm text-ink-soft shadow-sm">
                                    Cuali está escribiendo…
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-10 px-10 pb-8">
                    <div className="mx-auto max-w-3xl">
                        <AttachmentPreview adjuntos={adjuntosPendientes} onChange={setAdjuntosPendientes} />
                        <div className="flex items-end gap-3 rounded-3xl border border-cuali-blue-light/50 bg-cuali-blue-soft/70 px-6 py-4 shadow-lg backdrop-blur-xl">
                            <AttachmentInput adjuntos={adjuntosPendientes} onChange={setAdjuntosPendientes} />
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Escribe tu mensaje…"
                                rows={1}
                                style={{ maxHeight: "200px" }}
                                onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = "auto";
                                    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                                }}
                                className="flex-1 resize-none bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft"
                            />
                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && adjuntosPendientes.length === 0) || sending}
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-full bg-cuali-blue-dark text-white transition disabled:opacity-40"
                            >
                                <ArrowUp size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <style>{`
          .content-blob { position: absolute; border-radius: 9999px; filter: blur(60px); }
          .content-blob-1 { width: 400px; height: 400px; top: -120px; right: -60px; background: var(--blue); opacity: 0.45; }
          .content-blob-2 { width: 320px; height: 320px; top: 22%; right: 8%; background: var(--blue-light); opacity: 0.85; }
          .content-blob-3 { width: 360px; height: 360px; bottom: -100px; left: 4%; background: var(--blue); opacity: 0.4; }
          .content-blob-4 { width: 280px; height: 280px; top: 50%; left: -60px; background: var(--blue-light); opacity: 0.8; }
          .content-blob-5 { width: 320px; height: 320px; bottom: 6%; right: -80px; background: var(--blue); opacity: 0.4; }
          .content-blob-6 { width: 250px; height: 250px; top: 8%; left: 20%; background: var(--blue-light); opacity: 0.75; }
          .content-blob-7 { width: 260px; height: 260px; bottom: 28%; left: 42%; background: var(--blue-light); opacity: 0.7; }
          .content-blob-8 { width: 220px; height: 220px; top: 38%; right: 30%; background: var(--blue); opacity: 0.3; }
          .content-blob-9 { width: 240px; height: 240px; bottom: 45%; left: 15%; background: var(--blue-light); opacity: 0.65; }

          .chat-markdown p { margin: 0 0 0.6em 0; }
          .chat-markdown p:last-child { margin-bottom: 0; }
          .chat-markdown ul, .chat-markdown ol { margin: 0.4em 0 0.6em 1.2em; padding: 0; }
          .chat-markdown li { margin-bottom: 0.25em; }
          .chat-markdown strong { font-weight: 600; }
          .chat-markdown table { border-collapse: collapse; margin: 0.6em 0; width: 100%; font-size: 0.85em; }
          .chat-markdown th, .chat-markdown td { border: 1px solid rgba(0,0,0,0.15); padding: 6px 8px; text-align: left; vertical-align: top; }
          .chat-markdown th { background: rgba(60,95,145,0.10); font-weight: 600; }
          .chat-markdown h1, .chat-markdown h2, .chat-markdown h3 { font-size: 1em; font-weight: 600; margin: 0.6em 0 0.3em 0; }
        `}</style>
            </div>
        </div>
    );
}