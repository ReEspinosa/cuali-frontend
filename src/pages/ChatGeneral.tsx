import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Search, SquarePen } from "lucide-react";
import AvisoFalla, { type EnvioFallido } from "../components/AvisoFalla";
import Compositor from "../components/Compositor";
import MensajeBurbuja, { type MensajeChat } from "../components/MensajeBurbuja";
import PaginaCuaderno from "../components/PaginaCuaderno";
import { api, getUser, type Adjunto } from "../lib/api";

type ConversacionResumen = { id: string; titulo: string; updated_at: string };

const SUGERENCIAS = [
    "¿Qué es un PDA y cómo lo uso en mi planeación?",
    "Dame una actividad de cierre para fracciones en 6°",
    "¿Cómo evalúo un proyecto comunitario?",
    "Ideas para trabajar el eje de inclusión en el aula",
];

export default function ChatGeneral() {
    const { conversacionId } = useParams<{ conversacionId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();

    const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
    const [input, setInput] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
    const [usarLibros, setUsarLibros] = useState(true);
    const [fallo, setFallo] = useState<EnvioFallido | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Id de la conversacion que se acaba de crear en este envio: al cambiar la
    // URL no se recarga desde el servidor, porque borraria el mensaje que se
    // esta mostrando mientras llega la respuesta.
    const recienCreadaRef = useRef<string | null>(null);
    const mensajeInicialUsadoRef = useRef(false);

    useEffect(() => {
        api.listarConversaciones().then(setConversaciones).catch(() => {});
    }, [conversacionId]);

    useEffect(() => {
        if (!conversacionId) {
            setMensajes([]);
            return;
        }
        if (recienCreadaRef.current === conversacionId) return;
        let vigente = true;
        api.obtenerConversacion(conversacionId)
            .then((data) => {
                if (vigente) setMensajes(data.mensajes);
            })
            .catch(() => {
                if (vigente) navigate("/chat", { replace: true });
            });
        return () => {
            vigente = false;
        };
    }, [conversacionId, navigate]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [mensajes, enviando]);

    async function enviar(textoDirecto?: string, reenvio?: EnvioFallido) {
        const texto = reenvio ? reenvio.texto : (textoDirecto ?? input).trim();
        const adjuntosAEnviar = reenvio ? reenvio.adjuntos : adjuntos;
        if ((!texto && adjuntosAEnviar.length === 0) || enviando) return;

        // Un mensaje que fallo antes no quedo guardado en el servidor: se quita
        // de la vista antes de mandar el siguiente.
        const idFallido = fallo?.idLocal;
        setFallo(null);
        if (!reenvio) {
            setInput("");
            setAdjuntos([]);
        }
        setEnviando(true);
        const idLocal = crypto.randomUUID();
        setMensajes((prev) => [
            ...prev.filter((m) => m.id !== idFallido),
            { id: idLocal, role: "user", content: texto, adjuntos: adjuntosAEnviar, local: true },
        ]);

        try {
            let id = conversacionId ?? "";
            if (!id) {
                const nueva = await api.crearConversacion();
                id = nueva.id;
                recienCreadaRef.current = id;
                navigate(`/chat/${id}`, { replace: true });
            }
            const respuesta = await api.enviarMensajeConversacion(id, texto, adjuntosAEnviar, usarLibros);
            setMensajes((prev) => [...prev, respuesta]);
            setConversaciones(await api.listarConversaciones());
        } catch (err) {
            // No se agrega una "respuesta" falsa: se muestra el aviso con
            // la opcion de reenviar el mismo mensaje.
            setFallo({
                idLocal,
                texto,
                adjuntos: adjuntosAEnviar,
                motivo: err instanceof Error ? err.message : "Cuali no pudo responder. Intenta de nuevo.",
            });
        } finally {
            setEnviando(false);
        }
    }

    // Pedido escrito en el inicio: se envia una sola vez al abrir el chat.
    useEffect(() => {
        const estado = location.state as { mensajeInicial?: string } | null;
        if (mensajeInicialUsadoRef.current || conversacionId || !estado?.mensajeInicial) return;
        mensajeInicialUsadoRef.current = true;
        enviar(estado.mensajeInicial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filtro lineal sobre las conversaciones del usuario: O(n).
    const q = busqueda.trim().toLowerCase();
    const filtradas = q ? conversaciones.filter((c) => c.titulo.toLowerCase().includes(q)) : conversaciones;
    const enConversacion = mensajes.length > 0;

    const compositor = (
        <Compositor
            valor={input}
            onCambio={setInput}
            onEnviar={() => enviar()}
            adjuntos={adjuntos}
            onAdjuntos={setAdjuntos}
            enviando={enviando}
            placeholder="Pregunta lo que quieras sobre tu clase o la NEM"
            usarLibros={usarLibros}
            onUsarLibros={setUsarLibros}
        />
    );

    return (
        <PaginaCuaderno sinScroll>
            <div className="flex min-h-0 flex-1">
                <aside className="relative z-10 hidden w-64 flex-shrink-0 flex-col gap-3 border-r border-borde bg-white px-3 py-5 md:flex">
                    <Link
                        to="/chat"
                        className="flex h-10 items-center justify-center gap-2 rounded-md border-[1.5px] border-tinta text-sm font-bold transition hover:bg-relleno"
                    >
                        <SquarePen size={16} aria-hidden="true" />
                        Nueva conversación
                    </Link>
                    <label className="flex h-9 items-center gap-2 rounded-md border border-borde bg-papel px-2.5 text-tinta-tenue">
                        <Search size={15} aria-hidden="true" />
                        <span className="sr-only">Buscar conversaciones</span>
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar"
                            className="min-w-0 flex-1 bg-transparent text-sm text-tinta outline-none"
                        />
                    </label>
                    <p className="px-1 pt-2 text-xs font-bold uppercase tracking-[0.08em] text-tinta-tenue">Conversaciones</p>
                    <nav aria-label="Conversaciones" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                        {filtradas.map((c) => (
                            <Link
                                key={c.id}
                                to={`/chat/${c.id}`}
                                aria-current={c.id === conversacionId ? "page" : undefined}
                                className={`truncate rounded-md px-2.5 py-2 text-sm transition ${
                                    c.id === conversacionId ? "bg-marcatexto-suave font-bold" : "text-tinta-suave hover:bg-relleno"
                                }`}
                            >
                                {c.titulo}
                            </Link>
                        ))}
                        {filtradas.length === 0 && <p className="px-2.5 text-sm text-tinta-tenue">Sin conversaciones todavía.</p>}
                    </nav>
                </aside>

                <div className="relative flex min-w-0 flex-1 flex-col">
                    {!enConversacion ? (
                        <div className="flex flex-1 flex-col justify-center overflow-y-auto py-10 pl-16 pr-6 md:pl-24 md:pr-12">
                            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                                <h1 className="text-balance font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                                    Hola{user?.nombre ? `, ${user.nombre}` : ""}. ¿En qué te <span className="marcatexto">ayudo</span>?
                                </h1>
                                {compositor}
                                <div className="flex flex-wrap gap-2">
                                    {SUGERENCIAS.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setInput(s)}
                                            className="rounded-full border border-borde-fuerte bg-white px-3.5 py-2 text-left text-sm transition hover:border-tinta"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto py-8 pl-16 pr-6 md:pl-24 md:pr-12">
                                <div className="mx-auto flex max-w-3xl flex-col gap-5" aria-live="polite">
                                    {mensajes.map((m) => (
                                        <MensajeBurbuja key={m.id} mensaje={m} objetivoTipo="chat_mensaje" />
                                    ))}
                                    {enviando && (
                                        <p className="self-start rounded-lg border border-borde bg-white px-4 py-3 text-sm text-tinta-tenue">
                                            Cuali está escribiendo...
                                        </p>
                                    )}
                                    {fallo && !enviando && (
                                        <AvisoFalla fallo={fallo} onReintentar={() => enviar(undefined, fallo)} deshabilitado={enviando} />
                                    )}
                                </div>
                            </div>
                            <div className="pb-6 pl-16 pr-6 md:pl-24 md:pr-12">
                                <div className="mx-auto max-w-3xl">{compositor}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PaginaCuaderno>
    );
}
