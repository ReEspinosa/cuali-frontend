import { useNavigate } from "react-router-dom";
import { ChevronLeft, Grid3x3, Type, RotateCw, PersonStanding, CircleDot, CheckCircle2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";

const JUEGOS = [
    { id: "memorama", label: "Memorama", description: "Encuentra los pares de concepto y definición.", icon: Grid3x3, to: "/recursos/juegos/memorama" },
    { id: "sopa-de-letras", label: "Sopa de letras", description: "Encuentra las palabras escondidas en la cuadrícula.", icon: Type, to: "/recursos/juegos/sopa-de-letras" },
    { id: "crucigrama", label: "Crucigrama", description: "Resuelve las pistas y completa el crucigrama.", icon: RotateCw, to: "/recursos/juegos/crucigrama" },
    { id: "ruleta", label: "Ruleta de preguntas", description: "Gira la ruleta y responde para ganar puntos.", icon: CircleDot, to: "/recursos/juegos/ruleta" },
    { id: "ahorcado", label: "Ahorcado", description: "Adivina la palabra letra por letra.", icon: PersonStanding, to: "/recursos/juegos/ahorcado" },
    { id: "verdadero-falso", label: "Verdadero o Falso", description: "Responde rápido antes de que se acabe el tiempo.", icon: CheckCircle2, to: "/recursos/juegos/verdadero-falso" },
];

export default function Juegos() {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />

            <div className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="content-blob content-blob-1" />
                    <div className="content-blob content-blob-2" />
                    <div className="content-blob content-blob-3" />
                </div>

                <div className="relative z-10 mx-auto max-w-5xl px-10 py-14">
                    <button
                        onClick={() => navigate("/recursos")}
                        className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                    >
                        <ChevronLeft size={16} />
                        Volver a Recursos
                    </button>

                    <h1 className="font-serif text-3xl font-semibold text-ink">Juegos didácticos</h1>
                    <p className="mt-2 max-w-xl text-sm text-ink-soft">
                        Elige un juego, dile a Cuali el tema, y arma la dinámica al instante.
                    </p>

                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {JUEGOS.map((j) => {
                            const Icon = j.icon;
                            return (
                                <button
                                    key={j.id}
                                    onClick={() => navigate(j.to)}
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
                                        <span className="font-serif text-lg font-semibold text-white">{j.label}</span>
                                    </div>

                                    <p className="relative z-10 text-sm text-white/85">{j.description}</p>
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

          .btn-blob { position: absolute; border-radius: 9999px; filter: blur(35px); background: white; }
          .btn-blob-1 { width: 160px; height: 160px; top: -60px; right: -50px; opacity: 0.22; }
          .btn-blob-2 { width: 120px; height: 120px; bottom: -50px; left: -30px; opacity: 0.18; }
          .btn-blob-3 { width: 90px; height: 90px; top: 40%; right: 20%; opacity: 0.14; }
        `}</style>
            </div>
        </div>
    );
}