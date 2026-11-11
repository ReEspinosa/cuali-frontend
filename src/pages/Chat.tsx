import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import AvisoFalla, { type EnvioFallido } from "../components/AvisoFalla";
import Compositor from "../components/Compositor";
import MensajeBurbuja, { type MensajeChat } from "../components/MensajeBurbuja";
import PaginaCuaderno from "../components/PaginaCuaderno";
import Retroalimentacion from "../components/Retroalimentacion";
import { api, type Adjunto } from "../lib/api";
import { campoPorNombre } from "../lib/campos";

type PlaneacionDetalle = {
    id: string;
    grado: number;
    campo_formativo: string;
    contenido: string;
    grupo: string;
    sesiones: number;
    tema: string;
    status: string;
    mensajes: MensajeChat[];
};

export default function Chat() {
    const { planeacionId } = useParams<{ planeacionId: string }>();
    const navigate = useNavigate();

    const [planeacion, setPlaneacion] = useState<PlaneacionDetalle | null>(null);
    const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
    const [input, setInput] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [generada, setGenerada] = useState(false);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
    const [fallo, setFallo] = useState<EnvioFallido | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!planeacionId) {
            navigate("/planeacion/nueva");
            return;
        }
        let vigente = true;
        api.obtenerPlaneacion(planeacionId)
            .then((data: PlaneacionDetalle) => {
                if (!vigente) return;
                setPlaneacion(data);
                setMensajes(data.mensajes);
                setGenerada(data.status === "finalizada");
            })
            .catch((err) => {
                if (vigente) setErrorCarga(err instanceof Error ? err.message : "No se pudo cargar la planeación.");
            });
        return () => {
            vigente = false;
        };
    }, [planeacionId, navigate]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [mensajes, enviando]);

    async function enviar(reenvio?: EnvioFallido) {
        const texto = reenvio ? reenvio.texto : input.trim();
        const adjuntosAEnviar = reenvio ? reenvio.adjuntos : adjuntos;
        if ((!texto && adjuntosAEnviar.length === 0) || enviando || !planeacionId) return;

        // Un mensaje que fallo antes no quedo guardado en el servidor: se quita
        // de la vista antes de mandar el siguiente.
        const idFallido = fallo?.idLocal;
        setFallo(null);
        if (!reenvio) {
            setAdjuntos([]);
            setInput("");
        }
        setEnviando(true);
        const idLocal = crypto.randomUUID();
        setMensajes((prev) => [
            ...prev.filter((m) => m.id !== idFallido),
            { id: idLocal, role: "user", content: texto, adjuntos: adjuntosAEnviar, local: true },
        ]);

        try {
            const respuesta = await api.enviarMensaje(planeacionId, texto, adjuntosAEnviar);
            setMensajes((prev) => [...prev, respuesta]);
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

    /**
     * Lo que la docente pidio en el chat se manda como indicaciones al
     * volver a generar. La generacion vive en la pagina del documento.
     */
    function aplicarCambios() {
        if (!planeacionId) return;
        navigate(`/planeacion/${planeacionId}`, { state: { generar: true } });
    }

    if (errorCarga || !planeacion) {
        return (
            <PaginaCuaderno>
                <p className={errorCarga ? "text-error" : "text-tinta-tenue"}>{errorCarga ?? "Cargando..."}</p>
            </PaginaCuaderno>
        );
    }

    const campo = campoPorNombre(planeacion.campo_formativo);

    return (
        <PaginaCuaderno sinScroll>
            <header className="relative z-10 border-b border-borde bg-white py-4 pl-16 pr-6 md:pl-24 md:pr-12">
                <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <span
                            className={`self-start rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white ${
                                campo?.clases.fondo ?? "bg-tinta"
                            }`}
                        >
                            {planeacion.campo_formativo}
                        </span>
                        <h1 className="truncate font-display text-xl font-bold">{planeacion.tema || planeacion.contenido}</h1>
                        <p className="text-[13px] text-tinta-tenue">
                            {planeacion.grado}° "{planeacion.grupo}" · {planeacion.sesiones} sesión(es)
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {generada && (
                            <button
                                type="button"
                                onClick={() => navigate(`/planeacion/${planeacion.id}`)}
                                className="flex h-11 items-center gap-2 rounded-md border border-borde-fuerte bg-white px-4 font-bold hover:border-tinta"
                            >
                                <ArrowLeft size={18} aria-hidden="true" />
                                Ver documento
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={aplicarCambios}
                            disabled={enviando}
                            className="flex h-11 items-center gap-2 rounded-md bg-tinta px-4 font-bold text-white transition hover:bg-tinta-fuerte disabled:opacity-40"
                        >
                            <RefreshCw size={18} aria-hidden="true" />
                            {generada ? "Aplicar cambios" : "Generar planeación"}
                        </button>
                    </div>
                </div>
                {generada && (
                    <div className="mx-auto mt-3 max-w-3xl">
                        <Retroalimentacion objetivoTipo="planeacion" objetivoId={planeacion.id} />
                    </div>
                )}
            </header>

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto py-8 pl-16 pr-6 md:pl-24 md:pr-12">
                <div className="mx-auto flex max-w-3xl flex-col gap-5" aria-live="polite">
                    {mensajes.length === 0 && (
                        <p className="rounded-lg border border-borde bg-white px-5 py-4 text-tinta-tenue">
                            Pídele a Cuali los cambios que quieras (por ejemplo, "agrega una actividad al aire libre el miércoles" o "ajusta la evaluación para alumnos con rezago en lectura"). Se aplican al presionar "Aplicar cambios".
                        </p>
                    )}
                    {mensajes.map((m) => (
                        <MensajeBurbuja key={m.id} mensaje={m} objetivoTipo="mensaje" />
                    ))}
                    {enviando && (
                        <p className="self-start rounded-lg border border-borde bg-white px-4 py-3 text-sm text-tinta-tenue">
                            Cuali está escribiendo...
                        </p>
                    )}
                    {fallo && !enviando && <AvisoFalla fallo={fallo} onReintentar={() => enviar(fallo)} deshabilitado={enviando} />}
                </div>
            </div>

            <div className="pb-6 pl-16 pr-6 md:pl-24 md:pr-12">
                <div className="mx-auto max-w-3xl">
                    <Compositor
                        valor={input}
                        onCambio={setInput}
                        onEnviar={() => enviar()}
                        adjuntos={adjuntos}
                        onAdjuntos={setAdjuntos}
                        enviando={enviando}
                    />
                </div>
            </div>
        </PaginaCuaderno>
    );
}
