import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Download, Loader2, Paperclip, Sparkles, X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { api, type Adjunto } from "../../lib/api";

const TIPOS = [
    { id: "opcion_multiple", label: "Opción múltiple" },
    { id: "verdadero_falso", label: "Verdadero / Falso" },
    { id: "abierta", label: "Respuesta abierta" },
    { id: "mixto", label: "Mixto" },
];

type Pregunta = {
    pregunta: string;
    tipo: "opcion_multiple" | "verdadero_falso" | "abierta";
    opciones?: string[];
    respuesta_correcta?: string;
    respuesta_sugerida?: string;
};

type Resultado = {
    id: string;
    titulo: string;
    tipo_preguntas: string;
    num_preguntas: number;
    preguntas: Pregunta[];
    docx_url: string;
};

export default function Cuestionarios() {
    const navigate = useNavigate();

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [tipoPreguntas, setTipoPreguntas] = useState("mixto");
    const [numPreguntas, setNumPreguntas] = useState(5);
    const [adjunto, setAdjunto] = useState<Adjunto | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [mostrarRespuestas, setMostrarRespuestas] = useState(false);
    const [instrucciones, setInstrucciones] = useState("");
    const [ajustando, setAjustando] = useState(false);
    const [descargando, setDescargando] = useState(false);

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
            const data: Resultado = await api.generarCuestionario({
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                tipo_preguntas: tipoPreguntas,
                num_preguntas: numPreguntas,
                texto_adjunto: adjunto?.texto_extraido ?? undefined,
            });
            setResultado(data);
            setMostrarRespuestas(false);
            setInstrucciones("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el cuestionario.");
        } finally {
            setGenerando(false);
        }
    }

    async function handleAjustar() {
        if (!resultado || !instrucciones.trim()) return;
        setError(null);
        setAjustando(true);
        try {
            const data: Resultado = await api.ajustarCuestionario(resultado.id, {
                titulo: resultado.titulo,
                tipo_preguntas: resultado.tipo_preguntas,
                num_preguntas: resultado.num_preguntas,
                preguntas_actuales: resultado.preguntas,
                instrucciones: instrucciones.trim(),
            });
            setResultado(data);
            setInstrucciones("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo aplicar el cambio.");
        } finally {
            setAjustando(false);
        }
    }

    async function handleDescargar() {
        if (!resultado) return;
        setDescargando(true);
        try {
            const blob = await api.descargarCuestionarioDocxBlob(resultado.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `cuestionario_${resultado.titulo.slice(0, 30)}.docx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo descargar el archivo.");
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

                    <h1 className="font-serif text-3xl font-semibold text-ink">Cuestionarios</h1>
                    <p className="mt-2 text-sm text-ink-soft">
                        Cuali arma un cuestionario con hoja de respuestas, listo para imprimir o descargar.
                    </p>

                    <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-7 shadow-sm backdrop-blur-sm">
                        <p className="mb-3 text-sm font-semibold text-ink">1. Título o tema</p>
                        <input
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="El sistema solar"
                            className="mb-7 w-full rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        />

                        <p className="mb-3 text-sm font-semibold text-ink">2. ¿Qué quieres evaluar?</p>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            rows={3}
                            placeholder="Que identifiquen los planetas y sus características principales..."
                            className="mb-7 w-full resize-none rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        />

                        <p className="mb-3 text-sm font-semibold text-ink">3. Tipo de preguntas</p>
                        <div className="mb-7 flex flex-wrap gap-2">
                            {TIPOS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTipoPreguntas(t.id)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                        tipoPreguntas === t.id
                                            ? "bg-cuali-blue text-linen"
                                            : "bg-cuali-blue-soft text-ink hover:bg-cuali-blue-light"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <p className="mb-3 text-sm font-semibold text-ink">4. Número de preguntas</p>
                        <div className="mb-7 flex items-center gap-4">
                            <input
                                type="range"
                                min={3}
                                max={10}
                                value={numPreguntas}
                                onChange={(e) => setNumPreguntas(parseInt(e.target.value, 10))}
                                className="flex-1 accent-cuali-blue"
                            />
                            <span className="w-8 text-center text-lg font-semibold text-ink">{numPreguntas}</span>
                        </div>

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
                                "Generar cuestionario"
                            )}
                        </button>
                    </div>

                    {resultado && (
                        <div className="mt-10">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 className="font-serif text-xl font-semibold text-ink">{resultado.titulo}</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMostrarRespuestas((v) => !v)}
                                        className="rounded-xl bg-cuali-blue-soft px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-cuali-blue-light"
                                    >
                                        {mostrarRespuestas ? "Ocultar respuestas" : "Ver respuestas"}
                                    </button>
                                    <button
                                        onClick={handleDescargar}
                                        disabled={descargando}
                                        className="flex items-center gap-2 rounded-xl bg-cuali-blue px-4 py-2.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-50"
                                    >
                                        <Download size={15} />
                                        {descargando ? "Descargando…" : "Descargar .docx"}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-7 shadow-sm">
                                {resultado.preguntas.map((p, i) => (
                                    <div key={i} className="border-b border-black/5 pb-4 last:border-none last:pb-0">
                                        <p className="mb-2 text-sm font-semibold text-ink">
                                            {i + 1}. {p.pregunta}
                                        </p>
                                        {p.tipo !== "abierta" ? (
                                            <ul className="ml-4 flex flex-col gap-1">
                                                {p.opciones?.map((op, j) => {
                                                    const esCorrecta = mostrarRespuestas && op === p.respuesta_correcta;
                                                    return (
                                                        <li
                                                            key={j}
                                                            className={`text-sm ${
                                                                esCorrecta ? "font-semibold text-cuali-blue-dark" : "text-ink-soft"
                                                            }`}
                                                        >
                                                            {String.fromCharCode(97 + j)}) {op} {esCorrecta && "✓"}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <div className="ml-4">
                                                <div className="mb-1 h-px w-full bg-black/10" />
                                                {mostrarRespuestas && (
                                                    <p className="mt-2 text-sm italic text-cuali-blue-dark">
                                                        Respuesta sugerida: {p.respuesta_sugerida}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 rounded-2xl border border-dashed border-cuali-blue-light bg-cuali-blue-soft/40 p-5">
                                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                                    <Sparkles size={15} />
                                    ¿Quieres algún cambio?
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        value={instrucciones}
                                        onChange={(e) => setInstrucciones(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAjustar()}
                                        placeholder="Por ejemplo: haz la pregunta 3 más fácil, o agrega una sobre los anillos de Saturno..."
                                        className="flex-1 rounded-xl border border-transparent bg-white px-4 py-2.5 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                                    />
                                    <button
                                        onClick={handleAjustar}
                                        disabled={ajustando || !instrucciones.trim()}
                                        className="flex-shrink-0 rounded-xl bg-cuali-blue px-5 py-2.5 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-50"
                                    >
                                        {ajustando ? "Aplicando…" : "Aplicar cambio"}
                                    </button>
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
        `}</style>
            </div>
        </div>
    );
}