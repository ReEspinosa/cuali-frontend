import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, PartyPopper, RotateCcw, SkipForward } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import { api } from "../../../lib/api";

const MAX_ERRORES = 6;
const ABECEDARIO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

type PalabraPista = { palabra: string; pista: string };

function normalizar(letra: string): string {
    return letra
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace("N~", "Ñ");
}

function DibujoAhorcado({ errores }: { errores: number }) {
    return (
        <svg viewBox="0 0 120 140" className="h-36 w-32">
            <line x1="10" y1="135" x2="90" y2="135" stroke="var(--ink-soft)" strokeWidth="3" />
            <line x1="30" y1="135" x2="30" y2="10" stroke="var(--ink-soft)" strokeWidth="3" />
            <line x1="30" y1="10" x2="80" y2="10" stroke="var(--ink-soft)" strokeWidth="3" />
            <line x1="80" y1="10" x2="80" y2="25" stroke="var(--ink-soft)" strokeWidth="3" />
            {errores > 0 && <circle cx="80" cy="35" r="10" fill="none" stroke="var(--blue)" strokeWidth="3" />}
            {errores > 1 && <line x1="80" y1="45" x2="80" y2="80" stroke="var(--blue)" strokeWidth="3" />}
            {errores > 2 && <line x1="80" y1="55" x2="65" y2="70" stroke="var(--blue)" strokeWidth="3" />}
            {errores > 3 && <line x1="80" y1="55" x2="95" y2="70" stroke="var(--blue)" strokeWidth="3" />}
            {errores > 4 && <line x1="80" y1="80" x2="68" y2="105" stroke="var(--blue)" strokeWidth="3" />}
            {errores > 5 && <line x1="80" y1="80" x2="92" y2="105" stroke="var(--blue)" strokeWidth="3" />}
        </svg>
    );
}

export default function Ahorcado() {
    const navigate = useNavigate();

    const [tema, setTema] = useState("");
    const [numPalabras, setNumPalabras] = useState(5);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [palabras, setPalabras] = useState<PalabraPista[] | null>(null);
    const [indice, setIndice] = useState(0);
    const [letrasUsadas, setLetrasUsadas] = useState<Set<string>>(new Set());
    const [errores, setErrores] = useState(0);
    const [aciertos, setAciertos] = useState(0);

    async function handleGenerar() {
        if (!tema.trim()) {
            setError("Escribe el tema antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setPalabras(null);
        try {
            const data: { palabras: PalabraPista[] } = await api.generarAhorcado({
                tema: tema.trim(),
                num_palabras: numPalabras,
            });
            setPalabras(data.palabras);
            setIndice(0);
            setLetrasUsadas(new Set());
            setErrores(0);
            setAciertos(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el ahorcado.");
        } finally {
            setGenerando(false);
        }
    }

    const actual = palabras?.[indice];
    const palabraNormalizada = actual ? normalizar(actual.palabra) : "";
    const perdido = errores >= MAX_ERRORES;
    const ganado = actual !== undefined && [...palabraNormalizada].every((l) => letrasUsadas.has(l));

    function handleLetra(letra: string) {
        if (!actual || perdido || ganado || letrasUsadas.has(letra)) return;
        const nuevas = new Set(letrasUsadas).add(letra);
        setLetrasUsadas(nuevas);
        if (!palabraNormalizada.includes(letra)) {
            setErrores((e) => e + 1);
        } else if ([...palabraNormalizada].every((l) => nuevas.has(l))) {
            setAciertos((a) => a + 1);
        }
    }

    function siguientePalabra() {
        if (!palabras) return;
        setLetrasUsadas(new Set());
        setErrores(0);
        setIndice((i) => Math.min(i + 1, palabras.length));
    }

    const terminoRonda = palabras !== null && indice >= palabras.length;

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

                    <h1 className="font-serif text-3xl font-semibold text-ink">Ahorcado</h1>
                    <p className="mt-2 text-sm text-ink-soft">Adivina la palabra letra por letra antes de que se acaben los intentos.</p>

                    {!palabras && (
                        <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                            <p className="mb-3 text-sm font-semibold text-ink">Tema</p>
                            <input
                                value={tema}
                                onChange={(e) => setTema(e.target.value)}
                                placeholder="Animales del bosque"
                                className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                            />

                            <p className="mb-3 text-sm font-semibold text-ink">Número de palabras</p>
                            <div className="mb-7 flex items-center gap-4">
                                <input
                                    type="range"
                                    min={3}
                                    max={8}
                                    value={numPalabras}
                                    onChange={(e) => setNumPalabras(parseInt(e.target.value, 10))}
                                    className="flex-1 accent-cuali-blue"
                                />
                                <span className="w-8 text-center text-lg font-semibold text-ink">{numPalabras}</span>
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
                                    "Generar ahorcado"
                                )}
                            </button>
                        </div>
                    )}

                    {palabras && !terminoRonda && actual && (
                        <div className="mt-8 flex flex-col items-center">
                            <p className="mb-2 text-sm text-ink-soft">
                                Palabra {indice + 1} / {palabras.length} · Aciertos: {aciertos}
                            </p>
                            <DibujoAhorcado errores={errores} />

                            <p className="mt-4 max-w-md text-center text-sm italic text-ink-soft">"{actual.pista}"</p>

                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                                {[...palabraNormalizada].map((letra, i) => (
                                    <span
                                        key={i}
                                        className="flex h-10 w-8 items-center justify-center border-b-2 border-ink text-lg font-bold uppercase"
                                    >
                                        {letrasUsadas.has(letra) || perdido ? letra : ""}
                                    </span>
                                ))}
                            </div>

                            {perdido && (
                                <p className="mt-4 text-sm font-semibold text-red-600">
                                    Se acabaron los intentos. La palabra era: {actual.palabra}
                                </p>
                            )}
                            {ganado && !perdido && (
                                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-cuali-blue-dark">
                                    <PartyPopper size={16} />
                                    ¡Correcto!
                                </p>
                            )}

                            <div className="mt-6 grid grid-cols-7 gap-2 sm:grid-cols-9">
                                {ABECEDARIO.map((letra) => {
                                    const usada = letrasUsadas.has(letra);
                                    const acerto = usada && palabraNormalizada.includes(letra);
                                    return (
                                        <button
                                            key={letra}
                                            onClick={() => handleLetra(letra)}
                                            disabled={usada || perdido || ganado}
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                                                usada
                                                    ? acerto
                                                        ? "bg-cuali-blue-soft text-cuali-blue-dark"
                                                        : "bg-red-50 text-red-400"
                                                    : "bg-white text-ink shadow-sm hover:bg-cuali-blue-soft"
                                            } disabled:cursor-not-allowed`}
                                        >
                                            {letra}
                                        </button>
                                    );
                                })}
                            </div>

                            {(perdido || ganado) && (
                                <button
                                    onClick={siguientePalabra}
                                    className="mt-6 flex items-center gap-2 rounded-xl bg-cuali-blue px-6 py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark"
                                >
                                    <SkipForward size={15} />
                                    {indice + 1 < palabras.length ? "Siguiente palabra" : "Ver resultado final"}
                                </button>
                            )}
                        </div>
                    )}

                    {terminoRonda && palabras && (
                        <div className="mt-10 flex flex-col items-center rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
                            <PartyPopper size={28} className="mb-3 text-cuali-blue-dark" />
                            <p className="font-serif text-xl font-semibold text-ink">¡Ronda completada!</p>
                            <p className="mt-2 text-sm text-ink-soft">
                                Acertaste {aciertos} de {palabras.length} palabras.
                            </p>
                            <button
                                onClick={() => setPalabras(null)}
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