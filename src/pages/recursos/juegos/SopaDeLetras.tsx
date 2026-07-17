import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, PartyPopper, RotateCcw } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import { api } from "../../../lib/api";

type Celda = [number, number];
type Solucion = { palabra: string; celdas: Celda[] };
type Sopa = { tema: string; grid: string[][]; soluciones: Solucion[]; palabras: string[]; tamano: number };

function celdasIguales(a: Celda[], b: Celda[]): boolean {
    if (a.length !== b.length) return false;
    const mismo = a.every(([r, c], i) => r === b[i][0] && c === b[i][1]);
    const invertido = a.every(([r, c], i) => r === b[b.length - 1 - i][0] && c === b[b.length - 1 - i][1]);
    return mismo || invertido;
}

function lineaEntre(inicio: Celda, fin: Celda): Celda[] | null {
    const [r1, c1] = inicio;
    const [r2, c2] = fin;
    const dr = r2 - r1;
    const dc = c2 - c1;
    if (dr === 0 && dc === 0) return [inicio];
    const esRecta = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
    if (!esRecta) return null;
    const pasos = Math.max(Math.abs(dr), Math.abs(dc));
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    const celdas: Celda[] = [];
    for (let i = 0; i <= pasos; i++) celdas.push([r1 + stepR * i, c1 + stepC * i]);
    return celdas;
}

export default function SopaDeLetras() {
    const navigate = useNavigate();

    const [tema, setTema] = useState("");
    const [numPalabras, setNumPalabras] = useState(8);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sopa, setSopa] = useState<Sopa | null>(null);
    const [encontradas, setEncontradas] = useState<Set<string>>(new Set());
    const [celdasVerdes, setCeldasVerdes] = useState<Set<string>>(new Set());
    const [seleccionando, setSeleccionando] = useState(false);
    void seleccionando;
    const [inicio, setInicio] = useState<Celda | null>(null);
    const [pathActual, setPathActual] = useState<Celda[]>([]);
    const mouseAbajo = useRef(false);

    async function handleGenerar() {
        if (!tema.trim()) {
            setError("Escribe el tema antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setSopa(null);
        try {
            const data: Sopa = await api.generarSopaDeLetras({ tema: tema.trim(), num_palabras: numPalabras });
            setSopa(data);
            setEncontradas(new Set());
            setCeldasVerdes(new Set());
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar la sopa de letras.");
        } finally {
            setGenerando(false);
        }
    }

    function iniciarSeleccion(r: number, c: number) {
        mouseAbajo.current = true;
        setSeleccionando(true);
        setInicio([r, c]);
        setPathActual([[r, c]]);
    }

    function extenderSeleccion(r: number, c: number) {
        if (!mouseAbajo.current || !inicio) return;
        const linea = lineaEntre(inicio, [r, c]);
        if (linea) setPathActual(linea);
    }

    function finalizarSeleccion() {
        if (!sopa || !mouseAbajo.current) return;
        mouseAbajo.current = false;
        setSeleccionando(false);

        const match = sopa.soluciones.find(
            (s) => !encontradas.has(s.palabra) && celdasIguales(s.celdas, pathActual)
        );
        if (match) {
            setEncontradas((prev) => new Set(prev).add(match.palabra));
            setCeldasVerdes((prev) => {
                const nuevo = new Set(prev);
                match.celdas.forEach(([r, c]) => nuevo.add(`${r}-${c}`));
                return nuevo;
            });
        }
        setPathActual([]);
        setInicio(null);
    }

    const ganado = sopa !== null && encontradas.size === sopa.palabras.length;
    const pathSet = new Set(pathActual.map(([r, c]) => `${r}-${c}`));

    return (
        <div
            className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink"
            onMouseUp={finalizarSeleccion}
            onMouseLeave={finalizarSeleccion}
        >
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

                    <h1 className="font-serif text-3xl font-semibold text-ink">Sopa de letras</h1>
                    <p className="mt-2 text-sm text-ink-soft">
                        Arrastra el mouse sobre las letras para seleccionar cada palabra escondida.
                    </p>

                    {!sopa && (
                        <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                            <p className="mb-3 text-sm font-semibold text-ink">Tema</p>
                            <input
                                value={tema}
                                onChange={(e) => setTema(e.target.value)}
                                placeholder="Los planetas del sistema solar"
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
                                    "Generar sopa de letras"
                                )}
                            </button>
                        </div>
                    )}

                    {sopa && (
                        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
                            <div className="flex-1">
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-sm text-ink-soft">
                                        Encontradas: {encontradas.size} / {sopa.palabras.length}
                                    </p>
                                    <button
                                        onClick={() => setSopa(null)}
                                        className="flex items-center gap-2 rounded-xl bg-cuali-blue-soft px-4 py-2 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                                    >
                                        <RotateCcw size={14} />
                                        Nuevo tema
                                    </button>
                                </div>

                                {ganado && (
                                    <div className="mb-5 flex items-center gap-2 rounded-xl bg-cuali-blue-soft px-5 py-3 text-sm font-semibold text-cuali-blue-dark">
                                        <PartyPopper size={18} />
                                        ¡Encontraste todas las palabras!
                                    </div>
                                )}

                                <div
                                    className="inline-grid select-none gap-0.5 rounded-xl bg-white p-3 shadow-sm"
                                    style={{ gridTemplateColumns: `repeat(${sopa.tamano}, minmax(0, 1fr))` }}
                                >
                                    {sopa.grid.map((fila, r) =>
                                        fila.map((letra, c) => {
                                            const key = `${r}-${c}`;
                                            const esVerde = celdasVerdes.has(key);
                                            const esSeleccion = pathSet.has(key);
                                            return (
                                                <div
                                                    key={key}
                                                    onMouseDown={() => iniciarSeleccion(r, c)}
                                                    onMouseEnter={() => extenderSeleccion(r, c)}
                                                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded text-sm font-semibold transition ${
                                                        esVerde
                                                            ? "bg-cuali-blue-soft text-cuali-blue-dark"
                                                            : esSeleccion
                                                                ? "bg-cuali-blue text-white"
                                                                : "text-ink hover:bg-cuali-blue-soft/50"
                                                    }`}
                                                >
                                                    {letra}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="w-full lg:w-52">
                                <p className="mb-3 text-sm font-semibold text-ink">Palabras a encontrar</p>
                                <ul className="flex flex-col gap-2">
                                    {sopa.palabras.map((p) => (
                                        <li
                                            key={p}
                                            className={`rounded-lg px-3 py-2 text-sm ${
                                                encontradas.has(p)
                                                    ? "bg-cuali-blue-soft text-cuali-blue-dark line-through"
                                                    : "bg-white text-ink shadow-sm"
                                            }`}
                                        >
                                            {p}
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