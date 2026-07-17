import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import { api } from "../../../lib/api";

const COLORES = ["#4E7AB5", "#D4537E", "#BA7517", "#639922", "#D85A30", "#6B2737", "#A9C4E0", "#C98A96", "#3F5B45", "#0C447C"];

type Pregunta = { pregunta: string; respuesta: string };
type Ruleta = { tema: string; preguntas: Pregunta[] };

export default function Ruleta() {
    const navigate = useNavigate();
    const wheelRef = useRef<HTMLDivElement>(null);

    const [tema, setTema] = useState("");
    const [numPreguntas, setNumPreguntas] = useState(8);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [ruleta, setRuleta] = useState<Ruleta | null>(null);
    const [usadas, setUsadas] = useState<Set<number>>(new Set());
    const [ganador, setGanador] = useState<number | null>(null);
    const [girando, setGirando] = useState(false);
    const [mostrarRespuesta, setMostrarRespuesta] = useState(false);

    async function handleGenerar() {
        if (!tema.trim()) {
            setError("Escribe el tema antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setRuleta(null);
        try {
            const data: Ruleta = await api.generarRuleta({ tema: tema.trim(), num_preguntas: numPreguntas });
            setRuleta(data);
            setUsadas(new Set());
            setGanador(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar la ruleta.");
        } finally {
            setGenerando(false);
        }
    }

    function anguloCentro(indice: number, total: number) {
        const porSegmento = 360 / total;
        return indice * porSegmento + porSegmento / 2;
    }

    function handleGirar() {
        if (!ruleta || girando || !wheelRef.current) return;

        const disponibles = ruleta.preguntas.map((_, i) => i).filter((i) => !usadas.has(i));
        if (disponibles.length === 0) return;

        const winner = disponibles[Math.floor(Math.random() * disponibles.length)];
        setGirando(true);
        setMostrarRespuesta(false);
        setGanador(null);

        const el = wheelRef.current;
        const target = 360 * 5 + (360 - anguloCentro(winner, ruleta.preguntas.length));

        el.style.transition = "none";
        el.style.transform = "rotate(0deg)";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.transition = "transform 4s cubic-bezier(0.15, 0.65, 0.2, 1)";
                el.style.transform = `rotate(${target}deg)`;
            });
        });

        const onEnd = () => {
            setGirando(false);
            setGanador(winner);
            setUsadas((prev) => new Set(prev).add(winner));
            el.removeEventListener("transitionend", onEnd);
        };
        el.addEventListener("transitionend", onEnd);
    }

    function reiniciarRonda() {
        setUsadas(new Set());
        setGanador(null);
        setMostrarRespuesta(false);
    }

    const n = ruleta?.preguntas.length ?? 0;
    const porSegmento = n > 0 ? 360 / n : 0;
    const gradiente =
        ruleta && n > 0
            ? `conic-gradient(${ruleta.preguntas
                .map((_, i) => `${COLORES[i % COLORES.length]} ${i * porSegmento}deg ${(i + 1) * porSegmento}deg`)
                .join(", ")})`
            : undefined;

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                </div>

                <div className="relative z-10 mx-auto max-w-3xl px-10 py-12">
                    <button
                        onClick={() => navigate("/recursos/juegos")}
                        className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                    >
                        <ArrowLeft size={16} />
                        Volver a Juegos
                    </button>

                    <h1 className="font-serif text-3xl font-semibold text-ink">Ruleta de preguntas</h1>
                    <p className="mt-2 text-sm text-ink-soft">
                        Gira la ruleta y responde la pregunta que te toque.
                    </p>

                    {!ruleta && (
                        <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                            <p className="mb-3 text-sm font-semibold text-ink">Tema</p>
                            <input
                                value={tema}
                                onChange={(e) => setTema(e.target.value)}
                                placeholder="Repaso de fracciones"
                                className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                            />

                            <p className="mb-3 text-sm font-semibold text-ink">Número de preguntas</p>
                            <div className="mb-7 flex items-center gap-4">
                                <input
                                    type="range"
                                    min={6}
                                    max={10}
                                    value={numPreguntas}
                                    onChange={(e) => setNumPreguntas(parseInt(e.target.value, 10))}
                                    className="flex-1 accent-cuali-blue"
                                />
                                <span className="w-8 text-center text-lg font-semibold text-ink">{numPreguntas}</span>
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
                                    "Generar ruleta"
                                )}
                            </button>
                        </div>
                    )}

                    {ruleta && (
                        <div className="mt-8 flex flex-col items-center">
                            <div className="relative" style={{ width: 320, height: 320 }}>
                                {/* Puntero */}
                                <div
                                    className="absolute left-1/2 top-[-6px] z-20 h-0 w-0 -translate-x-1/2"
                                    style={{
                                        borderLeft: "14px solid transparent",
                                        borderRight: "14px solid transparent",
                                        borderTop: "22px solid var(--blue-dark)",
                                    }}
                                />
                                <div
                                    ref={wheelRef}
                                    className="relative h-full w-full rounded-full shadow-lg"
                                    style={{ background: gradiente }}
                                >
                                    {ruleta.preguntas.map((_, i) => {
                                        const angulo = anguloCentro(i, n);
                                        return (
                                            <div
                                                key={i}
                                                className="absolute left-1/2 top-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-sm font-bold text-white"
                                                style={{
                                                    transform: `rotate(${angulo}deg) translate(105px) rotate(-${angulo}deg)`,
                                                    marginLeft: -16,
                                                    marginTop: -16,
                                                }}
                                            >
                                                {i + 1}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="absolute left-1/2 top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />
                            </div>

                            <button
                                onClick={handleGirar}
                                disabled={girando || usadas.size === n}
                                className="mt-6 rounded-xl bg-cuali-blue px-8 py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-50"
                            >
                                {girando ? "Girando…" : usadas.size === n ? "Ya se usaron todas" : "Girar"}
                            </button>

                            {usadas.size === n && (
                                <button
                                    onClick={reiniciarRonda}
                                    className="mt-3 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                                >
                                    <RotateCcw size={14} />
                                    Reiniciar ronda
                                </button>
                            )}

                            {ganador !== null && (
                                <div className="mt-6 w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm">
                                    <p className="text-lg font-semibold text-ink">
                                        {ruleta.preguntas[ganador].pregunta}
                                    </p>
                                    {mostrarRespuesta ? (
                                        <p className="mt-3 text-sm font-medium text-cuali-blue-dark">
                                            {ruleta.preguntas[ganador].respuesta}
                                        </p>
                                    ) : (
                                        <button
                                            onClick={() => setMostrarRespuesta(true)}
                                            className="mt-3 rounded-lg bg-cuali-blue-soft px-4 py-2 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                                        >
                                            Mostrar respuesta
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setRuleta(null)}
                                className="mt-8 text-sm text-ink-soft transition hover:text-ink"
                            >
                                Generar ruleta de otro tema
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