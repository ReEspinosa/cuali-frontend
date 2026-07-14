import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUp, FileDown } from "lucide-react";
import Sidebar from "../components/Sidebar";

type Contenido = { contenido: string; pda_6: string };

type PlaneacionContext = {
    grado: number;
    campo: string;
    contenido: Contenido;
    grupo: string;
    sesiones: string;
    tema: string;
};

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

function buildIntroMessage(ctx: PlaneacionContext): string {
    return `¡Hola! Vamos a planear tu clase de **${ctx.campo}** para ${ctx.grado}° "${ctx.grupo}", en ${ctx.sesiones} sesión(es).

**Tema u objetivo:** ${ctx.tema}
**Contenido NEM:** ${ctx.contenido.contenido}

Cuéntame un poco más de lo que tienes en mente — actividades que quieras incluir, materiales con los que cuentas, o cualquier ajuste — y armamos la planeación juntos.`;
}

export default function Chat() {
    const location = useLocation();
    const navigate = useNavigate();
    const ctx = location.state as PlaneacionContext | null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Si alguien llega a /chat sin haber pasado por Nueva Planeación, lo regresamos.
    useEffect(() => {
        if (!ctx) {
            navigate("/planeacion/nueva");
            return;
        }
        setMessages([
            { id: "intro", role: "assistant", content: buildIntroMessage(ctx) },
        ]);
    }, [ctx, navigate]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    if (!ctx) return null;

    function handleSend() {
        const text = input.trim();
        if (!text || sending) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setSending(true);

        // TODO: reemplazar por la llamada real al backend (FastAPI + RAG),
        // mandando ctx + historial de mensajes, y transmitiendo la respuesta
        // en streaming en vez de esta simulación.
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content:
                        "Entendido. (Esta es una respuesta de ejemplo — aquí se conecta el backend real de Cuali con el contexto de la planeación.)",
                },
            ]);
            setSending(false);
        }, 700);
    }

    function handleGenerarPlaneacion() {
        // TODO: llamar al endpoint que extrae la conversación a JSON estructurado
        // y genera el PDF de la planeación.
        console.log("Generar planeación con contexto:", ctx, "e historial:", messages);
    }

    const puedeGenerar = messages.some((m) => m.role === "user");

    return (
        <div className="flex min-h-screen bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                {/* Blobs azules difuminados sobre fondo blanco */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                    <div className="content-blob content-blob-4" />
                    <div className="content-blob content-blob-5" />
                </div>

                {/* Header con resumen del contexto */}
                <div className="relative z-10 border-b border-black/5 bg-white/70 px-10 py-5 backdrop-blur-md">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-6">
                        <div>
                            <h1 className="font-serif text-xl font-semibold text-ink">
                                {ctx.contenido.contenido.length > 60
                                    ? ctx.contenido.contenido.slice(0, 60) + "…"
                                    : ctx.contenido.contenido}
                            </h1>
                            <p className="mt-1 text-xs text-ink-soft">
                                {ctx.campo} · {ctx.grado}° "{ctx.grupo}" · {ctx.sesiones} sesión(es)
                            </p>
                        </div>
                        <button
                            onClick={handleGenerarPlaneacion}
                            disabled={!puedeGenerar}
                            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-cuali-blue px-4 py-2.5 text-sm font-semibold text-linen shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-cuali-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <FileDown size={16} />
                            Generar planeación
                        </button>
                    </div>
                </div>

                {/* Mensajes */}
                <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-10 py-8">
                    <div className="mx-auto flex max-w-3xl flex-col gap-5">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                                        m.role === "user"
                                            ? "bg-cuali-blue text-linen"
                                            : "border border-black/5 bg-white text-ink shadow-sm"
                                    }`}
                                >
                                    {m.content}
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

                {/* Input flotante */}
                <div className="relative z-10 px-10 pb-8">
                    <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-full border border-cuali-blue-light/50 bg-cuali-blue-soft/70 px-6 py-4 shadow-lg backdrop-blur-xl">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Escribe tu mensaje…"
                            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-cuali-blue-dark text-white transition disabled:opacity-40"
                        >
                            <ArrowUp size={16} />
                        </button>
                    </div>
                </div>

                <style>{`
          .content-blob {
            position: absolute;
            border-radius: 9999px;
            filter: blur(75px);
          }
          .content-blob-1 { width: 340px; height: 340px; top: -120px; right: -60px; background: var(--blue-light); opacity: 0.4; }
          .content-blob-2 { width: 260px; height: 260px; top: 28%; right: 12%; background: var(--lavender); opacity: 0.25; }
          .content-blob-3 { width: 300px; height: 300px; bottom: -100px; left: 5%; background: var(--blue-light); opacity: 0.35; }
          .content-blob-4 { width: 220px; height: 220px; top: 55%; left: -60px; background: var(--sage); opacity: 0.2; }
          .content-blob-5 { width: 260px; height: 260px; bottom: 10%; right: -80px; background: var(--blue-light); opacity: 0.3; }
        `}</style>
            </div>
        </div>
    );
}