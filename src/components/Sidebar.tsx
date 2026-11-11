import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Book, File, Home, MessageCircle, Users, type LucideIcon } from "lucide-react";
import { getUser } from "../lib/api";
import Logo from "./Logo";
import PerfilModal from "./PerfilModal";

type Modulo = {
    label: string;
    icon: LucideIcon;
    to: string;
    /** Prefijos de ruta que marcan este modulo como activo. */
    prefijos: string[];
};

const MODULOS: Modulo[] = [
    { label: "Inicio", icon: Home, to: "/dashboard", prefijos: ["/dashboard", "/recursos", "/materiales"] },
    { label: "Chat con Cuali", icon: MessageCircle, to: "/chat", prefijos: ["/chat"] },
    { label: "Mis planeaciones", icon: File, to: "/planeaciones", prefijos: ["/planeacion"] },
    { label: "Libros de texto SEP", icon: Book, to: "/biblioteca", prefijos: ["/biblioteca"] },
    { label: "Comunidad docente", icon: Users, to: "/comunidad", prefijos: ["/comunidad"] },
];

export default function Sidebar() {
    const location = useLocation();
    const user = getUser();
    const [perfilAbierto, setPerfilAbierto] = useState(false);

    const nombre = user ? `${user.nombre} ${user.apellido}` : "Docente";
    const iniciales = user ? `${user.nombre[0] ?? ""}${user.apellido[0] ?? ""}`.toUpperCase() : "";

    return (
        <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col border-r border-borde bg-white px-3 py-7">
            <div className="mb-8 px-4">
                <Logo className="text-[32px]" />
            </div>

            <nav aria-label="Principal" className="flex flex-1 flex-col gap-1.5">
                {MODULOS.map((m) => {
                    const activo = m.prefijos.some((p) => location.pathname.startsWith(p));
                    const Icon = m.icon;
                    return (
                        <NavLink
                            key={m.to}
                            to={m.to}
                            aria-current={activo ? "page" : undefined}
                            className={`flex h-12 items-center gap-4 rounded-lg px-4 text-[15px] transition ${
                                activo
                                    ? "bg-marcatexto-suave font-display font-extrabold text-tinta"
                                    : "text-tinta-suave hover:bg-relleno hover:text-tinta"
                            }`}
                        >
                            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                            <span className="truncate">{m.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Acceso al perfil y al cierre de sesion. */}
            <button
                type="button"
                onClick={() => setPerfilAbierto(true)}
                className="flex items-center gap-3 rounded-lg px-4 py-2 text-left transition hover:bg-relleno"
            >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-tinta text-sm font-bold text-white">
                    {iniciales}
                </span>
                <span className="min-w-0 truncate text-sm font-bold text-tinta">{nombre}</span>
            </button>

            {perfilAbierto && <PerfilModal onClose={() => setPerfilAbierto(false)} />}
        </aside>
    );
}
