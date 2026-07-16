import { useNavigate } from "react-router-dom";
import { Presentation, ClipboardList, Share2, Gamepad2, Image as ImageIcon, FlaskConical } from "lucide-react";
import Sidebar from "../components/Sidebar";

const OPCIONES = [
    {
        id: "diapositivas",
        label: "Diapositivas",
        description: "Genera una presentación lista para proyectar en clase.",
        icon: Presentation,
        to: "/recursos/diapositivas",
    },
    {
        id: "cuestionarios",
        label: "Cuestionarios",
        description: "Crea preguntas de opción múltiple, verdadero/falso o abiertas.",
        icon: ClipboardList,
        to: "/recursos/cuestionarios",
    },
    {
        id: "mapas-mentales",
        label: "Mapas mentales",
        description: "Organiza un tema en un mapa visual para tus alumnos.",
        icon: Share2,
        to: "/recursos/mapas-mentales",
    },
    {
        id: "juegos",
        label: "Juegos didácticos",
        description: "Memoramas, loterías y dinámicas para reforzar un tema jugando.",
        icon: Gamepad2,
        to: "/recursos/juegos",
    },
    {
        id: "carteles",
        label: "Carteles e infografías",
        description: "Material visual para imprimir y pegar en el salón.",
        icon: ImageIcon,
        to: "/recursos/carteles",
    },
    {
        id: "laboratorio",
        label: "Laboratorio",
        description: "Platica con Cuali y construye cualquier otro recurso que se te ocurra.",
        icon: FlaskConical,
        to: "/recursos/laboratorio",
    },
];

export default function Recursos() {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                    <div className="content-blob content-blob-4" />
                    <div className="content-blob content-blob-5" />
                </div>

                <div className="relative z-10 mx-auto max-w-5xl px-10 py-14">
                    <h1 className="font-serif text-3xl font-semibold text-ink">Recursos</h1>
                    <p className="mt-2 max-w-xl text-sm text-ink-soft">
                        Elige qué quieres crear para tu clase. Cuali te va a ir guiando paso a paso, igual que en tus
                        planeaciones.
                    </p>

                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {OPCIONES.map((op) => {
                            const Icon = op.icon;
                            return (
                                <button
                                    key={op.id}
                                    onClick={() => navigate(op.to)}
                                    className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-cuali-blue p-6 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                                        <div className="btn-blob btn-blob-1" />
                                        <div className="btn-blob btn-blob-2" />
                                        <div className="btn-blob btn-blob-3" />
                                    </div>

                                    <div className="relative z-10 flex items-center gap-4">
                                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
                                            <Icon size={22} />
                                        </span>
                                        <span className="font-serif text-lg font-semibold text-white">{op.label}</span>
                                    </div>

                                    <p className="relative z-10 text-sm text-white/85">{op.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <style>{`
          .content-blob { position: absolute; border-radius: 9999px; filter: blur(60px); }
          .content-blob-1 { width: 400px; height: 400px; top: -120px; right: -60px; background: var(--blue); opacity: 0.35; }
          .content-blob-2 { width: 320px; height: 320px; top: 22%; right: 8%; background: var(--blue-light); opacity: 0.6; }
          .content-blob-3 { width: 360px; height: 360px; bottom: -100px; left: 4%; background: var(--blue); opacity: 0.3; }
          .content-blob-4 { width: 280px; height: 280px; top: 55%; left: -60px; background: var(--blue-light); opacity: 0.55; }
          .content-blob-5 { width: 260px; height: 260px; bottom: 10%; right: -60px; background: var(--blue); opacity: 0.3; }

          .btn-blob { position: absolute; border-radius: 9999px; filter: blur(35px); background: white; }
          .btn-blob-1 { width: 160px; height: 160px; top: -60px; right: -50px; opacity: 0.22; }
          .btn-blob-2 { width: 120px; height: 120px; bottom: -50px; left: -30px; opacity: 0.18; }
          .btn-blob-3 { width: 90px; height: 90px; top: 40%; right: 20%; opacity: 0.14; }
        `}</style>
            </div>
        </div>
    );
}