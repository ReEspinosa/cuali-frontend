import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Download, Loader2, Paperclip, X } from "lucide-react";
import { toPng } from "html-to-image";
import Sidebar from "../../components/Sidebar";
import { api, type Adjunto } from "../../lib/api";

const COLORES_RAMA = [
    { fondo: "#E7EEF3", borde: "var(--sage)", texto: "#3F5B45" },
    { fondo: "#FBEAF0", borde: "var(--rose, #C98A96)", texto: "#72243E" },
    { fondo: "#FAEEDA", borde: "var(--amber, #D9A441)", texto: "#633806" },
    { fondo: "#FAECE7", borde: "var(--coral, #E1604C)", texto: "#712B13" },
    { fondo: "#F3E9EC", borde: "var(--berry, #6B2737)", texto: "#4B1528" },
    { fondo: "#E6F1FB", borde: "var(--blue)", texto: "#0C447C" },
];

type Rama = { titulo: string; subpuntos: string[] };
type Resultado = { tema_central: string; ramas: Rama[] };

export default function MapasMentales() {
    const navigate = useNavigate();
    const mapaRef = useRef<HTMLDivElement>(null);

    const [tema, setTema] = useState("");
    const [resumen, setResumen] = useState("");
    const [adjunto, setAdjunto] = useState<Adjunto | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState(false);

    const [resultado, setResultado] = useState<Resultado | null>(null);

    async function handleArchivo(files: FileList | null) {
        if (!files || files.length === 0) return;
        setSubiendo(true);
        setError(null);
        try {
            const subido = await api.subirArchivo(files[0]);
            if (!subido.texto_extraido) {
                setError("No se pudo leer el texto de ese archivo. Usa un .docx o .pdf con texto.");
            } else {
                setAdjunto(subido);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo subir el archivo.");
        } finally {
            setSubiendo(false);
        }
    }

    async function handleGenerar() {
        if (!tema.trim() || !resumen.trim()) {
            setError("Escribe el tema y el resumen antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setResultado(null);
        try {
            const data: Resultado = await api.generarMapaMental({
                tema: tema.trim(),
                resumen: resumen.trim(),
                texto_adjunto: adjunto?.texto_extraido ?? undefined,
            });
            setResultado(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el mapa mental.");
        } finally {
            setGenerando(false);
        }
    }

    async function handleDescargar() {
        if (!mapaRef.current) return;
        setDescargando(true);
        try {
            const dataUrl = await toPng(mapaRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `mapa_mental_${(resultado?.tema_central ?? "cuali").slice(0, 30)}.png`;
            a.click();
        } catch {
            setError("No se pudo descargar la imagen.");
        } finally {
            setDescargando(false);
        }
    }

    // Posiciones radiales para hasta 6 ramas alrededor del nodo central
    function posicion(index: number, total: number) {
        const angulo = (index / total) * 2 * Math.PI - Math.PI / 2;
        const radioX = 40;
        const radioY = 36;
        const cx = 50 + radioX * Math.cos(angulo);
        const cy = 50 + radioY * Math.sin(angulo);
        return { left: `${cx}%`, top: `${cy}%` };
    }

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
                        onClick={() => navigate("/recursos")}
                        className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                    >
                        <ChevronLeft size={16} />
                        Volver a Recursos
                    </button>

                    <h1 className="font-serif text-3xl font-semibold text-ink">Mapas mentales</h1>
                    <p className="mt-2 text-sm text-ink-soft">
                        Cuali organiza un tema en un mapa visual para tus alumnos.
                    </p>

                    <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                        <p className="mb-3 text-sm font-semibold text-ink">1. Tema</p>
                        <input
                            value={tema}
                            onChange={(e) => setTema(e.target.value)}
                            placeholder="El ciclo del agua"
                            className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        />

                        <p className="mb-3 text-sm font-semibold text-ink">2. Mini resumen</p>
                        <textarea
                            value={resumen}
                            onChange={(e) => setResumen(e.target.value)}
                            rows={3}
                            placeholder="Quiero que se vean las etapas: evaporación, condensación, precipitación y escurrimiento..."
                            className="mb-5 w-full resize-none rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        />

                        {adjunto ? (
                            <div className="mb-5 flex items-center gap-2 rounded-xl border border-cuali-blue-light/50 bg-cuali-blue-soft px-4 py-2.5 text-sm text-ink">
                                <Paperclip size={15} />
                                <span className="flex-1 truncate">{adjunto.filename}</span>
                                <button onClick={() => setAdjunto(null)} className="text-ink-soft hover:text-ink">
                                    <X size={15} />
                                </button>
                            </div>
                        ) : (
                            <label className="mb-5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-cuali-blue-light px-4 py-3 text-sm text-ink-soft transition hover:border-cuali-blue hover:text-ink">
                                <Paperclip size={15} />
                                {subiendo ? "Subiendo…" : "Adjuntar planeación o material del tema (opcional, .docx o .pdf)"}
                                <input
                                    type="file"
                                    accept=".docx,.pdf"
                                    className="hidden"
                                    onChange={(e) => handleArchivo(e.target.files)}
                                />
                            </label>
                        )}

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
                                "Generar mapa mental"
                            )}
                        </button>
                    </div>

                    {resultado && (
                        <div className="mt-10">
                            <div className="mb-4 flex items-center justify-end">
                                <button
                                    onClick={handleDescargar}
                                    disabled={descargando}
                                    className="flex items-center gap-2 rounded-xl bg-cuali-blue px-4 py-2.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-50"
                                >
                                    <Download size={15} />
                                    {descargando ? "Descargando…" : "Descargar imagen"}
                                </button>
                            </div>

                            <div
                                ref={mapaRef}
                                className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6"
                                style={{ height: 560 }}
                            >
                                {/* Líneas del centro a cada rama */}
                                <svg className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }}>
                                    {resultado.ramas.map((_, i) => {
                                        const pos = posicion(i, resultado.ramas.length);
                                        return (
                                            <line
                                                key={i}
                                                x1="50%"
                                                y1="50%"
                                                x2={pos.left}
                                                y2={pos.top}
                                                stroke="var(--border, #ddd)"
                                                strokeWidth={2}
                                            />
                                        );
                                    })}
                                </svg>

                                {/* Nodo central */}
                                <div
                                    className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cuali-blue px-6 py-5 text-center shadow-md"
                                    style={{ left: "50%", top: "50%", zIndex: 10, maxWidth: 180 }}
                                >
                                    <span className="font-serif text-base font-semibold text-white">
                                        {resultado.tema_central}
                                    </span>
                                </div>

                                {/* Ramas */}
                                {resultado.ramas.map((rama, i) => {
                                    const pos = posicion(i, resultado.ramas.length);
                                    const c = COLORES_RAMA[i % COLORES_RAMA.length];
                                    return (
                                        <div
                                            key={i}
                                            className="absolute w-52 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 p-3 text-left shadow-sm"
                                            style={{ left: pos.left, top: pos.top, background: c.fondo, borderColor: c.borde, zIndex: 10 }}
                                        >
                                            <p className="mb-1.5 text-sm font-bold" style={{ color: c.texto }}>
                                                {rama.titulo}
                                            </p>
                                            <ul className="flex flex-col gap-0.5">
                                                {rama.subpuntos.map((s, j) => (
                                                    <li key={j} className="text-xs leading-snug" style={{ color: c.texto }}>
                                                        • {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
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