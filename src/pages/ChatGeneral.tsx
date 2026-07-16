import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUp, Search, SquarePen, BookOpen, Code2, Lightbulb, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "../components/Sidebar";
import { api, getUser } from "../lib/api";
import AttachmentInput, { AttachmentPreview } from "../components/AttachmentInput";
import type { Adjunto } from "../lib/api";

type Source = { documento: string; campo?: string; pagina?: number };
type Mensaje = {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
    adjuntos?: Adjunto[];
};
type ConversacionResumen = { id: string; titulo: string; updated_at: string };

const ACCIONES_RAPIDAS = [
    { icon: BookOpen, label: "Aprender" },
    { icon: Code2, label: "Planear" },
    { icon: Lightbulb, label: "Consejo" },
    { icon: ImageIcon, label: "Generar recurso" },
];

export default function ChatGeneral() {
    const { conversacionId } = useParams<{ conversacionId?: string }>();
    const navigate = useNavigate();
    const user = getUser();

    const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [adjuntosPendientes, setAdjuntosPendientes] = useState<Adjunto[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.listarConversaciones().then(setConversaciones).catch(() => {});
    }, [conversacionId]);

    useEffect(() => {
        if (!conversacionId) {
            setMensajes([]);
            return;
        }
        api.obtenerConversacion(conversacionId).then((data) => setMensajes(data.mensajes));
    }, [conversacionId]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [mensajes]);

    const conversacionesFiltradas = conversaciones.filter((c) =>
        c.titulo.toLowerCase().includes(busqueda.toLowerCase())
    );

    async function handleSend(textoInicial?: string) {
        const text = (textoInicial ?? input).trim();
        if ((!text && adjuntosPendientes.length === 0) || sending) return;

        setInput("");
        const adjuntosAEnviar = adjuntosPendientes;
        setAdjuntosPendientes([]);
        setSending(true);

        try {
            let idActivo = conversacionId;
            if (!idActivo) {
                const nueva = await api.crearConversacion();
                idActivo = nueva.id;
                navigate(`/chat/${idActivo}`, { replace: true });
            }

            const mensajeLocal: Mensaje = {
                id: crypto.randomUUID(),
                role: "user",
                content: text,
                adjuntos: adjuntosAEnviar,
            };
            setMensajes((prev) => [...prev, mensajeLocal]);

            const respuesta = await api.enviarMensajeConversacion(idActivo, text, adjuntosAEnviar);
            setMensajes((prev) => [...prev, respuesta]);

            const listaActualizada = await api.listarConversaciones();
            setConversaciones(listaActualizada);
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

    const enConversacion = mensajes.length > 0;

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            {/* Panel de conversaciones — como el sidebar de Discourse */}
            <div className="flex w-72 flex-shrink-0 flex-col border-r border-black/5 bg-linen/40 px-4 py-6">
                <button
                    onClick={() => navigate("/chat")}
                    className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-cuali-blue-soft py-2.5 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                >
                    <SquarePen size={15} />
                    Nuevo chat
                </button>

                <div className="mb-4 flex items-center gap-2 rounded-xl bg-cuali-blue-soft/60 px-3 py-2">
                    <Search size={14} className="text-ink-soft" />
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar conversaciones…"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
                    />
                </div>

                <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-ink-soft">Conversaciones</p>
                <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
                    {conversacionesFiltradas.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => navigate(`/chat/${c.id}`)}
                            className={`truncate rounded-lg px-3 py-2 text-left text-sm transition ${
                                c.id === conversacionId
                                    ? "bg-cuali-blue-soft font-medium text-ink"
                                    : "text-ink-soft hover:bg-cuali-blue-soft/50"
                            }`}
                        >
                            {c.titulo}
                        </button>
                    ))}
                    {conversacionesFiltradas.length === 0 && (
                        <p className="px-3 text-sm text-ink-soft">Sin conversaciones todavía.</p>
                    )}
                </div>
            </div>

            {/* Área principal */}
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

                {!enConversacion ? (
                    // Estado inicial — greeting + input centrado, como en Discourse
                    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10">
                        <h1 className="mb-2 text-center font-serif text-4xl font-normal leading-tight text-ink">
                            Hola, <span className="italic text-cuali-blue-dark">{user?.nombre ?? "docente"}</span>
                        </h1>
                        <p className="mb-10 text-center font-serif text-3xl font-normal text-ink/70">
                            ¿En qué te ayudo hoy?
                        </p>

                        <div className="w-full max-w-2xl">
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
                                    placeholder="Pregunta lo que sea…"
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
                                    onClick={() => handleSend()}
                                    disabled={(!input.trim() && adjuntosPendientes.length === 0) || sending}
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-full bg-cuali-blue-dark text-white transition disabled:opacity-40"
                                >
                                    <ArrowUp size={16} />
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                {ACCIONES_RAPIDAS.map((a) => {
                                    const Icon = a.icon;
                                    return (
                                        <button
                                            key={a.label}
                                            className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm text-ink-soft shadow-sm transition hover:text-ink"
                                        >
                                            <Icon size={14} />
                                            {a.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div ref={scrollRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto px-10 py-8">
                            <div className="mx-auto flex max-w-3xl flex-col gap-5">
                                {mensajes.map((m) => (
                                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className="max-w-[75%]">
                                            <div
                                                className={`whitespace-pre-wrap rounded-2xl px-5 py-3 text-sm leading-relaxed ${
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

                                            {m.sources && m.sources.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {m.sources.map((s, i) => (
                                                        <span
                                                            key={i}
                                                            className="rounded-full border border-cuali-blue-light/50 bg-cuali-blue-soft px-3 py-1 text-xs text-cuali-blue-dark"
                                                            title={s.campo ?? ""}
                                                        >
                              {s.documento}
                                                            {s.pagina ? ` · pág. ${s.pagina}` : ""}
                            </span>
                                                    ))}
                                                </div>
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
                                        onClick={() => handleSend()}
                                        disabled={(!input.trim() && adjuntosPendientes.length === 0) || sending}
                                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-full bg-cuali-blue-dark text-white transition disabled:opacity-40"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

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