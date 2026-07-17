import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Download, Loader2, Paperclip, X } from "lucide-react";
import { toPng } from "html-to-image";
import Sidebar from "../../components/Sidebar";
import { api, type Adjunto } from "../../lib/api";

const COLORES = [
    { id: "azul", hex: "#4E7AB5" },
    { id: "rosa", hex: "#D4537E" },
    { id: "amarillo", hex: "#BA7517" },
    { id: "verde", hex: "#639922" },
    { id: "naranja", hex: "#D85A30" },
];

type Cartel = { titulo: string; subtitulo: string; puntos: string[]; emoji: string; tema_color: string };

export default function Carteles() {
    const navigate = useNavigate();
    const cartelRef = useRef<HTMLDivElement>(null);

    const [tema, setTema] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [color, setColor] = useState("azul");
    const [adjunto, setAdjunto] = useState<Adjunto | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState(false);

    const [cartel, setCartel] = useState<Cartel | null>(null);

    const colorHex = COLORES.find((c) => c.id === (cartel?.tema_color ?? color))?.hex ?? "#4E7AB5";

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
        if (!tema.trim() || !descripcion.trim()) {
            setError("Escribe el tema y la descripción antes de generar.");
            return;
        }
        setError(null);
        setGenerando(true);
        setCartel(null);
        try {
            const data: Cartel = await api.generarCartel({
                tema: tema.trim(),
                descripcion: descripcion.trim(),
                tema_color: color,
                texto_adjunto: adjunto?.texto_extraido ?? undefined,
            });
            setCartel(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el cartel.");
        } finally {
            setGenerando(false);
        }
    }

    async function handleDescargar() {
        if (!cartelRef.current) return;
        setDescargando(true);
        try {
            const dataUrl = await toPng(cartelRef.current, { pixelRatio: 2 });
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `cartel_${(cartel?.titulo ?? "cuali").slice(0, 30)}.png`;
            a.click();
        } catch {
            setError("No se pudo descargar la imagen.");
        } finally {
            setDescargando(false);
        }
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

                <div className="relative z-10 mx-auto max-w-3xl px-10 py-12">
                    <button
                        onClick={() => navigate("/recursos")}
                        className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                    >
                        <ChevronLeft size={16} />
                        Volver a Recursos
                    </button>

                    <h1 className="font-serif text-3xl font-semibold text-ink">Carteles e infografías</h1>
                    <p className="mt-2 text-sm text-ink-soft">
                        Cuali arma un cartel visual para imprimir y pegar en el salón.
                    </p>

                    <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                        <p className="mb-3 text-sm font-semibold text-ink">1. Elige el tema de color</p>
                        <div className="mb-7 flex gap-3">
                            {COLORES.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setColor(c.id)}
                                    className="h-11 w-11 rounded-xl transition hover:scale-105"
                                    style={{
                                        background: c.hex,
                                        outline: color === c.id ? `3px solid ${c.hex}` : "none",
                                        outlineOffset: "3px",
                                    }}
                                />
                            ))}
                        </div>

                        <p className="mb-3 text-sm font-semibold text-ink">2. Tema del cartel</p>
                        <input
                            value={tema}
                            onChange={(e) => setTema(e.target.value)}
                            placeholder="Cuida el agua"
                            className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        />

                        <p className="mb-3 text-sm font-semibold text-ink">3. ¿Qué debe transmitir?</p>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            rows={3}
                            placeholder="Tips sencillos para ahorrar agua en la escuela y en casa..."
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
                                {subiendo ? "Subiendo…" : "Adjuntar material del tema (opcional, .docx o .pdf)"}
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
                                "Generar cartel"
                            )}
                        </button>
                    </div>

                    {cartel && (
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
                                ref={cartelRef}
                                className="relative mx-auto overflow-hidden rounded-2xl p-10 shadow-lg"
                                style={{ background: colorHex, width: 420, aspectRatio: "3 / 4" }}
                            >
                                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                                    <div className="cartel-blob" style={{ width: 220, height: 220, top: -70, right: -60 }} />
                                    <div className="cartel-blob" style={{ width: 160, height: 160, bottom: -50, left: -40 }} />
                                    <div className="cartel-blob" style={{ width: 120, height: 120, top: "45%", left: "60%" }} />
                                    <div className="cartel-blob" style={{ width: 100, height: 100, bottom: "25%", left: "10%" }} />
                                </div>

                                <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
                                    <span className="mb-4 text-6xl">{cartel.emoji}</span>
                                    <h2 className="font-serif text-3xl font-bold leading-tight text-white">{cartel.titulo}</h2>
                                    {cartel.subtitulo && (
                                        <p className="mt-2 text-sm text-white/85">{cartel.subtitulo}</p>
                                    )}
                                    <ul className="mt-6 flex flex-col gap-2.5">
                                        {cartel.puntos.map((p, i) => (
                                            <li key={i} className="text-base font-medium text-white">
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <style>{`
          .content-blob { position: absolute; border-radius: 9999px; filter: blur(60px); }
          .content-blob-1 { width: 380px; height: 380px; top: -120px; right: -60px; background: var(--blue); opacity: 0.3; }
          .content-blob-2 { width: 300px; height: 300px; top: 40%; left: -80px; background: var(--blue-light); opacity: 0.55; }
          .content-blob-3 { width: 320px; height: 320px; bottom: -100px; right: 10%; background: var(--blue); opacity: 0.25; }

          .cartel-blob { position: absolute; border-radius: 9999px; background: white; opacity: 0.16; filter: blur(24px); }
        `}</style>
            </div>
        </div>
    );
}