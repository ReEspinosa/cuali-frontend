import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

type Props = {
    children: ReactNode;
    /** Ancho maximo del contenido. "completo" para chats y pantallas de trabajo. */
    ancho?: "normal" | "amplio" | "completo";
    /** Sin desplazamiento propio: el hijo maneja su scroll (chats). */
    sinScroll?: boolean;
};

const ANCHOS = {
    normal: "max-w-4xl",
    amplio: "max-w-6xl",
    completo: "max-w-none",
};

/**
 * Estructura comun de las pantallas: menu lateral y hoja de cuaderno
 * (cuadricula con margen rojo). El contenido arranca despues del margen.
 */
export default function PaginaCuaderno({ children, ancho = "normal", sinScroll = false }: Props) {
    return (
        <div className="fixed inset-0 flex overflow-hidden bg-papel font-sans text-tinta">
            <Sidebar />
            <main
                className={`hoja-cuaderno min-w-0 flex-1 ${sinScroll ? "flex flex-col overflow-hidden" : "overflow-y-auto"}`}
            >
                {sinScroll ? (
                    children
                ) : (
                    <div className={`mx-auto w-full ${ANCHOS[ancho]} py-10 pl-16 pr-6 md:pl-24 md:pr-12`}>
                        {children}
                    </div>
                )}
            </main>
        </div>
    );
}
