/**
 * Los cuatro campos formativos de la NEM y su identidad visual.
 *
 * `nombre` debe coincidir EXACTAMENTE con `campo_formativo` del catalogo
 * (src/data/nem/*.json), porque se usa para buscar sus contenidos y se
 * guarda tal cual en la planeacion.
 *
 * Las clases de Tailwind se escriben completas (no se arman con plantillas)
 * para que Tailwind las detecte al compilar.
 */

import type { MetodologiaId } from "./api";

export type CampoId = "lenguajes" | "saberes" | "etica" | "comunitario";

/**
 * Metodologias sociocriticas de la NEM. La SEP sugiere una por campo, pero
 * no la impone: la docente puede elegir cualquiera. Las fases las pone el
 * backend (app/services/planeacion_nem/metodologias.py).
 */
export const METODOLOGIAS: { id: MetodologiaId; nombre: string; fases: string; nFases: number }[] = [
    {
        id: "proyectos_comunitarios",
        nombre: "Aprendizaje basado en proyectos comunitarios",
        fases: "Planeación, acción e intervención",
        // 3 fases con 11 momentos en total; con 5 sesiones o mas se cubren bien.
        nFases: 5,
    },
    {
        id: "indagacion_steam",
        nombre: "Aprendizaje basado en indagación (STEAM)",
        fases: "Introducción, diseño de la investigación, respuestas, resultados y metacognición",
        nFases: 5,
    },
    {
        id: "abp",
        nombre: "Aprendizaje basado en problemas",
        fases: "Presentemos, recolectemos, formulemos el problema, organicemos, vivamos la experiencia y resultados",
        nFases: 6,
    },
    {
        id: "aprendizaje_servicio",
        nombre: "Aprendizaje servicio",
        fases: "Punto de partida, lo que sé, organicemos, creatividad en marcha y compartimos",
        nFases: 5,
    },
];

/** O(4). */
export function metodologiaPorId(id: MetodologiaId) {
    return METODOLOGIAS.find((m) => m.id === id) ?? METODOLOGIAS[0];
}

export type Campo = {
    id: CampoId;
    nombre: string;
    etiqueta: string;
    descripcion: string;
    /** Metodologia que sugiere la SEP para este campo. */
    metodologia: MetodologiaId;
    clases: {
        fondo: string;
        tinte: string;
        texto: string;
        borde: string;
        punto: string;
    };
};

export const CAMPOS: Campo[] = [
    {
        id: "lenguajes",
        nombre: "Lenguajes",
        etiqueta: "Lenguajes",
        descripcion: "Español, lenguas indígenas, inglés y artes.",
        metodologia: "proyectos_comunitarios",
        clases: {
            fondo: "bg-lenguajes",
            tinte: "bg-lenguajes-tinte",
            texto: "text-lenguajes",
            borde: "border-lenguajes",
            punto: "bg-lenguajes",
        },
    },
    {
        id: "saberes",
        nombre: "Saberes y Pensamiento Científico",
        etiqueta: "Saberes",
        descripcion: "Matemáticas y ciencias naturales.",
        metodologia: "indagacion_steam",
        clases: {
            fondo: "bg-saberes",
            tinte: "bg-saberes-tinte",
            texto: "text-saberes",
            borde: "border-saberes",
            punto: "bg-saberes",
        },
    },
    {
        id: "etica",
        nombre: "Ética, Naturaleza y Sociedades",
        etiqueta: "Ética",
        descripcion: "Historia, geografía y formación cívica y ética.",
        metodologia: "abp",
        clases: {
            fondo: "bg-etica",
            tinte: "bg-etica-tinte",
            texto: "text-etica",
            borde: "border-etica",
            punto: "bg-etica",
        },
    },
    {
        id: "comunitario",
        nombre: "De lo Humano y lo Comunitario",
        etiqueta: "Comunitario",
        descripcion: "Educación física, vida saludable y educación socioemocional.",
        metodologia: "aprendizaje_servicio",
        clases: {
            fondo: "bg-comunitario",
            tinte: "bg-comunitario-tinte",
            texto: "text-comunitario",
            borde: "border-comunitario",
            punto: "bg-comunitario",
        },
    },
];

export const EJES_ARTICULADORES = [
    "Inclusión",
    "Pensamiento crítico",
    "Interculturalidad crítica",
    "Igualdad de género",
    "Vida saludable",
    "Apropiación de las culturas a través de la lectura y la escritura",
    "Artes y experiencias estéticas",
];

/** Busca un campo por su nombre del catalogo. O(4). */
export function campoPorNombre(nombre: string | null | undefined): Campo | undefined {
    if (!nombre) return undefined;
    const buscado = nombre.trim().toLowerCase();
    return CAMPOS.find((c) => c.nombre.toLowerCase() === buscado);
}
