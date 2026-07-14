import { useState, useMemo } from "react"; // ya lo tienes, solo confirma que sigue igual
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ContentAutocomplete from "../components/ContentAutocomplete";
import catalogoFase5 from "../data/nem/fase5-6.json";

const CAMPOS = [
    "Lenguajes",
    "Saberes y Pensamiento Científico",
    "Ética, Naturaleza y Sociedades",
    "De lo Humano y lo Comunitario",
];

type Contenido = { contenido: string; pda_6: string };

const fieldClass =
    "rounded-xl border border-cuali-blue-light/50 bg-cuali-blue-soft/60 px-4 py-3 text-sm text-ink outline-none backdrop-blur-sm transition placeholder:text-ink-soft focus:border-cuali-blue focus:bg-cuali-blue-soft";

export default function NuevaPlaneacion() {
    const navigate = useNavigate();

    const [grado] = useState(6);
    const [campo, setCampo] = useState("");
    const [contenido, setContenido] = useState<Contenido | null>(null);
    const [grupo, setGrupo] = useState("");
    const [sesiones, setSesiones] = useState("");
    const [tema, setTema] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [creando, setCreando] = useState(false);

    const contenidosDelCampo = useMemo<Contenido[]>(() => {
        const campoData = catalogoFase5.campos_formativos.find(
            (c) => c.campo_formativo === campo
        );
        return campoData ? campoData.contenidos : [];
    }, [campo]);

    function handleCampoChange(nuevoCampo: string) {
        setCampo(nuevoCampo);
        setContenido(null);
    }

    async function handleContinuar() {
        if (!contenido) return;
        setError(null);
        setCreando(true);

        try {
            const planeacion = await api.crearPlaneacion({
                grado,
                campo_formativo: campo,
                contenido: contenido.contenido,
                pda: contenido.pda_6,
                grupo,
                sesiones: parseInt(sesiones, 10),
                tema,
            });

            navigate(`/planeacion/${planeacion.id}/chat`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear la planeación.");
        } finally {
            setCreando(false);
        }
    }

    const puedeContinuar = campo && contenido && grupo && sesiones && tema;

    return (
        <div className="flex min-h-screen bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex-1 overflow-hidden">
                {/* Blob de vidrio muy sutil, casi imperceptible, solo como acento */}
                {/* Blobs de vidrio azules, sutiles, sobre el fondo blanco */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                    <div className="content-blob content-blob-4" />
                    <div className="content-blob content-blob-5" />
                </div>

                <div className="relative mx-auto max-w-3xl px-12 py-14">
                    <p className="mb-1 text-xl text-cuali-blue">❦</p>
                    <h1 className="mb-2 font-serif text-4xl font-semibold text-ink">Nueva planeación</h1>
                    <p className="mb-10 text-sm text-ink-soft">
                        Dame los datos base y platicamos el resto en el chat.
                    </p>

                    <div className="rounded-3xl border border-white/60 bg-white/70 p-10 shadow-[0_8px_32px_rgba(78,122,181,0.08)] backdrop-blur-xl">
                        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                            <label className="flex flex-col gap-2">
                                <span className="font-serif text-sm font-semibold text-ink">Grado</span>
                                <select value={grado} disabled className={fieldClass}>
                                    <option value={6}>6° de primaria</option>
                                </select>
                                <span className="text-xs text-ink-soft">
                  Por ahora solo tenemos el catálogo de 6°.
                </span>
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="font-serif text-sm font-semibold text-ink">Grupo</span>
                                <input
                                    type="text"
                                    value={grupo}
                                    onChange={(e) => setGrupo(e.target.value)}
                                    placeholder="Ej. A, B, Único…"
                                    className={fieldClass}
                                />
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="font-serif text-sm font-semibold text-ink">Campo formativo</span>
                                <select
                                    value={campo}
                                    onChange={(e) => handleCampoChange(e.target.value)}
                                    className={fieldClass}
                                >
                                    <option value="">Selecciona un campo formativo</option>
                                    {CAMPOS.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="font-serif text-sm font-semibold text-ink">Número de sesiones</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={sesiones}
                                    onChange={(e) => setSesiones(e.target.value)}
                                    placeholder="Ej. 3"
                                    className={fieldClass}
                                />
                            </label>

                            <label className="flex flex-col gap-2 sm:col-span-2">
                                <span className="font-serif text-sm font-semibold text-ink">Contenido</span>
                                {campo ? (
                                    <ContentAutocomplete
                                        contenidos={contenidosDelCampo}
                                        value={contenido}
                                        onSelect={setContenido}
                                        placeholder="Escribe una palabra clave del contenido…"
                                    />
                                ) : (
                                    <div className={`${fieldClass} text-ink-soft`}>
                                        Primero selecciona un campo formativo
                                    </div>
                                )}
                            </label>

                            <label className="flex flex-col gap-2 sm:col-span-2">
                                <span className="font-serif text-sm font-semibold text-ink">Tema u objetivo</span>
                                <textarea
                                    value={tema}
                                    onChange={(e) => setTema(e.target.value)}
                                    placeholder="Ej. El ciclo del agua y su relación con el cambio climático"
                                    rows={3}
                                    className={fieldClass}
                                />
                            </label>
                        </div>

                        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                        <button
                            type="button"
                            disabled={!puedeContinuar || creando}
                            onClick={handleContinuar}
                            className="mt-2 w-full rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-cuali-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {creando ? "Creando…" : "Continuar al chat →"}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .content-blob {
    position: absolute;
    border-radius: 9999px;
    filter: blur(75px);
}
.content-blob-1 { width: 340px; height: 340px; top: -120px; right: -60px; background: var(--blue-light); opacity: 0.45; }
.content-blob-2 { width: 260px; height: 260px; top: 28%; right: 12%; background: var(--lavender); opacity: 0.3; }
.content-blob-3 { width: 300px; height: 300px; bottom: -100px; left: 5%; background: var(--blue-light); opacity: 0.4; }
.content-blob-4 { width: 220px; height: 220px; top: 55%; left: -60px; background: var(--sage); opacity: 0.25; }
.content-blob-5 { width: 260px; height: 260px; bottom: 10%; right: -80px; background: var(--blue-light); opacity: 0.35; }
            `}</style>
        </div>
    );
}