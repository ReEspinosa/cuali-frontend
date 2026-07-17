import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, PartyPopper, RotateCcw, X } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import { api } from "../../../lib/api";

const SEGUNDOS_POR_PREGUNTA = 8;

type Afirmacion = { afirmacion: string; correcta: boolean };

export default function VerdaderoFalso() {
    const navigate = useNavigate();

    const [tema, setTema] = useState("");
    const [numAfirmaciones, setNumAfirmaciones] = useState(8);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [afirmaciones, setAfirmaciones] = useState<Afirmacion[] | null>(null);
    const [indice, setIndice] = useState(0);
    const [aciertos, setAciertos] = useState(0);
    const [tiempoRestante, setTiempoRestante] = useState(SEGUNDOS_POR_PREGUNTA);
    const [respuesta, setRespuesta] = useState<"correcta" | "incorrecta" | "tiempo" | null>(null);

    async function handleGenerar() {
        if (!tema.trim()) {
            setError("Escribe el tema antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setAfirmaciones(null);
        try {
            const data: { afirmaciones: Afirmacion[] } = await api.generarVerdaderoFalso({
                tema: tema.trim(),
                num_afirmaciones: numAfirmaciones,
            });
            setAfirmaciones(data.afirmaciones);
            setIndice(0);
            setAciertos(0);
            setTiempoRestante(SEGUNDOS_POR_PREGUNTA);
            setRespuesta(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el juego.");
        } finally {
            setGenerando(false);
        }
    }

    const terminado = afirmaciones !== null && indice >= afirmaciones.length;

    useEffect(() => {
        if (!afirmaciones || terminado || respuesta !== null) return;
        if (tiempoRestante <= 0) {
            setRespuesta("tiempo");
            return;
        }
        const t = setTimeout(() => setTiempoRestante((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [tiempoRestante, afirmaciones, terminado, respuesta]);

    function handleResponder(valor: boolean) {
        if (!afirmaciones || respuesta !== null) return;
        const correcta = afirmaciones[indice].correcta === valor;
        if (correcta) setAciertos((a) => a + 1);
        setRespuesta(correcta ? "correcta" : "incorrecta");
    }

    function siguiente() {
        if (!afirmaciones) return;
        setIndice((i) => i + 1);
        setTiempoRestante(SEGUNDOS_POR_PREGUNTA);
        setRespuesta(null);
    }

    const actual = afirmaciones?.[indice];

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                </div>

                <div className="relative z-10 mx-auto max-w-2xl px-10 py-12">
                    <button
                        onClick={() => navigate("/recursos/juegos")}
                        className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                    >
                        <ArrowLeft size={16} />
                        Volver a Juegos
                    </button>

                    <h1 className="font-serif text-3xl font-semibold text-ink">Verdadero o Falso</h1>
                    <p className="mt-2 text-sm text-ink-soft">Responde rápido antes de que se acabe el tiempo.</p>

                    {!afirmaciones && (
                        <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                            <p className="mb-3 text-sm font-semibold text-ink">Tema</p>
                            <input
                                value={tema}
                                onChange={(e) => setTema(e.target.value)}
                                placeholder="El cuidado del medio ambiente"
                                className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                            />

                            <p className="mb-3 text-sm font-semibold text-ink">Número de afirmaciones</p>
                            <div className="mb-7 flex items-center gap-4">
                                <input
                                    type="range"
                                    min={6}
                                    max={10}
                                    value={numAfirmaciones}
                                    onChange={(e) => setNumAfirmaciones(parseInt(e.target.value, 10))}
                                    className="flex-1 accent-cuali-blue"
                                />
                                <span className="w-8 text-center text-lg font-semibold text-ink">{numAfirmaciones}</span>
                            </div>

                            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                            <button
                                onClick={handleGenerar}
                                disabled={generando}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cuali-blue py-3.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-50"
                            >
                                {generando ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Generando…
                                    </>
                                ) : (
                                    "Generar juego"
                                )}
                            </button>
                        </div>
                    )}

                    {afirmaciones && !terminado && actual && (
                        <div className="mt-8 flex flex-col items-center">
                            <div className="mb-4 flex w-full items-center justify-between text-sm text-ink-soft">
                                <span>
                                    Pregunta {indice + 1} / {afirmaciones.length} · Aciertos: {aciertos}
                                </span>
                                <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                                        tiempoRestante <= 3 ? "bg-red-100 text-red-600" : "bg-cuali-blue-soft text-cuali-blue-dark"
                                    }`}
                                >
                                    {tiempoRestante}
                                </span>
                            </div>

                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-cuali-blue-soft">
                                <div
                                    className="h-full rounded-full bg-cuali-blue transition-all duration-1000 ease-linear"
                                    style={{ width: `${(tiempoRestante / SEGUNDOS_POR_PREGUNTA) * 100}%` }}
                                />
                            </div>

                            <p className="mt-8 max-w-md text-center text-lg font-medium text-ink">{actual.afirmacion}</p>

                            {respuesta === null ? (
                                <div className="mt-8 flex gap-4">
                                    <button
                                        onClick={() => handleResponder(true)}
                                        className="flex items-center gap-2 rounded-xl bg-cuali-blue px-8 py-3.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark"
                                    >
                                        <Check size={16} />
                                        Verdadero
                                    </button>
                                    <button
                                        onClick={() => handleResponder(false)}
                                        className="flex items-center gap-2 rounded-xl bg-cuali-blue-dark px-8 py-3.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue"
                                    >
                                        <X size={16} />
                                        Falso
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-8 flex flex-col items-center gap-3">
                                    <p
                                        className={`text-sm font-semibold ${
                                            respuesta === "correcta" ? "text-cuali-blue-dark" : "text-red-600"
                                        }`}
                                    >
                                        {respuesta === "tiempo"
                                            ? "Se acabó el tiempo."
                                            : respuesta === "correcta"
                                                ? "¡Correcto!"
                                                : "Incorrecto."}{" "}
                                        La respuesta era: {actual.correcta ? "Verdadero" : "Falso"}.
                                    </p>
                                    <button
                                        onClick={siguiente}
                                        className="rounded-xl bg-cuali-blue-soft px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                                    >
                                        {indice + 1 < afirmaciones.length ? "Siguiente" : "Ver resultado"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {terminado && afirmaciones && (
                        <div className="mt-10 flex flex-col items-center rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
                            <PartyPopper size={28} className="mb-3 text-cuali-blue-dark" />
                            <p className="font-serif text-xl font-semibold text-ink">¡Terminaste!</p>
                            <p className="mt-2 text-sm text-ink-soft">
                                Acertaste {aciertos} de {afirmaciones.length} afirmaciones.
                            </p>
                            <button
                                onClick={() => setAfirmaciones(null)}
                                className="mt-5 flex items-center gap-2 rounded-xl bg-cuali-blue-soft px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                            >
                                <RotateCcw size={14} />
                                Jugar con otro tema
                            </button>
                        </div>
                    )}
                </div>

                <style>{`
          .content-blob { position: absolute; border-radius: 9999px; filter: blur(60px); }
          .content-blob-1 { width: 380px; height: 380px; top: -120px; right: -60px; background: var(--blue); opacity: 0.3; }
          .content-blob-2 { width: 300px; height: 300px; top: 40%; left: -80px; background: var(--blue-light); opacity: 0.55; }
          .content-blob-3 { width: 320px; height: 320px; bottom: -100px; right: 10%; background: var(--blue); opacity: 0.25; }
        `}</style>
            </div>
        </div>
    );
}