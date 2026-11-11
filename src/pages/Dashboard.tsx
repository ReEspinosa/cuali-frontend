import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ClipboardList,
    FileText,
    FlaskConical,
    Gamepad2,
    Image as ImageIcon,
    MessageCircle,
    Presentation,
    Share2,
    type LucideIcon,
} from "lucide-react";
import PaginaCuaderno from "../components/PaginaCuaderno";
import { api, getUser, type PlaneacionResumen } from "../lib/api";
import { campoPorNombre } from "../lib/campos";

type Herramienta = { label: string; descripcion: string; icon: LucideIcon; to: string };

const HERRAMIENTAS: Herramienta[] = [
    { label: "Nueva planeación", descripcion: "Parte del campo formativo y el PDA, y termínala platicando con Cuali.", icon: FileText, to: "/planeacion/nueva" },
    { label: "Chat con Cuali", descripcion: "Dudas sobre la NEM, ideas de actividades o evaluación.", icon: MessageCircle, to: "/chat" },
    { label: "Diapositivas", descripcion: "Una presentación lista para proyectar en clase.", icon: Presentation, to: "/recursos/diapositivas" },
    { label: "Cuestionario", descripcion: "Opción múltiple, verdadero/falso o abiertas, con su clave.", icon: ClipboardList, to: "/recursos/cuestionarios" },
    { label: "Mapa mental", descripcion: "Organiza un tema en un mapa visual para tus alumnos.", icon: Share2, to: "/recursos/mapas-mentales" },
    { label: "Juegos didácticos", descripcion: "Memorama, sopa de letras, crucigrama y más.", icon: Gamepad2, to: "/recursos/juegos" },
    { label: "Carteles", descripcion: "Material visual para imprimir y pegar en el salón.", icon: ImageIcon, to: "/recursos/carteles" },
    { label: "Laboratorio", descripcion: "Construye con Cuali cualquier otro recurso que necesites.", icon: FlaskConical, to: "/recursos/laboratorio" },
];

const MAX_RECIENTES = 4;

function fechaDeHoy(): string {
    return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "America/Mexico_City",
    }).format(new Date());
}

function fechaCorta(iso: string): string {
    return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(iso));
}

export default function Dashboard() {
    const navigate = useNavigate();
    const user = getUser();
    const [pedido, setPedido] = useState("");
    const [recientes, setRecientes] = useState<PlaneacionResumen[] | null>(null);

    useEffect(() => {
        let vigente = true;
        api.listarPlaneaciones()
            .then((lista) => {
                if (vigente) setRecientes(lista.slice(0, MAX_RECIENTES));
            })
            .catch(() => {
                if (vigente) setRecientes([]);
            });
        return () => {
            vigente = false;
        };
    }, []);

    function empezar(e: FormEvent) {
        e.preventDefault();
        const texto = pedido.trim();
        if (!texto) return;
        // El chat recibe el pedido y lo envia en cuanto abre.
        navigate("/chat", { state: { mensajeInicial: texto } });
    }

    return (
        <PaginaCuaderno>
            <header className="flex flex-col gap-2">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-tinta-tenue">{fechaDeHoy()}</p>
                <h1 className="text-balance font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                    ¿Qué preparamos <span className="marcatexto">hoy</span>
                    {user?.nombre ? `, ${user.nombre}` : ""}?
                </h1>
            </header>

            <form
                onSubmit={empezar}
                className="sombra-recorte-sm mt-7 flex items-center gap-3 rounded-[10px] border-[1.5px] border-tinta bg-white py-2 pl-5 pr-2"
            >
                <label htmlFor="pedido" className="sr-only">
                    Qué necesitas
                </label>
                <input
                    id="pedido"
                    type="text"
                    value={pedido}
                    onChange={(e) => setPedido(e.target.value)}
                    maxLength={2000}
                    placeholder="Ej. un proyecto sobre el cuidado del agua para 6°, escenario comunitario"
                    className="min-w-0 flex-1 bg-transparent text-[17px] text-tinta outline-none placeholder:text-tinta-tenue"
                />
                <button
                    type="submit"
                    disabled={!pedido.trim()}
                    className="flex h-12 items-center gap-2 rounded-md bg-tinta px-5 font-bold text-white transition hover:bg-tinta-fuerte disabled:opacity-40"
                >
                    Empezar
                    <ArrowRight size={18} aria-hidden="true" />
                </button>
            </form>

            <section className="mt-9 flex flex-col gap-3" aria-labelledby="titulo-herramientas">
                <h2 id="titulo-herramientas" className="font-display text-[22px] font-bold">
                    Herramientas
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {HERRAMIENTAS.map((h) => {
                        const Icon = h.icon;
                        return (
                            <Link
                                key={h.to}
                                to={h.to}
                                className="group flex flex-col gap-2 rounded-lg border border-borde bg-white p-4 transition hover:border-tinta hover:shadow-[3px_3px_0_var(--tinta)]"
                            >
                                <Icon size={22} strokeWidth={1.8} className="text-margen" aria-hidden="true" />
                                <span className="font-bold text-tinta">{h.label}</span>
                                <span className="text-[13px] leading-snug text-tinta-tenue">{h.descripcion}</span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="mt-9 flex flex-col gap-3" aria-labelledby="titulo-recientes">
                <h2 id="titulo-recientes" className="font-display text-[22px] font-bold">
                    Retoma donde te quedaste
                </h2>
                <div className="rounded-lg border border-borde bg-white">
                    {recientes === null && <p className="px-5 py-4 text-sm text-tinta-tenue">Cargando tus planeaciones...</p>}
                    {recientes?.length === 0 && (
                        <p className="px-5 py-4 text-sm text-tinta-tenue">
                            Aún no tienes planeaciones.{" "}
                            <Link to="/planeacion/nueva" className="font-bold underline">
                                Crea la primera
                            </Link>
                            .
                        </p>
                    )}
                    {recientes?.map((p, i) => {
                        const campo = campoPorNombre(p.campo_formativo);
                        return (
                            <Link
                                key={p.id}
                                to={`/planeacion/${p.id}`}
                                className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition hover:bg-relleno ${
                                    i > 0 ? "border-t border-cuadricula" : ""
                                }`}
                            >
                                <span
                                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${campo?.clases.punto ?? "bg-tinta-tenue"}`}
                                    aria-hidden="true"
                                />
                                <span className="min-w-0 flex-1 truncate font-bold">{p.tema || p.contenido}</span>
                                <span className="text-[13px] text-tinta-tenue">{campo?.etiqueta ?? p.campo_formativo}</span>
                                <span className="rounded bg-relleno px-2 py-0.5 text-xs font-bold">
                                    {p.grado}° "{p.grupo}"
                                </span>
                                <span className="w-16 text-right text-[13px] text-tinta-tenue">{fechaCorta(p.created_at)}</span>
                            </Link>
                        );
                    })}
                </div>
            </section>
        </PaginaCuaderno>
    );
}
