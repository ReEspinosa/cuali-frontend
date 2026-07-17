import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, PartyPopper, RotateCcw } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import { api } from "../../../lib/api";

type Carta = {
    id: number;
    parId: number;
    texto: string;
    tipo: "concepto" | "definicion";
    volteada: boolean;
    encontrada: boolean;
};

function barajar<T>(arr: T[]): T[] {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

export default function Memorama() {
    const navigate = useNavigate();

    const [tema, setTema] = useState("");
    const [numPares, setNumPares] = useState(6);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [cartas, setCartas] = useState<Carta[] | null>(null);
    const [volteadas, setVolteadas] = useState<number[]>([]);
    const [bloqueado, setBloqueado] = useState(false);
    const [intentos, setIntentos] = useState(0);

    async function handleGenerar() {
        if (!tema.trim()) {
            setError("Escribe el tema antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setCartas(null);
        try {
            const data: { pares: { concepto: string; definicion: string }[] } = await api.generarMemorama({
                tema: tema.trim(),
                num_pares: numPares,
            });

            const nuevasCartas: Carta[] = [];
            data.pares.forEach((par, i) => {
                nuevasCartas.push({ id: i * 2, parId: i, texto: par.concepto, tipo: "concepto", volteada: false, encontrada: false });
                nuevasCartas.push({ id: i * 2 + 1, parId: i, texto: par.definicion, tipo: "definicion", volteada: false, encontrada: false });
            });

            setCartas(barajar(nuevasCartas));
            setVolteadas([]);
            setIntentos(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el memorama.");
        } finally {
            setGenerando(false);
        }
    }

    function handleClickCarta(id: number) {
        if (!cartas || bloqueado) return;
        const carta = cartas.find((c) => c.id === id);
        if (!carta || carta.volteada || carta.encontrada) return;
        if (volteadas.length === 2) return;

        const nuevasCartas = cartas.map((c) => (c.id === id ? { ...c, volteada: true } : c));
        const nuevasVolteadas = [...volteadas, id];
        setCartas(nuevasCartas);
        setVolteadas(nuevasVolteadas);

        if (nuevasVolteadas.length === 2) {
            setIntentos((n) => n + 1);
            const [id1, id2] = nuevasVolteadas;
            const c1 = nuevasCartas.find((c) => c.id === id1)!;
            const c2 = nuevasCartas.find((c) => c.id === id2)!;

            if (c1.parId === c2.parId) {
                setCartas((prev) => prev!.map((c) => (c.id === id1 || c.id === id2 ? { ...c, encontrada: true } : c)));
                setVolteadas([]);
            } else {
                setBloqueado(true);
                setTimeout(() => {
                    setCartas((prev) => prev!.map((c) => (c.id === id1 || c.id === id2 ? { ...c, volteada: false } : c)));
                    setVolteadas([]);
                    setBloqueado(false);
                }, 4000);
            }
        }
    }

    const ganado = cartas !== null && cartas.every((c) => c.encontrada);

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                </div>

                <div className="relative z-10 mx-auto max-w-4xl px-10 py-12">
                    <button
                        onClick={() => navigate("/recursos/juegos")}
                        className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                    >
                        <ArrowLeft size={16} />
                        Volver a Juegos
                    </button>

                    <h1 className="font-serif text-3xl font-semibold text-ink">Memorama</h1>
                    <p className="mt-2 text-sm text-ink-soft">
                        Encuentra cada concepto con su definición. Si no hacen match, las cartas se voltean solas en 4
                        segundos.
                    </p>

                    {!cartas && (
                        <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                            <p className="mb-3 text-sm font-semibold text-ink">Tema</p>
                            <input
                                value={tema}
                                onChange={(e) => setTema(e.target.value)}
                                placeholder="Los estados del agua"
                                className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                            />

                            <p className="mb-3 text-sm font-semibold text-ink">Número de pares</p>
                            <div className="mb-7 flex items-center gap-4">
                                <input
                                    type="range"
                                    min={4}
                                    max={10}
                                    value={numPares}
                                    onChange={(e) => setNumPares(parseInt(e.target.value, 10))}
                                    className="flex-1 accent-cuali-blue"
                                />
                                <span className="w-8 text-center text-lg font-semibold text-ink">{numPares}</span>
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
                                    "Generar memorama"
                                )}
                            </button>
                        </div>
                    )}

                    {cartas && (
                        <div className="mt-8">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm text-ink-soft">Intentos: {intentos}</p>
                                <button
                                    onClick={() => setCartas(null)}
                                    className="flex items-center gap-2 rounded-xl bg-cuali-blue-soft px-4 py-2 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                                >
                                    <RotateCcw size={14} />
                                    Nuevo tema
                                </button>
                            </div>

                            {ganado && (
                                <div className="mb-5 flex items-center gap-2 rounded-xl bg-cuali-blue-soft px-5 py-3 text-sm font-semibold text-cuali-blue-dark">
                                    <PartyPopper size={18} />
                                    ¡Completado en {intentos} intentos!
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                {cartas.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleClickCarta(c.id)}
                                        disabled={c.encontrada}
                                        className="aspect-[4/3] [perspective:800px]"
                                    >
                                        <div
                                            className="relative h-full w-full rounded-xl transition-transform duration-500 [transform-style:preserve-3d]"
                                            style={{ transform: c.volteada || c.encontrada ? "rotateY(180deg)" : "rotateY(0deg)" }}
                                        >
                                            {/* Reverso (boca abajo) */}
                                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-cuali-blue text-2xl text-white [backface-visibility:hidden]">
                                                ❦
                                            </div>
                                            {/* Frente (contenido) */}
                                            <div
                                                className={`absolute inset-0 flex items-center justify-center rounded-xl p-2 text-center text-xs font-medium leading-snug [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                                                    c.encontrada
                                                        ? "bg-cuali-blue-soft text-cuali-blue-dark"
                                                        : "bg-white text-ink shadow-sm"
                                                } ${c.tipo === "concepto" ? "font-bold" : ""}`}
                                            >
                                                {c.texto}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
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