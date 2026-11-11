import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { BookOpen, Download, MessageCircle, Pencil, RefreshCw, Save, X } from "lucide-react";
import PaginaCuaderno from "../components/PaginaCuaderno";
import Retroalimentacion from "../components/Retroalimentacion";
import { ApiError, api, type DocumentoPlaneacion, type SesionDoc } from "../lib/api";
import { campoPorNombre } from "../lib/campos";

type Meta = { id: string; campo_formativo: string; contenido: string; status: string };
type Estado = "cargando" | "generando" | "listo" | "sin-documento" | "error";

const ESPERA_ENTRE_CONSULTAS_MS = 5000;
const ESPERA_MAXIMA_MS = 6 * 60 * 1000;
const MARCA = /(\[(?:Completar|Confirmar)[^\]]*\])/g;

/** Resalta en amarillo lo que la docente debe completar. O(L). */
function ConMarcas({ texto }: { texto: string }) {
    const partes = texto.split(MARCA);
    return (
        <>
            {partes.map((p, i) =>
                i % 2 === 1 ? (
                    <mark key={i} className="rounded bg-marcatexto px-1 text-tinta">
                        {p}
                    </mark>
                ) : (
                    <span key={i}>{p}</span>
                )
            )}
        </>
    );
}

function Campo({
    etiqueta,
    valor,
    editando,
    onCambio,
    filas = 3,
    max = 3000,
}: {
    etiqueta: string;
    valor: string;
    editando: boolean;
    onCambio: (v: string) => void;
    filas?: number;
    max?: number;
}) {
    if (!editando) return <ConMarcas texto={valor} />;
    return (
        <textarea
            aria-label={etiqueta}
            value={valor}
            onChange={(e) => onCambio(e.target.value)}
            rows={filas}
            maxLength={max}
            className="w-full resize-y rounded-md border border-borde-fuerte bg-white px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-tinta"
        />
    );
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-1 border-t border-cuadricula py-3 md:grid-cols-[200px_1fr] md:gap-4">
            <dt className="text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">{etiqueta}</dt>
            <dd className="text-[15px] leading-relaxed">{children}</dd>
        </div>
    );
}

export default function PlaneacionDocumento() {
    const { planeacionId } = useParams<{ planeacionId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const pedirGenerar = Boolean((location.state as { generar?: boolean } | null)?.generar);

    const [meta, setMeta] = useState<Meta | null>(null);
    const [doc, setDoc] = useState<DocumentoPlaneacion | null>(null);
    const [borrador, setBorrador] = useState<DocumentoPlaneacion | null>(null);
    const [estado, setEstado] = useState<Estado>("cargando");
    const [error, setError] = useState<string | null>(null);
    const [segundos, setSegundos] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const arrancado = useRef(false);
    const vigente = useRef(true);

    useEffect(() => {
        vigente.current = true;
        return () => {
            vigente.current = false;
        };
    }, []);

    // Contador visible mientras Cuali escribe (la generacion tarda minutos).
    useEffect(() => {
        if (estado !== "generando") return;
        setSegundos(0);
        const t = window.setInterval(() => setSegundos((s) => s + 1), 1000);
        return () => window.clearInterval(t);
    }, [estado]);

    async function cargarDocumento() {
        if (!planeacionId) return;
        try {
            const d = await api.obtenerDocumento(planeacionId);
            if (!vigente.current) return;
            setDoc(d);
            setEstado("listo");
        } catch (err) {
            if (!vigente.current) return;
            if (err instanceof ApiError && err.status === 404) setEstado("sin-documento");
            else {
                setError(err instanceof Error ? err.message : "No se pudo cargar el documento.");
                setEstado("error");
            }
        }
    }

    /** Otra pestana ya esta generando: se consulta el estado hasta que acabe. */
    async function esperarGeneracionAjena() {
        if (!planeacionId) return;
        const inicio = Date.now();
        while (vigente.current && Date.now() - inicio < ESPERA_MAXIMA_MS) {
            await new Promise((r) => window.setTimeout(r, ESPERA_ENTRE_CONSULTAS_MS));
            const p: Meta = await api.obtenerPlaneacion(planeacionId);
            if (p.status !== "generando") {
                await cargarDocumento();
                return;
            }
        }
        if (vigente.current) {
            setError("La generación está tardando demasiado. Recarga la página en un momento.");
            setEstado("error");
        }
    }

    async function generar() {
        if (!planeacionId) return;
        setError(null);
        setEstado("generando");
        try {
            const r = await api.generarPlaneacion(planeacionId);
            if (!vigente.current) return;
            setDoc(r.documento);
            setBorrador(null);
            setEstado("listo");
        } catch (err) {
            if (!vigente.current) return;
            if (err instanceof ApiError && err.status === 409) {
                await esperarGeneracionAjena();
                return;
            }
            setError(err instanceof Error ? err.message : "No se pudo generar la planeación.");
            setEstado(doc ? "listo" : "error");
        }
    }

    useEffect(() => {
        if (!planeacionId || arrancado.current) return;
        // En desarrollo React monta dos veces; sin esta guarda se pedirian
        // dos generaciones (la segunda recibiria 409 del backend).
        arrancado.current = true;
        api.obtenerPlaneacion(planeacionId)
            .then((p: Meta) => {
                if (!vigente.current) return;
                setMeta(p);
                if (pedirGenerar) {
                    // Se limpia el estado de la navegacion: recargar no regenera.
                    navigate(location.pathname, { replace: true, state: null });
                    void generar();
                } else if (p.status === "generando") {
                    setEstado("generando");
                    void esperarGeneracionAjena();
                } else {
                    void cargarDocumento();
                }
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "No se pudo cargar la planeación.");
                setEstado("error");
            });
    }, [planeacionId]);

    async function descargar() {
        if (!planeacionId) return;
        setDescargando(true);
        try {
            const blob = await api.descargarDocxBlob(planeacionId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `planeacion_${(doc?.titulo_proyecto || "cuali").slice(0, 40)}.docx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo descargar el documento.");
        } finally {
            setDescargando(false);
        }
    }

    async function guardar() {
        if (!planeacionId || !borrador) return;
        setGuardando(true);
        setError(null);
        try {
            const d = await api.editarDocumento(planeacionId, borrador);
            setDoc(d);
            setBorrador(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
        } finally {
            setGuardando(false);
        }
    }

    function cambiar<K extends keyof DocumentoPlaneacion>(clave: K, valor: DocumentoPlaneacion[K]) {
        setBorrador((b) => (b ? { ...b, [clave]: valor } : b));
    }

    function cambiarSesion(i: number, cambio: (s: SesionDoc) => SesionDoc) {
        setBorrador((b) => (b ? { ...b, sesiones: b.sesiones.map((s, j) => (j === i ? cambio(s) : s)) } : b));
    }

    const campo = campoPorNombre(doc?.campo ?? meta?.campo_formativo);
    const editando = borrador !== null;
    const d = borrador ?? doc;

    if (estado === "cargando") {
        return (
            <PaginaCuaderno>
                <p className="text-tinta-tenue">Cargando...</p>
            </PaginaCuaderno>
        );
    }

    if (estado === "generando") {
        return (
            <PaginaCuaderno>
                <div className="mx-auto mt-16 flex max-w-xl flex-col gap-4 rounded-lg border-[1.5px] border-tinta bg-white px-7 py-8 sombra-recorte" role="status" aria-live="polite">
                    <span className={`self-start rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white ${campo?.clases.fondo ?? "bg-tinta"}`}>
                        {meta?.campo_formativo}
                    </span>
                    <h1 className="titulo-condensado text-4xl">
                        Cuali está escribiendo tu <span className="marcatexto">planeación</span>
                    </h1>
                    <p className="text-[15px] leading-relaxed text-tinta-tenue">
                        Consulta los libros de la SEP, redacta el encabezado y las sesiones con las fases de la metodología, y revisa que el PDA sea el oficial. Suele tardar entre uno y tres minutos.
                    </p>
                    <p className="font-bold tabular-nums">
                        {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, "0")}
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-relleno">
                        <div className="h-full w-1/3 animate-pulse rounded-full bg-tinta" />
                    </div>
                </div>
            </PaginaCuaderno>
        );
    }

    if (estado === "sin-documento" || estado === "error" || !d) {
        return (
            <PaginaCuaderno>
                <div className="mx-auto mt-16 flex max-w-xl flex-col gap-4 rounded-lg border border-borde bg-white px-7 py-8">
                    <h1 className="font-display text-2xl font-bold">
                        {estado === "sin-documento" ? "Esta planeación aún no tiene documento" : "Algo salió mal"}
                    </h1>
                    {error && <p role="alert" className="text-error">{error}</p>}
                    {meta && <p className="text-tinta-tenue">{meta.contenido}</p>}
                    <div className="flex flex-wrap gap-2">
                        {meta && (
                            <button type="button" onClick={generar} className="flex h-11 items-center gap-2 rounded-md bg-tinta px-4 font-bold text-white hover:bg-tinta-fuerte">
                                <RefreshCw size={17} aria-hidden="true" />
                                Generar planeación
                            </button>
                        )}
                        <Link to="/planeaciones" className="flex h-11 items-center rounded-md border border-borde-fuerte bg-white px-4 font-bold">
                            Mis planeaciones
                        </Link>
                    </div>
                </div>
            </PaginaCuaderno>
        );
    }

    return (
        <PaginaCuaderno ancho="amplio">
            {/* Barra de acciones */}
            <div className="sticky top-0 z-10 -mx-2 mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-borde bg-white/95 px-3 py-2.5 backdrop-blur">
                <span className={`rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white ${campo?.clases.fondo ?? "bg-tinta"}`}>
                    {campo?.etiqueta ?? d.campo}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{d.titulo_proyecto}</span>
                {editando ? (
                    <>
                        <button type="button" onClick={() => setBorrador(null)} className="flex h-10 items-center gap-1.5 rounded-md border border-borde-fuerte px-3 text-sm font-bold">
                            <X size={16} aria-hidden="true" /> Cancelar
                        </button>
                        <button type="button" onClick={guardar} disabled={guardando} className="flex h-10 items-center gap-1.5 rounded-md bg-tinta px-3 text-sm font-bold text-white disabled:opacity-40">
                            <Save size={16} aria-hidden="true" /> {guardando ? "Guardando..." : "Guardar"}
                        </button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={() => doc && setBorrador(structuredClone(doc))} className="flex h-10 items-center gap-1.5 rounded-md border border-borde-fuerte px-3 text-sm font-bold hover:border-tinta">
                            <Pencil size={16} aria-hidden="true" /> Editar
                        </button>
                        <button type="button" onClick={() => navigate(`/planeacion/${planeacionId}/chat`)} className="flex h-10 items-center gap-1.5 rounded-md border border-borde-fuerte px-3 text-sm font-bold hover:border-tinta">
                            <MessageCircle size={16} aria-hidden="true" /> Ajustar con Cuali
                        </button>
                        <button type="button" onClick={generar} className="flex h-10 items-center gap-1.5 rounded-md border border-borde-fuerte px-3 text-sm font-bold hover:border-tinta">
                            <RefreshCw size={16} aria-hidden="true" /> Regenerar
                        </button>
                        <button type="button" onClick={descargar} disabled={descargando} className="flex h-10 items-center gap-1.5 rounded-md bg-tinta px-3 text-sm font-bold text-white hover:bg-tinta-fuerte disabled:opacity-40">
                            <Download size={16} aria-hidden="true" /> {descargando ? "Descargando..." : "Descargar Word"}
                        </button>
                    </>
                )}
            </div>

            {error && (
                <p role="alert" className="mb-4 rounded-md bg-error-tinte px-4 py-3 text-sm text-error">
                    {error}
                </p>
            )}

            {d.pendientes.length > 0 && (
                <div className="mb-6 rounded-md border border-marcatexto bg-marcatexto-suave px-4 py-3 text-sm text-marcatexto-texto" role="note">
                    <strong>Revisa antes de imprimir:</strong> {d.pendientes.join(" · ")}. Lo marcado en amarillo lo tienes que completar tú.
                </div>
            )}

            {/* Encabezado */}
            <article className="rounded-lg border-[1.5px] border-tinta bg-white px-6 py-5 sombra-recorte">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-tinta-tenue">
                    {[d.escuela, `${d.grado}° ${d.grupo}`.trim(), d.periodo].filter(Boolean).join(" · ")}
                </p>
                <h1 className="titulo-condensado mt-1 text-4xl md:text-5xl">
                    {editando ? (
                        <input
                            aria-label="Título del proyecto"
                            value={d.titulo_proyecto}
                            onChange={(e) => cambiar("titulo_proyecto", e.target.value)}
                            maxLength={300}
                            className="w-full rounded-md border border-borde-fuerte px-3 py-1 font-sans text-2xl font-bold"
                        />
                    ) : (
                        <ConMarcas texto={d.titulo_proyecto} />
                    )}
                </h1>

                <dl className="mt-4">
                    <Fila etiqueta="Campo formativo">
                        <span className={`font-bold ${campo?.clases.texto ?? ""}`}>{d.campo}</span>
                        {d.fase ? <span className="text-tinta-tenue"> · Fase {d.fase}</span> : null}
                    </Fila>
                    <Fila etiqueta="Metodología">
                        {d.metodologia_nombre} <span className="text-tinta-tenue">· {d.tiempo} · Escenario: {d.escenario}</span>
                    </Fila>
                    {d.ejes.length > 0 && <Fila etiqueta="Ejes articuladores">{d.ejes.join(" · ")}</Fila>}
                    <Fila etiqueta="Contenido">{d.contenido}</Fila>
                    <Fila etiqueta="PDA">
                        <ul className="flex flex-col gap-1.5">
                            {d.pdas.map((p, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className={`mt-2 h-2 w-2 flex-shrink-0 rounded-sm ${campo?.clases.punto ?? "bg-tinta"}`} aria-hidden="true" />
                                    {p}
                                </li>
                            ))}
                        </ul>
                        <span className="mt-1 block text-xs text-tinta-tenue">Texto oficial del Programa Sintético de la SEP.</span>
                    </Fila>
                    <Fila etiqueta="Intención didáctica">
                        <Campo etiqueta="Intención didáctica" valor={d.intencion_didactica} editando={editando} onCambio={(v) => cambiar("intencion_didactica", v)} filas={4} />
                    </Fila>
                    <Fila etiqueta="Propósito">
                        <Campo etiqueta="Propósito" valor={d.proposito} editando={editando} onCambio={(v) => cambiar("proposito", v)} filas={4} />
                    </Fila>
                </dl>
            </article>

            {/* Integracion curricular */}
            {d.integracion.length > 0 && (
                <section className="mt-10">
                    <h2 className="font-display text-2xl font-bold">Integración curricular</h2>
                    <p className="mt-1 text-sm text-tinta-tenue">Contenidos de otros campos que se trabajan dentro de este proyecto.</p>
                    <ul className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {d.integracion.map((v, i) => {
                            const c = campoPorNombre(v.campo);
                            return (
                                <li key={v.contenido} className={`flex flex-col gap-2 rounded-lg border-l-[6px] border border-borde bg-white px-5 py-4 ${c?.clases.borde ?? ""}`}>
                                    <span className={`text-xs font-bold uppercase tracking-[0.06em] ${c?.clases.texto ?? ""}`}>
                                        {v.campo} · {v.sesion}
                                    </span>
                                    <p className="font-bold leading-snug">{v.contenido}</p>
                                    <details className="text-sm text-tinta-tenue">
                                        <summary className="cursor-pointer">PDA oficial</summary>
                                        <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
                                            {v.pdas.map((p) => (
                                                <li key={p}>{p}</li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="text-[15px] leading-relaxed">
                                        <Campo
                                            etiqueta={`Vínculo con ${v.campo}`}
                                            valor={v.actividad}
                                            editando={editando}
                                            max={1500}
                                            onCambio={(t) =>
                                                setBorrador((b) =>
                                                    b ? { ...b, integracion: b.integracion.map((x, j) => (j === i ? { ...x, actividad: t } : x)) } : b
                                                )
                                            }
                                        />
                                    </div>
                                    {v.evidencia && <p className="text-sm text-tinta-tenue">Evidencia: {v.evidencia}</p>}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* Sesiones */}
            <h2 className="mt-10 font-display text-2xl font-bold">Sesiones</h2>
            <ol className="mt-4 flex flex-col gap-4">
                {d.sesiones.map((s, i) => (
                    <li key={i} className="grid grid-cols-1 overflow-hidden rounded-lg border border-borde bg-white md:grid-cols-[210px_1fr]">
                        <div className={`flex flex-col gap-2 px-4 py-4 ${campo?.clases.tinte ?? "bg-relleno"}`}>
                            <span className="font-display text-xl font-bold">{s.etiqueta}</span>
                            {s.fases.map((f) => (
                                <span key={f} className="text-[13px] font-bold leading-snug">
                                    {f}
                                </span>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3 px-5 py-4">
                            {(["inicio", "desarrollo", "cierre"] as const).map((m) => (
                                <div key={m}>
                                    <span className="text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">
                                        {m} · {s[m].minutos} min
                                    </span>
                                    <div className="text-[15px] leading-relaxed">
                                        <Campo
                                            etiqueta={`${s.etiqueta} ${m}`}
                                            valor={s[m].texto}
                                            editando={editando}
                                            onCambio={(v) => cambiarSesion(i, (x) => ({ ...x, [m]: { ...x[m], texto: v } }))}
                                        />
                                    </div>
                                </div>
                            ))}
                            {d.integracion
                                .filter((v) => v.sesion === s.etiqueta && !v.en_sesion)
                                .map((v) => {
                                    const c = campoPorNombre(v.campo);
                                    return (
                                        <p key={v.contenido} className={`rounded-md px-3 py-2 text-[15px] leading-relaxed ${c?.clases.tinte ?? "bg-relleno"}`}>
                                            <strong className={c?.clases.texto}>Vínculo con {c?.etiqueta ?? v.campo}.</strong> <ConMarcas texto={v.actividad} />
                                        </p>
                                    );
                                })}
                            <div className="grid grid-cols-1 gap-3 border-t border-dashed border-borde pt-3 text-sm md:grid-cols-2">
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">Recursos</span>
                                    {editando ? (
                                        <Campo
                                            etiqueta={`${s.etiqueta} recursos`}
                                            valor={s.recursos.join("\n")}
                                            editando
                                            filas={3}
                                            max={1200}
                                            onCambio={(v) =>
                                                cambiarSesion(i, (x) => ({ ...x, recursos: v.split("\n").map((r) => r.trim()).filter(Boolean).slice(0, 12) }))
                                            }
                                        />
                                    ) : (
                                        <p>{s.recursos.join(" · ")}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">Tarea</span>
                                    <Campo
                                        etiqueta={`${s.etiqueta} tarea`}
                                        valor={s.tarea}
                                        editando={editando}
                                        filas={2}
                                        max={600}
                                        onCambio={(v) => cambiarSesion(i, (x) => ({ ...x, tarea: v }))}
                                    />
                                </div>
                            </div>
                            {s.citas.length > 0 && (
                                <p className="flex flex-wrap items-center gap-1.5 text-xs text-tinta-tenue">
                                    <BookOpen size={13} aria-hidden="true" />
                                    {s.citas
                                        .map((c) => d.fuentes.find((f) => f.id === c))
                                        .filter(Boolean)
                                        .map((f) => `${f!.libro}, pág. ${f!.paginas}`)
                                        .join(" · ")}
                                </p>
                            )}
                        </div>
                    </li>
                ))}
            </ol>

            {/* Evaluacion */}
            <h2 className="mt-10 font-display text-2xl font-bold">Evaluación</h2>
            <dl className="mt-2 rounded-lg border border-borde bg-white px-5 pb-1">
                <Fila etiqueta="Criterios">{d.evaluacion.criterios.join("; ")}</Fila>
                <Fila etiqueta="Evidencias">{d.evaluacion.evidencias.join("; ")}</Fila>
                <Fila etiqueta="Instrumentos">{d.evaluacion.instrumentos.join("; ")}</Fila>
                {d.ajustes_razonables && <Fila etiqueta="Ajustes razonables">{d.ajustes_razonables}</Fila>}
            </dl>

            {d.rubrica.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse rounded-lg bg-white text-sm">
                        <caption className="pb-2 text-left font-bold">Rúbrica (una fila por proceso del PDA)</caption>
                        <thead>
                            <tr className="bg-relleno text-left">
                                {["Indicador", "Sobresaliente", "Satisfactorio", "En proceso"].map((h) => (
                                    <th key={h} className="border border-borde px-3 py-2">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {d.rubrica.map((f, i) => (
                                <tr key={i} className="align-top">
                                    <td className="border border-borde px-3 py-2 font-bold">{f.indicador}</td>
                                    <td className="border border-borde px-3 py-2">{f.sobresaliente}</td>
                                    <td className="border border-borde px-3 py-2">{f.satisfactorio}</td>
                                    <td className="border border-borde px-3 py-2">{f.en_proceso}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {d.fuentes.length > 0 && (
                <section className="mt-6 rounded-lg border border-dashed border-borde-fuerte bg-white px-5 py-4 text-sm">
                    <h2 className="font-bold">Fuentes consultadas</h2>
                    <ul className="mt-2 flex flex-col gap-1 text-tinta-tenue">
                        {d.fuentes.map((f) => (
                            <li key={f.id}>
                                {f.libro}
                                {f.paginas && `, pág. ${f.paginas}`}
                                {f.seccion && ` · ${f.seccion}`}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {planeacionId && !editando && (
                <div className="mt-8">
                    <Retroalimentacion objetivoTipo="planeacion" objetivoId={planeacionId} />
                </div>
            )}
        </PaginaCuaderno>
    );
}
