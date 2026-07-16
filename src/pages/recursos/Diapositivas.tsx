import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, Download, Loader2, Paperclip, X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { api, type Adjunto } from "../../lib/api";

const COLORES = [
    { id: "azul", hex: "#4E7AB5" },
    { id: "rosa", hex: "#D4537E" },
    { id: "amarillo", hex: "#BA7517" },
    { id: "verde", hex: "#639922" },
    { id: "naranja", hex: "#D85A30" },
];

type Slide = { titulo: string; puntos: string[]; emoji: string };
type Resultado = { id: string; titulo: string; tema_color: string; diapositivas: Slide[]; pptx_url: string };

export default function Diapositivas() {
    const navigate = useNavigate();

    const [color, setColor] = useState("azul");
    const [numSlides, setNumSlides] = useState(8);
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [adjunto, setAdjunto] = useState<Adjunto | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [slideActual, setSlideActual] = useState(0);
    const [descargando, setDescargando] = useState(false);

    const colorHex = COLORES.find((c) => c.id === (resultado?.tema_color ?? color))?.hex ?? "#4E7AB5";

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
        if (!titulo.trim() || !descripcion.trim()) {
            setError("Escribe el título y la descripción antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setResultado(null);
        try {
            const data: Resultado = await api.generarDiapositivas({
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                tema_color: color,
                num_diapositivas: numSlides,
                texto_adjunto: adjunto?.texto_extraido ?? undefined,
            });
            setResultado(data);
            setSlideActual(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron generar las diapositivas.");
        } finally {
            setGenerando(false);
        }
    }

    async function handleDescargar() {
        if (!resultado) return;
        setDescargando(true);
        try {
            const blob = await api.descargarPptxBlob(resultado.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `diapositivas_${resultado.titulo.slice(0, 30)}.pptx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo descargar el archivo.");
        } finally {
            setDescargando(false);
        }
    }

    const slide = resultado?.diapositivas[slideActual];

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
                        onClick={() => navigate("/recursos")}
                        className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                    >
                        <ChevronLeft size={16} />
                        Volver a Recursos
                    </button>

                    <h1 className="font-serif text-3xl font-semibold text-ink">Diapositivas</h1>
                    <p className="mt-2 text-sm text-ink-soft">
                        Cuali arma una presentación infantil y colorida, lista para proyectar o descargar.
                    </p>

                    <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                        <p className="mb-3 text-sm font-semibold text-ink">1. Elige el tema de color</p>
                        <div className="mb-7 flex gap-3">
                            {COLORES.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setColor(c.id)}
                                    title={c.id}
                                    className="h-11 w-11 rounded-xl transition hover:scale-105"
                                    style={{
                                        background: c.hex,
                                        outline: color === c.id ? `3px solid ${c.hex}` : "none",
                                        outlineOffset: "3px",
                                    }}
                                />
                            ))}
                        </div>

                        <p className="mb-3 text-sm font-semibold text-ink">2. Número de diapositivas</p>
                        <div className="mb-7 flex items-center gap-4">
                            <input
                                type="range"
                                min={3}
                                max={15}
                                value={numSlides}
                                onChange={(e) => setNumSlides(parseInt(e.target.value, 10))}
                                className="flex-1 accent-cuali-blue"
                            />
                            <span className="w-8 text-center text-lg font-semibold text-ink">{numSlides}</span>
                        </div>

                        <p className="mb-3 text-sm font-semibold text-ink">3. Título o tema</p>
                        <input
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="El sistema solar"
                            className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        />

                        <p className="mb-3 text-sm font-semibold text-ink">4. ¿Qué debe incluir?</p>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            rows={3}
                            placeholder="Los 8 planetas con un dato curioso de cada uno, y una actividad de preguntas al final..."
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
                                    Generando… esto puede tardar un minuto
                                </>
                            ) : (
                                "Generar diapositivas"
                            )}
                        </button>
                    </div>

                    {resultado && slide && (
                        <div className="mt-10">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-serif text-xl font-semibold text-ink">{resultado.titulo}</h2>
                                <button
                                    onClick={handleDescargar}
                                    disabled={descargando}
                                    className="flex items-center gap-2 rounded-xl bg-cuali-blue px-4 py-2.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-50"
                                >
                                    <Download size={15} />
                                    {descargando ? "Descargando…" : "Descargar .pptx"}
                                </button>
                            </div>

                            <div
                                className="relative overflow-hidden rounded-2xl p-10 shadow-lg"
                                style={{ background: colorHex, aspectRatio: "16 / 9" }}
                            >
                                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                                    <div className="slide-blob" style={{ width: 180, height: 180, top: -60, right: -40 }} />
                                    <div className="slide-blob" style={{ width: 130, height: 130, bottom: -40, left: -30 }} />
                                    <div className="slide-blob" style={{ width: 100, height: 100, top: "45%", right: "20%" }} />
                                    <div className="slide-blob" style={{ width: 90, height: 90, bottom: "20%", left: "35%" }} />
                                </div>

                                <div className="relative z-10 flex h-full flex-col">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="font-serif text-3xl font-bold text-white">{slide.titulo}</h3>
                                        <span className="text-5xl leading-none">{slide.emoji}</span>
                                    </div>
                                    <ul className="mt-6 flex flex-col gap-3">
                                        {slide.puntos.map((p, i) => (
                                            <li key={i} className="text-lg leading-relaxed text-white">
                                                •&nbsp;&nbsp;{p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-center gap-5">
                                <button
                                    onClick={() => setSlideActual((s) => Math.max(0, s - 1))}
                                    disabled={slideActual === 0}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-cuali-blue-soft text-ink transition hover:bg-cuali-blue-light disabled:opacity-40"
                                >
                                    <ArrowLeft size={17} />
                                </button>
                                <span className="text-sm font-medium text-ink-soft">
                                    {slideActual + 1} / {resultado.diapositivas.length}
                                </span>
                                <button
                                    onClick={() => setSlideActual((s) => Math.min(resultado.diapositivas.length - 1, s + 1))}
                                    disabled={slideActual === resultado.diapositivas.length - 1}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-cuali-blue-soft text-ink transition hover:bg-cuali-blue-light disabled:opacity-40"
                                >
                                    <ArrowRight size={17} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <style>{`
          .content-blob { position: absolute; border-radius: 9999px; filter: blur(60px); }
          .content-blob-1 { width: 380px; height: 380px; top: -120px; right: -60px; background: var(--blue); opacity: 0.3; }
          .content-blob-2 { width: 300px; height: 300px; top: 40%; left: -80px; background: var(--blue-light); opacity: 0.55; }
          .content-blob-3 { width: 320px; height: 320px; bottom: -100px; right: 10%; background: var(--blue); opacity: 0.25; }

          .slide-blob { position: absolute; border-radius: 9999px; background: white; opacity: 0.16; filter: blur(24px); }
        `}</style>
            </div>
        </div>
    );
}