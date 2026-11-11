import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, ExternalLink, FileText, Image as ImageIcon, MessageCircle, Search, Trash2, Upload } from "lucide-react";
import PaginaCuaderno from "../components/PaginaCuaderno";
import {
    API_BASE,
    api,
    getUser,
    type DocumentoDocente,
    type LibroSep,
    type ResultadoLibro,
    type Visibilidad,
} from "../lib/api";
import { CAMPOS, campoPorNombre } from "../lib/campos";

type Pestana = "libros" | "docs";
const GRADOS = [1, 2, 3, 4, 5, 6];
const SUGERENCIAS = ["componentes del aire", "cartas personales", "área de figuras", "cultura de paz"];

function gradoInicial(): number {
    const g = Number.parseInt(getUser()?.grado_imparte ?? "", 10);
    return GRADOS.includes(g) ? g : 6;
}

function Pestanas({ actual, onCambio }: { actual: Pestana; onCambio: (p: Pestana) => void }) {
    const opciones: { id: Pestana; label: string }[] = [
        { id: "libros", label: "Libros SEP" },
        { id: "docs", label: "Documentos de docentes" },
    ];
    return (
        <div role="tablist" aria-label="Secciones de la biblioteca" className="flex gap-1 border-b border-borde">
            {opciones.map((o) => (
                <button
                    key={o.id}
                    role="tab"
                    type="button"
                    aria-selected={actual === o.id}
                    onClick={() => onCambio(o.id)}
                    className={`-mb-px rounded-t-md border px-4 py-2.5 text-sm font-bold ${
                        actual === o.id ? "border-borde border-b-papel bg-papel text-tinta" : "border-transparent text-tinta-tenue hover:text-tinta"
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

// --------------------------------------------------------------------------
// Libros SEP
// --------------------------------------------------------------------------

function LibrosSep() {
    const navigate = useNavigate();
    const [grado, setGrado] = useState(gradoInicial);
    const [libros, setLibros] = useState<LibroSep[] | null>(null);
    const [consulta, setConsulta] = useState("");
    const [buscada, setBuscada] = useState("");
    const [resultados, setResultados] = useState<ResultadoLibro[] | null>(null);
    const [buscando, setBuscando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [abierto, setAbierto] = useState<number | null>(null);

    useEffect(() => {
        let vigente = true;
        setLibros(null);
        api.listarLibros(grado)
            .then((l) => vigente && setLibros(l))
            .catch(() => vigente && setLibros([]));
        return () => {
            vigente = false;
        };
    }, [grado]);

    async function buscar(texto: string) {
        const q = texto.trim();
        if (q.length < 3) {
            setError("Escribe al menos 3 letras.");
            return;
        }
        setError(null);
        setBuscando(true);
        setAbierto(null);
        try {
            setResultados(await api.buscarEnLibros(q, grado));
            setBuscada(q);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo buscar en los libros.");
        } finally {
            setBuscando(false);
        }
    }

    function usarEnChat(r: ResultadoLibro) {
        navigate("/chat", {
            state: {
                mensajeInicial:
                    `Quiero preparar una clase con lo que viene en ${r.libro}, pág. ${r.paginas}` +
                    (r.seccion ? ` (${r.seccion})` : "") +
                    `. ¿Qué actividades me sugieres para mi grupo de ${r.grado ?? grado}°?`,
            },
        });
    }

    return (
        <div className="flex flex-col gap-6 pt-6">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void buscar(consulta);
                }}
                className="flex flex-col gap-3 rounded-lg border-[1.5px] border-tinta bg-white px-5 py-4 sombra-recorte"
            >
                <label htmlFor="buscar-libros" className="font-bold">
                    Buscar en los libros
                </label>
                <div className="flex flex-wrap gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-borde-fuerte px-3">
                        <Search size={18} aria-hidden="true" className="text-tinta-tenue" />
                        <input
                            id="buscar-libros"
                            type="search"
                            value={consulta}
                            onChange={(e) => setConsulta(e.target.value)}
                            maxLength={300}
                            placeholder="Ej. separación de residuos, fracciones equivalentes, cartas personales"
                            className="h-11 min-w-0 flex-1 bg-transparent outline-none"
                        />
                    </div>
                    <button type="submit" disabled={buscando} className="h-11 rounded-md bg-tinta px-5 font-bold text-white hover:bg-tinta-fuerte disabled:opacity-40">
                        {buscando ? "Buscando..." : "Buscar"}
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-tinta-tenue">Grado</span>
                    {GRADOS.map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setGrado(g)}
                            aria-pressed={grado === g}
                            className={`h-9 w-11 rounded-md font-bold ${grado === g ? "bg-tinta text-white" : "border border-borde-fuerte bg-white"}`}
                        >
                            {g}°
                        </button>
                    ))}
                    <span className="mx-1 h-5 w-px bg-borde" aria-hidden="true" />
                    {SUGERENCIAS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => {
                                setConsulta(s);
                                void buscar(s);
                            }}
                            className="rounded-full border border-borde px-3 py-1 text-tinta-tenue hover:border-tinta hover:text-tinta"
                        >
                            {s}
                        </button>
                    ))}
                </div>
                {error && (
                    <p role="alert" className="text-sm text-error">
                        {error}
                    </p>
                )}
            </form>

            {resultados !== null && (
                <section aria-live="polite">
                    <h2 className="font-display text-xl font-bold">
                        Dónde aparece "{buscada}" <span className="text-base font-normal text-tinta-tenue">· {grado}°</span>
                    </h2>
                    {resultados.length === 0 && <p className="mt-3 text-tinta-tenue">No encontré ese tema en los libros de {grado}°. Prueba con otras palabras.</p>}
                    <ol className="mt-3 flex flex-col gap-3">
                        {resultados.map((r, i) => (
                            <li key={i} className="rounded-lg border border-borde bg-white px-5 py-4">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <span className="font-bold">{r.libro}</span>
                                    <span className="rounded bg-marcatexto px-2 py-0.5 text-sm font-bold">pág. {r.paginas}</span>
                                    {r.seccion && <span className="text-sm text-tinta-tenue">{r.seccion}</span>}
                                </div>
                                <p className={`mt-2 text-[15px] leading-relaxed text-tinta-suave ${abierto === i ? "" : "line-clamp-3"}`}>{r.fragmento}</p>
                                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                    <button type="button" onClick={() => setAbierto(abierto === i ? null : i)} className="rounded-md border border-borde-fuerte px-3 py-1.5 font-bold hover:border-tinta">
                                        {abierto === i ? "Ver menos" : "Leer fragmento"}
                                    </button>
                                    <button type="button" onClick={() => usarEnChat(r)} className="flex items-center gap-1.5 rounded-md border border-borde-fuerte px-3 py-1.5 font-bold hover:border-tinta">
                                        <MessageCircle size={15} aria-hidden="true" />
                                        Preguntarle a Cuali
                                    </button>
                                    <button type="button" onClick={() => navigate("/planeacion/nueva")} className="rounded-md bg-tinta px-3 py-1.5 font-bold text-white hover:bg-tinta-fuerte">
                                        Usar en una planeación
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            <section>
                <h2 className="font-display text-xl font-bold">Libros de {grado}°</h2>
                {libros === null && <p className="mt-3 text-tinta-tenue">Cargando...</p>}
                {libros?.length === 0 && <p className="mt-3 text-tinta-tenue">Aún no hay libros de {grado}° en el índice de Cuali.</p>}
                <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {libros?.map((l) => (
                        <li key={l.libro}>
                            <button
                                type="button"
                                onClick={() => {
                                    setConsulta(l.materia);
                                    void buscar(l.materia);
                                }}
                                className="flex aspect-[3/4] w-full flex-col justify-between rounded-md border-[1.5px] border-tinta bg-white p-3 text-left sombra-recorte transition hover:-translate-y-0.5"
                            >
                                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-tinta-tenue">SEP · {l.grado}°</span>
                                <span className="font-display text-base font-bold leading-tight">{l.materia}</span>
                                <BookOpen size={18} aria-hidden="true" className="text-tinta-tenue" />
                            </button>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 flex items-center gap-1.5 text-sm text-tinta-tenue">
                    Los libros completos se consultan en la
                    <a href="https://libros.conaliteg.gob.mx/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-tinta underline">
                        Comisión Nacional de Libros de Texto Gratuitos
                        <ExternalLink size={13} aria-hidden="true" />
                    </a>
                </p>
            </section>
        </div>
    );
}

// --------------------------------------------------------------------------
// Documentos de docentes
// --------------------------------------------------------------------------

function TarjetaDocumento({
    doc,
    acciones,
}: {
    doc: DocumentoDocente;
    acciones?: React.ReactNode;
}) {
    const campo = campoPorNombre(doc.campo);
    const Icono = doc.tipo === "imagen" ? ImageIcon : FileText;
    return (
        <li className="flex items-start gap-3 rounded-lg border border-borde bg-white px-4 py-3">
            <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-white ${campo?.clases.fondo ?? "bg-tinta-tenue"}`}>
                <Icono size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{doc.titulo}</p>
                <p className="text-[13px] text-tinta-tenue">
                    {[doc.es_mio ? null : doc.autor, doc.grado ? `${doc.grado}°` : null, campo?.etiqueta, doc.filename.split(".").pop()?.toUpperCase()]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <a
                        href={`${API_BASE}${doc.url_firmada}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-borde-fuerte px-3 py-1 font-bold hover:border-tinta"
                    >
                        Ver
                    </a>
                    {acciones}
                </div>
            </div>
        </li>
    );
}

function DocumentosDocentes() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [titulo, setTitulo] = useState("");
    const [campo, setCampo] = useState<string>("");
    const [grado, setGrado] = useState<number>(gradoInicial);
    const [visibilidad, setVisibilidad] = useState<Visibilidad>("privado");
    const [acepto, setAcepto] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [mios, setMios] = useState<DocumentoDocente[] | null>(null);
    const [otros, setOtros] = useState<DocumentoDocente[] | null>(null);
    const [filtroCampo, setFiltroCampo] = useState("");
    const [filtroTexto, setFiltroTexto] = useState("");

    useEffect(() => {
        api.misDocumentos().then(setMios).catch(() => setMios([]));
    }, []);

    useEffect(() => {
        let vigente = true;
        const t = window.setTimeout(() => {
            api.documentosComunidad({ campo: filtroCampo || undefined, q: filtroTexto.trim() || undefined })
                .then((d) => vigente && setOtros(d))
                .catch(() => vigente && setOtros([]));
        }, 300);
        return () => {
            vigente = false;
            window.clearTimeout(t);
        };
    }, [filtroCampo, filtroTexto]);

    const puedeSubir = useMemo(
        () => Boolean(archivo) && titulo.trim().length >= 3 && (visibilidad === "privado" || acepto) && !subiendo,
        [archivo, titulo, visibilidad, acepto, subiendo]
    );

    async function subir() {
        if (!archivo) return;
        setError(null);
        setSubiendo(true);
        try {
            const subido = await api.subirArchivo(archivo);
            const doc = await api.crearDocumentoDocente({
                url: subido.url,
                titulo: titulo.trim(),
                campo: campo || null,
                grado,
                visibilidad,
                acepto_condiciones: acepto,
            });
            setMios((m) => [doc, ...(m ?? [])]);
            setArchivo(null);
            setTitulo("");
            setAcepto(false);
            if (inputRef.current) inputRef.current.value = "";
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo subir el documento.");
        } finally {
            setSubiendo(false);
        }
    }

    async function alternarVisibilidad(doc: DocumentoDocente) {
        const nueva: Visibilidad = doc.visibilidad === "privado" ? "comunidad" : "privado";
        if (nueva === "comunidad" && !window.confirm("¿Confirmas que el material es tuyo o tienes permiso de compartirlo, y que no incluye nombres ni fotos de tus alumnos?")) {
            return;
        }
        try {
            const actualizado = await api.cambiarVisibilidadDocumento(doc.id, nueva, nueva === "comunidad");
            setMios((m) => (m ?? []).map((d) => (d.id === doc.id ? actualizado : d)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cambiar quién lo ve.");
        }
    }

    async function borrar(doc: DocumentoDocente) {
        if (!window.confirm(`¿Quitar "${doc.titulo}" de tu biblioteca?`)) return;
        try {
            await api.borrarDocumentoDocente(doc.id);
            setMios((m) => (m ?? []).filter((d) => d.id !== doc.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo quitar el documento.");
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-[380px_1fr]">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void subir();
                }}
                className="flex flex-col gap-4 self-start rounded-lg border-[1.5px] border-tinta bg-white px-5 py-5 sombra-recorte"
            >
                <h2 className="font-display text-xl font-bold">Subir un documento</h2>
                <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-md border-[1.5px] border-dashed border-borde-fuerte px-4 py-6 text-center text-sm hover:border-tinta">
                    <Upload size={22} aria-hidden="true" />
                    <span className="font-bold">{archivo ? archivo.name : "Elige un archivo"}</span>
                    <span className="text-tinta-tenue">PDF, Word o imagen, hasta 15 MB</span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="sr-only"
                        onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setArchivo(f);
                            if (f && !titulo) setTitulo(f.name.replace(/\.[^.]+$/, "").slice(0, 120));
                        }}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm font-bold">
                    Título
                    <input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        maxLength={120}
                        placeholder="Ej. Examen de fracciones, bloque 2"
                        className="h-10 rounded-md border border-borde-fuerte px-3 font-normal outline-none focus:border-tinta"
                    />
                </label>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                    <label className="flex flex-col gap-1 text-sm font-bold">
                        Campo formativo
                        <select value={campo} onChange={(e) => setCampo(e.target.value)} className="h-10 rounded-md border border-borde-fuerte bg-white px-2 font-normal">
                            <option value="">Sin campo</option>
                            {CAMPOS.map((c) => (
                                <option key={c.id} value={c.nombre}>
                                    {c.etiqueta}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-bold">
                        Grado
                        <select value={grado} onChange={(e) => setGrado(Number(e.target.value))} className="h-10 rounded-md border border-borde-fuerte bg-white px-2 font-normal">
                            {GRADOS.map((g) => (
                                <option key={g} value={g}>
                                    {g}°
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <fieldset className="flex flex-col gap-2 text-sm">
                    <legend className="pb-1 font-bold">¿Quién lo puede ver?</legend>
                    {(
                        [
                            ["privado", "Solo yo", "Para usarlo en mis planeaciones"],
                            ["comunidad", "Toda la comunidad", "Otros profes lo pueden ver y descargar"],
                        ] as const
                    ).map(([id, label, nota]) => (
                        <label key={id} className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 ${visibilidad === id ? "border-tinta bg-relleno" : "border-borde"}`}>
                            <input type="radio" name="visibilidad" checked={visibilidad === id} onChange={() => setVisibilidad(id)} className="mt-1 accent-[var(--tinta)]" />
                            <span>
                                <span className="block font-bold">{label}</span>
                                <span className="text-tinta-tenue">{nota}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>
                {visibilidad === "comunidad" && (
                    <label className="flex items-start gap-2 rounded-md bg-marcatexto-suave px-3 py-2 text-sm">
                        <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-1 accent-[var(--tinta)]" />
                        Es material mío o tengo permiso de compartirlo, y no incluye nombres ni fotos de mis alumnos.
                    </label>
                )}
                {error && (
                    <p role="alert" className="text-sm text-error">
                        {error}
                    </p>
                )}
                <button type="submit" disabled={!puedeSubir} className="h-11 rounded-md bg-tinta font-bold text-white hover:bg-tinta-fuerte disabled:opacity-40">
                    {subiendo ? "Subiendo..." : "Subir documento"}
                </button>
            </form>

            <div className="flex min-w-0 flex-col gap-8">
                <section>
                    <h2 className="font-display text-xl font-bold">Mis documentos</h2>
                    {mios === null && <p className="mt-2 text-tinta-tenue">Cargando...</p>}
                    {mios?.length === 0 && <p className="mt-2 text-tinta-tenue">Todavía no subes documentos.</p>}
                    <ul className="mt-3 flex flex-col gap-2">
                        {mios?.map((d) => (
                            <TarjetaDocumento
                                key={d.id}
                                doc={d}
                                acciones={
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => alternarVisibilidad(d)}
                                            className={`rounded-md px-3 py-1 font-bold ${d.visibilidad === "comunidad" ? "bg-etica-tinte text-etica" : "bg-relleno"}`}
                                            title="Cambiar quién lo puede ver"
                                        >
                                            {d.visibilidad === "comunidad" ? "Comunidad" : "Solo yo"}
                                        </button>
                                        <button type="button" onClick={() => borrar(d)} aria-label={`Quitar ${d.titulo}`} className="ml-auto text-tinta-tenue hover:text-error">
                                            <Trash2 size={16} aria-hidden="true" />
                                        </button>
                                    </>
                                }
                            />
                        ))}
                    </ul>
                </section>

                <section>
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-xl font-bold">De otros profes</h2>
                        <span className="flex-1" />
                        <select value={filtroCampo} onChange={(e) => setFiltroCampo(e.target.value)} className="h-9 rounded-md border border-borde-fuerte bg-white px-2 text-sm" aria-label="Filtrar por campo">
                            <option value="">Todos los campos</option>
                            {CAMPOS.map((c) => (
                                <option key={c.id} value={c.nombre}>
                                    {c.etiqueta}
                                </option>
                            ))}
                        </select>
                        <input
                            type="search"
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            maxLength={100}
                            placeholder="Buscar por título"
                            aria-label="Buscar documentos por título"
                            className="h-9 w-48 rounded-md border border-borde-fuerte bg-white px-3 text-sm outline-none focus:border-tinta"
                        />
                    </div>
                    {otros === null && <p className="mt-2 text-tinta-tenue">Cargando...</p>}
                    {otros?.length === 0 && <p className="mt-2 text-tinta-tenue">Aún no hay documentos compartidos con esos filtros.</p>}
                    <ul className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-2">
                        {otros?.map((d) => (
                            <TarjetaDocumento key={d.id} doc={d} />
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default function Biblioteca() {
    const [params, setParams] = useSearchParams();
    const pestana: Pestana = params.get("pestana") === "docs" ? "docs" : "libros";

    return (
        <PaginaCuaderno ancho="amplio">
            <header className="flex flex-col gap-2">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-tinta-tenue">Libros de texto SEP</p>
                <h1 className="titulo-condensado text-5xl md:text-6xl">
                    {pestana === "libros" ? (
                        <>
                            Busca en los libros, <span className="marcatexto">sin hojearlos</span>
                        </>
                    ) : (
                        <>
                            Comparte tu <span className="marcatexto">material</span>
                        </>
                    )}
                </h1>
                <p className="max-w-2xl text-[15px] text-tinta-tenue">
                    {pestana === "libros"
                        ? "Cuali busca en los libros de texto de la NEM y te dice en qué libro y página está el tema."
                        : "Sube fichas, exámenes o lecturas que hiciste tú, y descubre lo que comparten otros profes."}
                </p>
            </header>
            <div className="mt-6">
                <Pestanas actual={pestana} onCambio={(p) => setParams(p === "docs" ? { pestana: "docs" } : {}, { replace: true })} />
                {pestana === "libros" ? <LibrosSep /> : <DocumentosDocentes />}
            </div>
        </PaginaCuaderno>
    );
}
