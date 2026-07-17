import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, Loader2, RotateCcw } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import { api } from "../../../lib/api";

type Pista = {
    numero: number;
    direccion: "across" | "down";
    pista: string;
    palabra: string;
    longitud: number;
    fila: number;
    col: number;
};

type Crucigrama = {
    tema: string;
    celdas: (string | null)[][];
    numeros: Record<string, number>;
    pistas: Pista[];
    ancho: number;
    alto: number;
    no_colocadas: string[];
};

export default function Crucigrama() {
    const navigate = useNavigate();

    const [tema, setTema] = useState("");
    const [numPalabras, setNumPalabras] = useState(8);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [crucigrama, setCrucigrama] = useState<Crucigrama | null>(null);
    const [respuestas, setRespuestas] = useState<Record<string, string>>({});
    const [revision, setRevision] = useState<Record<string, boolean> | null>(null);
    const [solucionVisible, setSolucionVisible] = useState(false);

    async function handleGenerar() {
        if (!tema.trim()) {
            setError("Escribe el tema antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setCrucigrama(null);
        try {
            const data: Crucigrama = await api.generarCrucigrama({ tema: tema.trim(), num_palabras: numPalabras });
            setCrucigrama(data);
            setRespuestas({});
            setRevision(null);
            setSolucionVisible(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el crucigrama.");
        } finally {
            setGenerando(false);
        }
    }

    function handleLetra(r: number, c: number, valor: string) {
        const letra = valor.slice(-1).toUpperCase();
        setRespuestas((prev) => ({ ...prev, [`${r}-${c}`]: letra }));
        setRevision(null);
    }

    function handleRevisar() {
        if (!crucigrama) return;
        const nuevaRevision: Record<string, boolean> = {};
        crucigrama.celdas.forEach((fila, r) => {
            fila.forEach((letra, c) => {
                if (letra === null) return;
                const key = `${r}-${c}`;
                nuevaRevision[key] = (respuestas[key] ?? "") === letra;
            });
        });
        setRevision(nuevaRevision);
    }

    const horizontales = crucigrama?.pistas.filter((p) => p.direccion === "across") ?? [];
    const verticales = crucigrama?.pistas.filter((p) => p.direccion === "down") ?? [];

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                </div>

                <div className="relative z-10 mx-auto max-w-5xl px-10 py-12">
                    <button
                        onClick={() => navigate("/recursos/juegos")}
                        className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                    >
                        <ArrowLeft size={16} />
                        Volver a Juegos
                    </button>

                    <h1 className="font-serif text-3xl font-semibold text-ink">Crucigrama</h1>
                    <p className="mt-2 text-sm text-ink-soft">Resuelve las pistas y completa el crucigrama.</p>

                    {!crucigrama && (
                        <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                            <p className="mb-3 text-sm font-semibold text-ink">Tema</p>
                            <input
                                value={tema}
                                onChange={(e) => setTema(e.target.value)}
                                placeholder="El sistema solar"
                                className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                            />

                            <p className="mb-3 text-sm font-semibold text-ink">Número de palabras</p>
                            <div className="mb-7 flex items-center gap-4">
                                <input
                                    type="range"
                                    min={6}
                                    max={12}
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
                                    "Generar crucigrama"
                                )}
                            </button>
                        </div>
                    )}

                    {crucigrama && (
                        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
                            <div>
                                <div className="mb-4 flex items-center gap-2">
                                    <button
                                        onClick={handleRevisar}
                                        className="flex items-center gap-2 rounded-xl bg-cuali-blue px-4 py-2.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark"
                                    >
                                        <CheckCircle2 size={15} />
                                        Revisar
                                    </button>
                                    <button
                                        onClick={() => setSolucionVisible((v) => !v)}
                                        className="flex items-center gap-2 rounded-xl bg-cuali-blue-soft px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                                    >
                                        <Eye size={15} />
                                        {solucionVisible ? "Ocultar solución" : "Ver solución"}
                                    </button>
                                    <button
                                        onClick={() => setCrucigrama(null)}
                                        className="flex items-center gap-2 rounded-xl bg-cuali-blue-soft px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                                    >
                                        <RotateCcw size={14} />
                                        Nuevo tema
                                    </button>
                                </div>

                                <div
                                    className="inline-grid gap-0.5 rounded-xl bg-white p-3 shadow-sm"
                                    style={{ gridTemplateColumns: `repeat(${crucigrama.ancho}, minmax(0, 1fr))` }}
                                >
                                    {crucigrama.celdas.map((fila, r) =>
                                        fila.map((letra, c) => {
                                            const key = `${r}-${c}`;
                                            if (letra === null) {
                                                return <div key={key} className="h-9 w-9" />;
                                            }
                                            const numero = crucigrama.numeros[key];
                                            const esCorrecta = revision?.[key];
                                            return (
                                                <div key={key} className="relative h-9 w-9">
                                                    {numero && (
                                                        <span className="pointer-events-none absolute left-0.5 top-0 text-[9px] font-semibold text-ink-soft">
                                                            {numero}
                                                        </span>
                                                    )}
                                                    <input
                                                        maxLength={1}
                                                        value={solucionVisible ? letra : (respuestas[key] ?? "")}
                                                        onChange={(e) => handleLetra(r, c, e.target.value)}
                                                        disabled={solucionVisible}
                                                        className={`h-9 w-9 rounded border text-center text-sm font-bold uppercase outline-none focus:border-cuali-blue ${
                                                            revision
                                                                ? esCorrecta
                                                                    ? "border-cuali-blue bg-cuali-blue-soft text-cuali-blue-dark"
                                                                    : "border-red-300 bg-red-50 text-red-600"
                                                                : "border-black/10 bg-white text-ink"
                                                        }`}
                                                    />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {crucigrama.no_colocadas.length > 0 && (
                                    <p className="mt-3 text-xs text-ink-soft">
                                        No se pudieron cruzar en esta cuadrícula: {crucigrama.no_colocadas.join(", ")}
                                    </p>
                                )}
                            </div>

                            <div className="flex-1">
                                <p className="mb-2 text-sm font-semibold text-ink">Horizontales</p>
                                <ul className="mb-6 flex flex-col gap-1.5">
                                    {horizontales.map((p) => (
                                        <li key={`h-${p.numero}`} className="text-sm text-ink-soft">
                                            <span className="font-semibold text-ink">{p.numero}.</span> {p.pista}
                                        </li>
                                    ))}
                                </ul>

                                <p className="mb-2 text-sm font-semibold text-ink">Verticales</p>
                                <ul className="flex flex-col gap-1.5">
                                    {verticales.map((p) => (
                                        <li key={`v-${p.numero}`} className="text-sm text-ink-soft">
                                            <span className="font-semibold text-ink">{p.numero}.</span> {p.pista}
                                        </li>
                                    ))}
                                </ul>
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