import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, Minus, Plus, Search, Sparkles } from "lucide-react";
import PaginaCuaderno from "../components/PaginaCuaderno";
import { api, type CatalogoGrado, type Escenario, type MetodologiaId, type SugerenciaVinculo, type VinculoElegido } from "../lib/api";
import { CAMPOS, EJES_ARTICULADORES, METODOLOGIAS, campoPorNombre, metodologiaPorId, type Campo } from "../lib/campos";

type Contenido = { contenido: string; pda: string };
type Paso = 1 | 2 | 3 | 4;

const PASOS: { n: Paso; label: string }[] = [
    { n: 1, label: "Campo" },
    { n: 2, label: "Grado y PDA" },
    { n: 3, label: "Proyecto" },
    { n: 4, label: "Contexto" },
];

const ESCENARIOS: { id: Escenario; label: string; nota: string }[] = [
    { id: "aula", label: "Aula", nota: "Se trabaja dentro del salón." },
    { id: "escuela", label: "Escuela", nota: "Involucra a otros grupos o espacios." },
    { id: "comunidad", label: "Comunidad", nota: "Sale de la escuela: familias, colonia." },
];
const MINUTOS = [30, 40, 45, 50, 60, 90];
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

type ModoIntegracion = "ninguna" | "sugerida" | "elegida";

/**
 * Vista previa de los dias de cada sesion (lunes a viernes), con la misma
 * regla que usa el backend para el documento. O(S).
 */
function diasDeSesion(fechaIso: string, sesiones: number): string[] {
    if (!fechaIso) return [];
    const [a, m, d] = fechaIso.split("-").map(Number);
    const fecha = new Date(a, m - 1, d);
    const dias: string[] = [];
    while (dias.length < sesiones) {
        const dia = fecha.getDay();
        if (dia !== 0 && dia !== 6) dias.push(`${DIAS[dia]} ${fecha.getDate()} ${MESES[fecha.getMonth()]}`);
        fecha.setDate(fecha.getDate() + 1);
    }
    return dias;
}

const GRADOS = [1, 2, 3, 4, 5, 6];
const SESIONES_MIN = 1;
const SESIONES_MAX = 20;

/**
 * Separa el PDA del catalogo en procesos individuales, igual que el backend
 * (catalogo.separar_pdas): por lineas en blanco y, si es un solo bloque, por
 * oraciones. Asi cada proceso se puede elegir y evaluar por separado. O(L).
 */
function separarPdas(texto: string): string[] {
    const bloques = texto
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
    if (bloques.length > 1) return bloques;
    return texto
        .trim()
        .split(/(?<=[.;])\s+(?=[A-ZÁÉÍÓÚÑ])/)
        .map((p) => p.trim())
        .filter(Boolean);
}

function Pasos({ actual }: { actual: Paso }) {
    return (
        <ol className="flex flex-wrap gap-1.5 text-[13px] font-bold" aria-label="Pasos">
            {PASOS.map((p) => {
                const hecho = p.n < actual;
                const esActual = p.n === actual;
                return (
                    <li
                        key={p.n}
                        aria-current={esActual ? "step" : undefined}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                            esActual
                                ? "bg-tinta text-white"
                                : hecho
                                  ? "bg-relleno text-tinta"
                                  : "border border-borde bg-white text-tinta-tenue"
                        }`}
                    >
                        {hecho ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : `${p.n} ·`} {p.label}
                    </li>
                );
            })}
            <li className="rounded-full border border-borde bg-white px-3 py-1 text-tinta-tenue">Documento</li>
        </ol>
    );
}

function BarraInferior({
    resumen,
    onAtras,
    onContinuar,
    textoContinuar,
    deshabilitado,
}: {
    resumen: React.ReactNode;
    onAtras?: () => void;
    onContinuar: () => void;
    textoContinuar: string;
    deshabilitado: boolean;
}) {
    return (
        <div className="sticky bottom-4 mt-8 flex flex-wrap items-center gap-4 rounded-lg border border-borde bg-white px-5 py-3.5 shadow-sm">
            <div className="min-w-0 flex-1 text-[15px]">{resumen}</div>
            {onAtras && (
                <button type="button" onClick={onAtras} className="flex items-center gap-1.5 text-sm font-bold text-tinta hover:underline">
                    <ArrowLeft size={16} aria-hidden="true" />
                    Atrás
                </button>
            )}
            <button
                type="button"
                onClick={onContinuar}
                disabled={deshabilitado}
                className="flex h-12 items-center gap-2 rounded-md bg-tinta px-5 font-bold text-white transition hover:bg-tinta-fuerte disabled:cursor-not-allowed disabled:opacity-40"
            >
                {textoContinuar}
                <ArrowRight size={18} aria-hidden="true" />
            </button>
        </div>
    );
}

export default function NuevaPlaneacion() {
    const navigate = useNavigate();

    const [paso, setPaso] = useState<Paso>(1);
    const [campo, setCampo] = useState<Campo | null>(null);
    const [metodologia, setMetodologia] = useState<MetodologiaId | null>(null);
    const [ejes, setEjes] = useState<Set<string>>(new Set());

    const [grado, setGrado] = useState(6);
    const [busqueda, setBusqueda] = useState("");
    const [contenido, setContenido] = useState<Contenido | null>(null);
    const [pdasElegidos, setPdasElegidos] = useState<Set<number>>(new Set());

    const [grupo, setGrupo] = useState("");
    const [sesiones, setSesiones] = useState(3);
    const [tema, setTema] = useState("");

    const [escenario, setEscenario] = useState<Escenario>("aula");
    const [minutos, setMinutos] = useState(50);
    const [alumnos, setAlumnos] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [modoIntegracion, setModoIntegracion] = useState<ModoIntegracion>("ninguna");
    const [sugerencias, setSugerencias] = useState<SugerenciaVinculo[] | null>(null);
    const [vinculos, setVinculos] = useState<VinculoElegido[]>([]);
    const [recursos, setRecursos] = useState("");
    const [ajustes, setAjustes] = useState("");

    const [creando, setCreando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // El catalogo oficial lo sirve el backend: grados disponibles y, por
    // grado, sus contenidos y PDA. Una peticion por grado elegido.
    const [gradosDisponibles, setGradosDisponibles] = useState<Set<number>>(new Set([6]));
    const [catalogo, setCatalogo] = useState<CatalogoGrado | null>(null);
    const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);

    useEffect(() => {
        api.gradosConCatalogo()
            .then((r) => setGradosDisponibles(new Set(r.grados)))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        let vigente = true;
        setCatalogo(null);
        setErrorCatalogo(null);
        api.obtenerCatalogo(grado)
            .then((c) => vigente && setCatalogo(c))
            .catch((err) => vigente && setErrorCatalogo(err instanceof Error ? err.message : "No se pudo cargar el catálogo."));
        return () => {
            vigente = false;
        };
    }, [grado]);

    const contenidosDelCampo = useMemo<Contenido[]>(() => {
        if (!campo) return [];
        const data = catalogo?.campos_formativos.find((c) => c.campo_formativo === campo.nombre);
        return data ? data.contenidos : [];
    }, [campo, catalogo]);

    // Filtro lineal: O(n * L) con n <= 24 contenidos por campo.
    const contenidosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return contenidosDelCampo;
        return contenidosDelCampo.filter(
            (c) => c.contenido.toLowerCase().includes(q) || c.pda.toLowerCase().includes(q)
        );
    }, [busqueda, contenidosDelCampo]);

    const pdasDelContenido = useMemo(() => (contenido ? separarPdas(contenido.pda) : []), [contenido]);

    function elegirCampo(c: Campo) {
        if (campo?.id !== c.id) {
            setContenido(null);
            setPdasElegidos(new Set());
            setBusqueda("");
            setMetodologia(c.metodologia);
        }
        setCampo(c);
    }

    /** Datos de ejemplo para probar rapido; la docente los cambia. */
    function rellenarEjemplo() {
        setEscenario("aula");
        setMinutos(50);
        setAlumnos("30");
        setRecursos("Libros de texto de la SEP, cuaderno, pizarrón, cartulinas, colores y una computadora con proyector.");
        setAjustes("Dos alumnos necesitan instrucciones por pasos y apoyo visual; un alumno se sienta al frente por baja visión.");
        if (!fechaInicio) {
            // Fecha local (toISOString daria la de UTC: de noche, el dia siguiente).
            const hoy = new Date();
            const dosDigitos = (n: number) => String(n).padStart(2, "0");
            setFechaInicio(`${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`);
        }
    }

    function alternarEje(eje: string) {
        setEjes((prev) => {
            const nuevo = new Set(prev);
            if (nuevo.has(eje)) nuevo.delete(eje);
            else nuevo.add(eje);
            return nuevo;
        });
    }

    function elegirContenido(c: Contenido) {
        setContenido(c);
        // Por defecto se marcan todos los PDA del contenido; la docente quita los que no.
        setPdasElegidos(new Set(separarPdas(c.pda).map((_, i) => i)));
    }

    function alternarPda(i: number) {
        setPdasElegidos((prev) => {
            const nuevo = new Set(prev);
            if (nuevo.has(i)) nuevo.delete(i);
            else nuevo.add(i);
            return nuevo;
        });
    }

    async function cambiarModoIntegracion(modo: ModoIntegracion) {
        setModoIntegracion(modo);
        setVinculos([]);
        if (modo !== "sugerida" || !campo || !contenido) return;
        setSugerencias(null);
        try {
            const sug = await api.sugerirVinculos(grado, campo.nombre, contenido.contenido, tema.trim());
            setSugerencias(sug);
            setVinculos(sug.map(({ campo: c, contenido: t }) => ({ campo: c, contenido: t })));
        } catch {
            setSugerencias([]);
        }
    }

    /** Alterna un vinculo; a lo mas uno por campo. O(k), k <= 3. */
    function alternarVinculo(v: VinculoElegido) {
        setVinculos((prev) => {
            const sinCampo = prev.filter((x) => x.campo !== v.campo);
            const yaEstaba = prev.some((x) => x.campo === v.campo && x.contenido === v.contenido);
            return yaEstaba ? sinCampo : [...sinCampo, v];
        });
    }

    async function crear() {
        if (!campo || !metodologia || !contenido) return;
        setError(null);
        setCreando(true);

        const pdaTexto = pdasDelContenido.filter((_, i) => pdasElegidos.has(i)).join("\n\n");
        const nAlumnos = Number.parseInt(alumnos, 10);

        try {
            const planeacion = await api.crearPlaneacion({
                grado,
                campo_formativo: campo.nombre,
                contenido: contenido.contenido,
                pda: pdaTexto,
                grupo: grupo.trim(),
                sesiones,
                tema: tema.trim(),
                contexto: {
                    metodologia,
                    escenario,
                    minutos_por_sesion: minutos,
                    num_alumnos: Number.isFinite(nAlumnos) && nAlumnos > 0 ? Math.min(nAlumnos, 60) : null,
                    problematica: tema.trim(),
                    recursos_disponibles: recursos.trim(),
                    ajustes_razonables: ajustes.trim(),
                    ejes_articuladores: Array.from(ejes),
                    periodo: "",
                    usar_dias_semana: true,
                    fecha_inicio: fechaInicio || null,
                    integracion: { modo: modoIntegracion, contenidos: modoIntegracion === "ninguna" ? [] : vinculos },
                },
            });
            // El documento se genera en su propia pagina: si la docente
            // recarga o cambia de pantalla, no se pierde nada.
            navigate(`/planeacion/${planeacion.id}`, { state: { generar: true } });
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear la planeación.");
            setCreando(false);
        }
    }

    const nPdas = pdasElegidos.size;

    return (
        <PaginaCuaderno ancho="amplio">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {paso > 1 ? (
                    <button
                        type="button"
                        onClick={() => setPaso((p) => (p - 1) as Paso)}
                        className="flex items-center gap-1.5 text-sm font-bold hover:underline"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        {PASOS[paso - 2].label}
                    </button>
                ) : (
                    <span />
                )}
                <Pasos actual={paso} />
            </div>

            {/* ------------------------------------------------ Paso 1: campo */}
            {paso === 1 && (
                <>
                    <header className="mt-6 flex flex-col gap-2">
                        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-tinta-tenue">Nueva planeación</p>
                        <h1 className="titulo-condensado text-5xl md:text-6xl">
                            Planea desde el <span className="marcatexto">campo formativo</span>
                        </h1>
                    </header>

                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {CAMPOS.map((c) => {
                            const elegido = campo?.id === c.id;
                            return (
                                <section
                                    key={c.id}
                                    aria-label={c.nombre}
                                    className={`relative flex min-h-[320px] flex-col gap-3 rounded-md border-[1.5px] border-tinta px-5 pb-2 pt-5 text-white sombra-recorte ${c.clases.fondo} ${
                                        elegido ? "outline-[3px] outline-offset-4 outline-marcatexto" : ""
                                    }`}
                                    style={elegido ? { outlineStyle: "solid" } : undefined}
                                >
                                    {elegido && (
                                        <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-marcatexto text-tinta">
                                            <Check size={15} strokeWidth={3} aria-hidden="true" />
                                        </span>
                                    )}
                                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-85">Campo formativo</span>
                                    <h2 className="titulo-condensado text-[28px]">{c.nombre}</h2>
                                    <p className="text-sm leading-snug opacity-95">{c.descripcion}</p>
                                    <div className="flex-1" />
                                    <div className="border-t border-white/35 pt-2.5 text-[13px] leading-snug">
                                        <span className="block text-[11px] font-bold uppercase tracking-[0.1em] opacity-85">
                                            Metodología sugerida por la SEP
                                        </span>
                                        {metodologiaPorId(c.metodologia).nombre}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => elegirCampo(c)}
                                        aria-pressed={elegido}
                                        className={`mb-2 flex items-center justify-between rounded px-2.5 py-2.5 text-left text-[15px] font-bold transition ${
                                            elegido ? `bg-white ${c.clases.texto}` : "bg-white/10 hover:bg-white/20"
                                        }`}
                                    >
                                        {elegido ? "Campo elegido" : "Planear en este campo"}
                                        <ArrowRight size={16} aria-hidden="true" />
                                    </button>
                                </section>
                            );
                        })}
                    </div>

                    <section className="mt-8 flex flex-col gap-3 rounded-lg border border-borde bg-white px-5 py-4">
                        <div className="flex flex-wrap items-baseline gap-2.5">
                            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-tinta-tenue">Ejes articuladores</h2>
                            <span className="text-[13px] text-tinta-tenue">Opcional · elige los que trabajará tu proyecto</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {EJES_ARTICULADORES.map((eje) => {
                                const activo = ejes.has(eje);
                                return (
                                    <button
                                        key={eje}
                                        type="button"
                                        onClick={() => alternarEje(eje)}
                                        aria-pressed={activo}
                                        className={`min-h-9 rounded-full px-3.5 py-1.5 text-sm transition ${
                                            activo
                                                ? "border-[1.5px] border-tinta bg-tinta font-bold text-white"
                                                : "border border-borde-fuerte bg-white hover:border-tinta"
                                        }`}
                                    >
                                        {eje}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <BarraInferior
                        resumen={
                            campo && metodologia ? (
                                <span className="flex items-center gap-2">
                                    <span className={`h-3 w-3 rounded-sm ${campo.clases.punto}`} aria-hidden="true" />
                                    <strong>{campo.nombre}</strong>
                                    <span className="text-tinta-tenue">· {metodologia && metodologiaPorId(metodologia).nombre}</span>
                                </span>
                            ) : (
                                <span className="text-tinta-tenue">Elige el campo formativo de tu proyecto.</span>
                            )
                        }
                        onContinuar={() => setPaso(2)}
                        textoContinuar="Continuar"
                        deshabilitado={!campo || !metodologia}
                    />
                </>
            )}

            {/* ----------------------------------------- Paso 2: grado y PDA */}
            {paso === 2 && campo && (
                <>
                    <header className="mt-6 flex flex-col gap-3">
                        <span className={`self-start rounded px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-white ${campo.clases.fondo}`}>
                            {campo.nombre} · {metodologia && metodologiaPorId(metodologia).nombre}
                        </span>
                        <h1 className="titulo-condensado text-5xl">
                            ¿Qué grado y qué <span className="marcatexto">PDA</span>?
                        </h1>
                    </header>

                    <section className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-borde bg-white px-5 py-4" aria-labelledby="titulo-grado">
                        <h2 id="titulo-grado" className="text-[13px] font-bold uppercase tracking-[0.08em] text-tinta-tenue">
                            Grado
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {GRADOS.map((g) => {
                                const disponible = gradosDisponibles.has(g);
                                const activo = grado === g;
                                return (
                                    <button
                                        key={g}
                                        type="button"
                                        disabled={!disponible}
                                        onClick={() => {
                                            if (g === grado) return;
                                            // Cambiar de grado cambia los contenidos y su PDA.
                                            setGrado(g);
                                            setContenido(null);
                                            setPdasElegidos(new Set());
                                            setVinculos([]);
                                        }}
                                        aria-pressed={activo}
                                        title={disponible ? undefined : "Próximamente: aún no está su catálogo"}
                                        className={`h-11 w-12 rounded-md font-bold transition ${
                                            activo
                                                ? "border-[1.5px] border-tinta bg-tinta text-white shadow-[3px_3px_0_var(--marcatexto)]"
                                                : "border border-borde-fuerte bg-white disabled:cursor-not-allowed disabled:border-dashed disabled:text-tinta-tenue disabled:opacity-60"
                                        }`}
                                    >
                                        {g}°
                                    </button>
                                );
                            })}
                        </div>
                        <span className="text-[13px] text-tinta-tenue">
                            {errorCatalogo
                                ? errorCatalogo
                                : gradosDisponibles.size < 6
                                  ? `Catálogo del Programa Sintético disponible para ${Array.from(gradosDisponibles).sort().map((g) => `${g}°`).join(", ")}.`
                                  : "Contenidos y PDA del Programa Sintético de la SEP."}
                        </span>
                    </section>

                    <section className="mt-6 flex flex-col gap-3" aria-labelledby="titulo-contenido">
                        <div className="flex flex-wrap items-center gap-4">
                            <h2 id="titulo-contenido" className="font-display text-[22px] font-bold">
                                Contenido y PDA
                            </h2>
                            <span className="flex-1" />
                            <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-md border border-borde-fuerte bg-white px-3.5 text-tinta-tenue">
                                <Search size={17} aria-hidden="true" />
                                <span className="sr-only">Buscar contenido o PDA</span>
                                <input
                                    type="search"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar contenido o PDA"
                                    className="min-w-0 flex-1 bg-transparent text-sm text-tinta outline-none"
                                />
                            </label>
                        </div>

                        {contenidosFiltrados.length === 0 && (
                            <p className="rounded-lg border border-borde bg-white px-5 py-4 text-sm text-tinta-tenue">
                                No hay contenidos que coincidan con "{busqueda}".
                            </p>
                        )}

                        <div className="flex flex-col gap-3">
                            {contenidosFiltrados.map((c) => {
                                const elegido = contenido?.contenido === c.contenido;
                                if (!elegido) {
                                    return (
                                        <button
                                            key={c.contenido}
                                            type="button"
                                            onClick={() => elegirContenido(c)}
                                            className="flex items-start gap-3 rounded-lg border border-borde bg-white px-5 py-4 text-left transition hover:border-tinta"
                                        >
                                            <span className="mt-0.5 h-[22px] w-[22px] flex-shrink-0 rounded-full border-[1.5px] border-borde-fuerte" aria-hidden="true" />
                                            <span>{c.contenido}</span>
                                        </button>
                                    );
                                }
                                return (
                                    <div
                                        key={c.contenido}
                                        className={`flex flex-col gap-3 rounded-lg border-[1.5px] border-tinta bg-white px-5 py-4`}
                                        style={{ boxShadow: `4px 4px 0 var(--campo-${campo.id})` }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 h-[22px] w-[22px] flex-shrink-0 rounded-full border-[6px] border-tinta" aria-hidden="true" />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">Contenido</span>
                                                <span className="font-bold">{c.contenido}</span>
                                            </div>
                                        </div>
                                        <fieldset className="flex flex-col gap-1 pl-[34px]">
                                            <legend className="pb-1 text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">
                                                Procesos de Desarrollo de Aprendizaje
                                            </legend>
                                            {pdasDelContenido.map((pda, i) => (
                                                <label
                                                    key={i}
                                                    className={`flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-[15px] leading-snug ${
                                                        pdasElegidos.has(i) ? campo.clases.tinte : ""
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={pdasElegidos.has(i)}
                                                        onChange={() => alternarPda(i)}
                                                        className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 accent-[var(--tinta)]"
                                                    />
                                                    {pda}
                                                </label>
                                            ))}
                                        </fieldset>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <BarraInferior
                        resumen={
                            <span>
                                <strong>{grado}° grado</strong>
                                <span className="text-tinta-tenue">
                                    {" "}
                                    · {contenido ? "1 contenido" : "sin contenido"} · {nPdas} PDA
                                </span>
                            </span>
                        }
                        onAtras={() => setPaso(1)}
                        onContinuar={() => setPaso(3)}
                        textoContinuar="Continuar"
                        deshabilitado={!contenido || nPdas === 0}
                    />
                </>
            )}

            {/* --------------------------------------------- Paso 3: proyecto */}
            {paso === 3 && campo && contenido && (
                <>
                    <header className="mt-6 flex flex-col gap-3">
                        <span className={`self-start rounded px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-white ${campo.clases.fondo}`}>
                            {campo.nombre} · {metodologia && metodologiaPorId(metodologia).nombre} · {grado}°
                        </span>
                        <h1 className="titulo-condensado text-5xl">
                            Cuéntanos tu <span className="marcatexto">proyecto</span>
                        </h1>
                    </header>

                    <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex min-w-0 flex-1 flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="tema" className="font-bold">
                                    ¿Qué situación de tu escuela o comunidad quieren atender?
                                </label>
                                <div className="sombra-recorte flex flex-col rounded-lg border-[1.5px] border-tinta bg-white">
                                    <textarea
                                        id="tema"
                                        value={tema}
                                        onChange={(e) => setTema(e.target.value)}
                                        rows={4}
                                        maxLength={1000}
                                        placeholder="Ej. En el recreo se tira mucha basura en el patio y los botes no se separan. Quiero que el grupo investigue el problema y proponga una solución con las familias."
                                        className="resize-none rounded-lg bg-transparent px-4 py-3.5 text-base leading-relaxed outline-none placeholder:text-tinta-tenue"
                                    />
                                    <p className="border-t border-cuadricula px-4 py-2 text-[13px] text-tinta-tenue">
                                        Entre más contexto des, más aterrizada sale la planeación.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-end gap-7">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="grupo" className="font-bold">
                                        Grupo
                                    </label>
                                    <input
                                        id="grupo"
                                        type="text"
                                        value={grupo}
                                        onChange={(e) => setGrupo(e.target.value)}
                                        maxLength={20}
                                        placeholder="Ej. A"
                                        className="h-11 w-32 rounded-md border border-borde-fuerte bg-white px-3 outline-none focus:border-tinta"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="font-bold" id="etiqueta-sesiones">
                                        Sesiones
                                    </span>
                                    <div className="flex items-center gap-1.5" role="group" aria-labelledby="etiqueta-sesiones">
                                        <button
                                            type="button"
                                            onClick={() => setSesiones((s) => Math.max(SESIONES_MIN, s - 1))}
                                            disabled={sesiones <= SESIONES_MIN}
                                            aria-label="Una sesión menos"
                                            className="flex h-11 w-11 items-center justify-center rounded-md border border-borde-fuerte bg-white disabled:opacity-40"
                                        >
                                            <Minus size={16} aria-hidden="true" />
                                        </button>
                                        <output className="flex h-11 min-w-14 items-center justify-center rounded-md border border-borde-fuerte bg-white font-bold" aria-live="polite">
                                            {sesiones}
                                        </output>
                                        <button
                                            type="button"
                                            onClick={() => setSesiones((s) => Math.min(SESIONES_MAX, s + 1))}
                                            disabled={sesiones >= SESIONES_MAX}
                                            aria-label="Una sesión más"
                                            className="flex h-11 w-11 items-center justify-center rounded-md border border-borde-fuerte bg-white disabled:opacity-40"
                                        >
                                            <Plus size={16} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {metodologia && sesiones < metodologiaPorId(metodologia).nFases && (
                                <p role="note" className="flex flex-wrap items-center gap-2 rounded-md bg-marcatexto-suave px-4 py-2.5 text-sm text-marcatexto-texto">
                                    Con {sesiones} {sesiones === 1 ? "sesión" : "sesiones"} varias etapas de {metodologiaPorId(metodologia).nombre} se
                                    juntan en un mismo día y puede no alcanzar para el producto final.
                                    <button
                                        type="button"
                                        onClick={() => setSesiones(metodologiaPorId(metodologia).nFases)}
                                        className="rounded border border-marcatexto-texto px-2 py-0.5 font-bold"
                                    >
                                        Usar {metodologiaPorId(metodologia).nFases} sesiones
                                    </button>
                                </p>
                            )}

                            <fieldset className="flex flex-col gap-2">
                                <legend className="pb-1 font-bold">Metodología</legend>
                                <p className="text-[13px] text-tinta-tenue">
                                    La SEP sugiere una por campo, pero puedes elegir otra. Cuali acomoda sus fases en tus sesiones.
                                </p>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {METODOLOGIAS.map((m) => {
                                        const activa = metodologia === m.id;
                                        return (
                                            <label
                                                key={m.id}
                                                className={`flex cursor-pointer flex-col gap-0.5 rounded-md border px-3.5 py-2.5 text-sm ${
                                                    activa ? "border-[1.5px] border-tinta bg-relleno" : "border-borde-fuerte bg-white"
                                                }`}
                                            >
                                                <span className="flex items-center gap-2 font-bold">
                                                    <input
                                                        type="radio"
                                                        name="metodologia"
                                                        checked={activa}
                                                        onChange={() => setMetodologia(m.id)}
                                                        className="accent-[var(--tinta)]"
                                                    />
                                                    {m.nombre}
                                                    {campo.metodologia === m.id && (
                                                        <span className="rounded bg-marcatexto px-1.5 py-0.5 text-[11px] text-tinta">Sugerida</span>
                                                    )}
                                                </span>
                                                <span className="pl-6 text-[13px] text-tinta-tenue">{m.fases}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        </div>

                        <aside className="flex w-full flex-shrink-0 flex-col gap-3.5 rounded-lg border border-borde bg-white px-5 py-4 lg:w-72">
                            <h2 className="font-display text-lg font-bold">Lo que Cuali va a usar</h2>
                            <dl className="flex flex-col gap-3 text-sm">
                                <div>
                                    <dt className="text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">Campo</dt>
                                    <dd className="flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-sm ${campo.clases.punto}`} aria-hidden="true" />
                                        {campo.nombre}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">Metodología</dt>
                                    <dd>{metodologia && metodologiaPorId(metodologia).nombre}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">Grado y PDA</dt>
                                    <dd>
                                        {grado}° · {nPdas} PDA seleccionados
                                    </dd>
                                </div>
                                {ejes.size > 0 && (
                                    <div>
                                        <dt className="text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">Ejes articuladores</dt>
                                        <dd>{Array.from(ejes).join(" · ")}</dd>
                                    </div>
                                )}
                                <div className="border-t border-dashed border-borde pt-3">
                                    <dt className="text-xs font-bold uppercase tracking-[0.06em] text-tinta-tenue">Fuente</dt>
                                    <dd className="flex items-center gap-2">
                                        <BookOpen size={15} aria-hidden="true" />
                                        Libros de texto SEP de {grado}°
                                    </dd>
                                </div>
                            </dl>
                        </aside>
                    </div>

                    <BarraInferior
                        resumen={
                            <span>
                                <strong>{grupo.trim() ? `Grupo ${grupo.trim()}` : "Falta el grupo"}</strong>
                                <span className="text-tinta-tenue"> · {sesiones} {sesiones === 1 ? "sesión" : "sesiones"}</span>
                            </span>
                        }
                        onAtras={() => setPaso(2)}
                        onContinuar={() => setPaso(4)}
                        textoContinuar="Continuar"
                        deshabilitado={!grupo.trim() || !tema.trim() || !metodologia}
                    />
                </>
            )}

            {/* --------------------------------------------- Paso 4: contexto */}
            {paso === 4 && campo && contenido && (
                <>
                    <header className="mt-6 flex flex-col gap-3">
                        <span className={`self-start rounded px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-white ${campo.clases.fondo}`}>
                            {campo.nombre} · {grado}° {grupo.trim()}
                        </span>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <h1 className="titulo-condensado text-5xl">
                                Así es tu <span className="marcatexto">grupo</span>
                            </h1>
                            <button
                                type="button"
                                onClick={rellenarEjemplo}
                                className="flex items-center gap-1.5 rounded-md border border-borde-fuerte bg-white px-3 py-2 text-sm font-bold hover:border-tinta"
                            >
                                <Sparkles size={15} aria-hidden="true" />
                                Rellenar ejemplo
                            </button>
                        </div>
                        <p className="max-w-2xl text-[15px] text-tinta-tenue">
                            Cuali no conoce tu salón. Con estos datos no asume materiales que no tienes y ajusta los tiempos de cada sesión.
                        </p>
                    </header>

                    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <fieldset className="flex flex-col gap-2 rounded-lg border border-borde bg-white px-5 py-4">
                            <legend className="px-1 font-bold">Escenario</legend>
                            <div className="flex flex-wrap gap-2">
                                {ESCENARIOS.map((e) => (
                                    <button
                                        key={e.id}
                                        type="button"
                                        onClick={() => setEscenario(e.id)}
                                        aria-pressed={escenario === e.id}
                                        title={e.nota}
                                        className={`min-h-10 rounded-full px-4 text-sm ${
                                            escenario === e.id
                                                ? "border-[1.5px] border-tinta bg-tinta font-bold text-white"
                                                : "border border-borde-fuerte bg-white hover:border-tinta"
                                        }`}
                                    >
                                        {e.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[13px] text-tinta-tenue">{ESCENARIOS.find((e) => e.id === escenario)?.nota}</p>
                        </fieldset>

                        <fieldset className="flex flex-col gap-2 rounded-lg border border-borde bg-white px-5 py-4">
                            <legend className="px-1 font-bold">Tiempo</legend>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm">Minutos por sesión</span>
                                {MINUTOS.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMinutos(m)}
                                        aria-pressed={minutos === m}
                                        className={`h-9 min-w-11 rounded-md px-2 text-sm font-bold ${
                                            minutos === m ? "bg-tinta text-white" : "border border-borde-fuerte bg-white"
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <label className="flex flex-col gap-1 text-sm">
                                Fecha de la primera sesión
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="h-10 w-48 rounded-md border border-borde-fuerte bg-white px-3 outline-none focus:border-tinta"
                                />
                            </label>
                            {fechaInicio ? (
                                <p className="text-[13px] text-tinta-tenue">
                                    Una sesión por día hábil: {diasDeSesion(fechaInicio, sesiones).join(" · ")}
                                </p>
                            ) : (
                                <p className="text-[13px] text-tinta-tenue">Sin fecha, las sesiones se nombran lunes, martes...</p>
                            )}
                        </fieldset>

                        <label className="flex flex-col gap-2 rounded-lg border border-borde bg-white px-5 py-4">
                            <span className="font-bold">¿Con qué materiales cuentas?</span>
                            <textarea
                                value={recursos}
                                onChange={(e) => setRecursos(e.target.value)}
                                rows={3}
                                maxLength={1000}
                                placeholder="Ej. Libros de la SEP, cartulinas, colores, una computadora con proyector. Sin internet en el salón."
                                className="resize-none rounded-md border border-borde-fuerte px-3 py-2 text-[15px] outline-none focus:border-tinta"
                            />
                            <span className="text-[13px] text-tinta-tenue">Si lo dejas vacío, Cuali solo usará libros, cuaderno y pizarrón.</span>
                        </label>

                        <div className="flex flex-col gap-4 rounded-lg border border-borde bg-white px-5 py-4">
                            <label className="flex flex-col gap-1">
                                <span className="font-bold">Número de alumnos</span>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={60}
                                    value={alumnos}
                                    onChange={(e) => setAlumnos(e.target.value)}
                                    placeholder="Ej. 32"
                                    className="h-10 w-32 rounded-md border border-borde-fuerte px-3 outline-none focus:border-tinta"
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="font-bold">Ajustes razonables</span>
                                <textarea
                                    value={ajustes}
                                    onChange={(e) => setAjustes(e.target.value)}
                                    rows={2}
                                    maxLength={1000}
                                    placeholder="Ej. Un alumno necesita instrucciones por pasos y apoyo visual."
                                    className="resize-none rounded-md border border-borde-fuerte px-3 py-2 text-[15px] outline-none focus:border-tinta"
                                />
                            </label>
                        </div>
                    </div>

                    <section className="mt-5 flex flex-col gap-3 rounded-lg border border-borde bg-white px-5 py-4" aria-labelledby="titulo-integracion">
                        <div className="flex flex-wrap items-baseline gap-2.5">
                            <h2 id="titulo-integracion" className="font-bold">
                                Proyecto integrador
                            </h2>
                            <span className="text-[13px] text-tinta-tenue">
                                Opcional · la SEP sugiere integrar campos cuando el proyecto lo permite
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Integración con otros campos">
                            {(
                                [
                                    ["ninguna", "Solo este campo"],
                                    ["sugerida", "Cuali sugiere"],
                                    ["elegida", "Yo elijo"],
                                ] as const
                            ).map(([id, label]) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => void cambiarModoIntegracion(id)}
                                    aria-pressed={modoIntegracion === id}
                                    className={`min-h-10 rounded-full px-4 text-sm ${
                                        modoIntegracion === id
                                            ? "border-[1.5px] border-tinta bg-tinta font-bold text-white"
                                            : "border border-borde-fuerte bg-white hover:border-tinta"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {modoIntegracion === "sugerida" && (
                            <div className="flex flex-col gap-2">
                                {sugerencias === null && <p className="text-sm text-tinta-tenue">Buscando contenidos relacionados...</p>}
                                {sugerencias?.length === 0 && (
                                    <p className="text-sm text-tinta-tenue">No encontré contenidos relacionados. Prueba "Yo elijo".</p>
                                )}
                                {sugerencias?.map((sug) => {
                                    const c = campoPorNombre(sug.campo);
                                    const activo = vinculos.some((v) => v.contenido === sug.contenido);
                                    return (
                                        <label
                                            key={sug.contenido}
                                            className={`flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-2.5 text-sm ${
                                                activo ? `border-tinta ${c?.clases.tinte ?? "bg-relleno"}` : "border-borde"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={activo}
                                                onChange={() => alternarVinculo(sug)}
                                                className="mt-0.5 h-4 w-4 accent-[var(--tinta)]"
                                            />
                                            <span>
                                                <span className={`block text-xs font-bold uppercase tracking-[0.06em] ${c?.clases.texto ?? ""}`}>
                                                    {c?.etiqueta ?? sug.campo}
                                                </span>
                                                {sug.contenido}
                                                {sug.razon && <span className="block text-[13px] text-tinta-tenue">{sug.razon}</span>}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {modoIntegracion === "elegida" && (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                {CAMPOS.filter((c) => c.id !== campo.id).map((c) => {
                                    const opciones =
                                        catalogo?.campos_formativos.find((x) => x.campo_formativo === c.nombre)?.contenidos ?? [];
                                    const actual = vinculos.find((v) => v.campo === c.nombre)?.contenido ?? "";
                                    return (
                                        <label key={c.id} className="flex flex-col gap-1 text-sm">
                                            <span className={`text-xs font-bold uppercase tracking-[0.06em] ${c.clases.texto}`}>{c.etiqueta}</span>
                                            <select
                                                value={actual}
                                                onChange={(e) => {
                                                    const valor = e.target.value;
                                                    setVinculos((prev) => {
                                                        const sinCampo = prev.filter((v) => v.campo !== c.nombre);
                                                        return valor ? [...sinCampo, { campo: c.nombre, contenido: valor }] : sinCampo;
                                                    });
                                                }}
                                                className="h-10 w-full rounded-md border border-borde-fuerte bg-white px-2"
                                            >
                                                <option value="">Sin vincular</option>
                                                {opciones.map((o) => (
                                                    <option key={o.contenido} value={o.contenido}>
                                                        {o.contenido.length > 90 ? `${o.contenido.slice(0, 90)}...` : o.contenido}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {modoIntegracion !== "ninguna" && (
                            <p className="text-[13px] text-tinta-tenue">
                                Cuali pondrá cada vínculo en la sesión donde mejor encaje y agregará su fila a la rúbrica. El contenido y el PDA de cada campo son los oficiales.
                            </p>
                        )}
                    </section>

                    {error && (
                        <p role="alert" className="mt-5 rounded-md bg-error-tinte px-4 py-3 text-sm text-error">
                            {error}
                        </p>
                    )}

                    <BarraInferior
                        resumen={
                            <span>
                                <strong>
                                    {sesiones} {sesiones === 1 ? "sesión" : "sesiones"} de {minutos} min
                                </strong>
                                <span className="text-tinta-tenue"> · {ESCENARIOS.find((e) => e.id === escenario)?.label}</span>
                            </span>
                        }
                        onAtras={() => setPaso(3)}
                        onContinuar={crear}
                        textoContinuar={creando ? "Creando..." : "Generar planeación"}
                        deshabilitado={creando}
                    />
                </>
            )}
        </PaginaCuaderno>
    );
}
