import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import PaginaCuaderno from "../components/PaginaCuaderno";
import { api, type PlaneacionResumen } from "../lib/api";
import { CAMPOS, campoPorNombre, type CampoId } from "../lib/campos";

function fechaCorta(iso: string): string {
    return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function MisPlaneaciones() {
    const [planeaciones, setPlaneaciones] = useState<PlaneacionResumen[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<CampoId | "todos">("todos");

    useEffect(() => {
        let vigente = true;
        api.listarPlaneaciones()
            .then((lista) => {
                if (vigente) setPlaneaciones(lista);
            })
            .catch((err) => {
                if (vigente) setError(err instanceof Error ? err.message : "No se pudieron cargar tus planeaciones.");
            });
        return () => {
            vigente = false;
        };
    }, []);

    // Filtro lineal sobre las planeaciones del usuario: O(n).
    const visibles = useMemo(() => {
        if (!planeaciones || filtro === "todos") return planeaciones ?? [];
        return planeaciones.filter((p) => campoPorNombre(p.campo_formativo)?.id === filtro);
    }, [planeaciones, filtro]);

    return (
        <PaginaCuaderno>
            <header className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="titulo-condensado text-5xl">
                    Mis <span className="marcatexto">planeaciones</span>
                </h1>
                <Link
                    to="/planeacion/nueva"
                    className="sombra-recorte-sm flex h-12 items-center gap-2 rounded-md border-[1.5px] border-tinta bg-tinta px-5 font-bold text-white transition hover:bg-tinta-fuerte"
                >
                    <Plus size={18} aria-hidden="true" />
                    Nueva planeación
                </Link>
            </header>

            <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Filtrar por campo formativo">
                <button
                    type="button"
                    onClick={() => setFiltro("todos")}
                    aria-pressed={filtro === "todos"}
                    className={`min-h-9 rounded-full px-3.5 py-1.5 text-sm transition ${
                        filtro === "todos" ? "border-[1.5px] border-tinta bg-tinta font-bold text-white" : "border border-borde-fuerte bg-white hover:border-tinta"
                    }`}
                >
                    Todos los campos
                </button>
                {CAMPOS.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => setFiltro(c.id)}
                        aria-pressed={filtro === c.id}
                        className={`flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition ${
                            filtro === c.id ? "border-[1.5px] border-tinta bg-tinta font-bold text-white" : "border border-borde-fuerte bg-white hover:border-tinta"
                        }`}
                    >
                        <span className={`h-2.5 w-2.5 rounded-sm ${c.clases.punto}`} aria-hidden="true" />
                        {c.etiqueta}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {error && <p className="rounded-md bg-error-tinte px-4 py-3 text-sm text-error">{error}</p>}
                {!error && planeaciones === null && <p className="text-tinta-tenue">Cargando tus planeaciones...</p>}
                {!error && planeaciones?.length === 0 && (
                    <p className="rounded-lg border border-borde bg-white px-5 py-4 text-tinta-suave">
                        Aún no tienes planeaciones.{" "}
                        <Link to="/planeacion/nueva" className="font-bold underline">
                            Crea la primera
                        </Link>
                        .
                    </p>
                )}
                {planeaciones && planeaciones.length > 0 && visibles.length === 0 && (
                    <p className="text-tinta-tenue">No tienes planeaciones de este campo.</p>
                )}

                {visibles.length > 0 && (
                    <ul className="grid grid-cols-1 gap-x-4 gap-y-9 pt-6 md:grid-cols-2">
                        {visibles.map((p) => {
                            const campo = campoPorNombre(p.campo_formativo);
                            return (
                                <li key={p.id}>
                                    <Link
                                        to={`/planeacion/${p.id}`}
                                        className="relative flex h-full flex-col gap-2 rounded-b-lg rounded-tr-lg border border-borde bg-white px-5 pb-4 pt-5 transition hover:border-tinta"
                                    >
                                        <span
                                            className={`absolute -top-6 left-[-1px] flex h-6 items-center rounded-t-md px-3 text-[11px] font-bold uppercase tracking-[0.06em] text-white ${
                                                campo?.clases.fondo ?? "bg-tinta-tenue"
                                            }`}
                                        >
                                            {campo?.etiqueta ?? p.campo_formativo}
                                        </span>
                                        <span className="font-display text-lg font-bold leading-snug">{p.tema || p.contenido}</span>
                                        <span className="line-clamp-2 text-sm text-tinta-tenue">{p.contenido}</span>
                                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold">
                                            <span className="rounded bg-relleno px-2 py-0.5">
                                                {p.grado}° "{p.grupo}"
                                            </span>
                                            <span
                                                className={`rounded px-2 py-0.5 ${
                                                    p.status === "finalizada" ? "bg-etica-tinte text-etica" : "bg-marcatexto-suave text-marcatexto-texto"
                                                }`}
                                            >
                                                {p.status === "finalizada" ? "Documento generado" : p.status === "generando" ? "Generando" : "Sin documento"}
                                            </span>
                                            <span className="ml-auto font-normal text-tinta-tenue">{fechaCorta(p.created_at)}</span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </PaginaCuaderno>
    );
}
