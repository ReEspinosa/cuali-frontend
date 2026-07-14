import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, NotebookPen, BookOpen, Users } from "lucide-react";
import Sidebar from "../components/Sidebar";

const QUICK_ACCESS = [
    {
        id: "chat",
        label: "Chatbot",
        note: "Habla con Cuali",
        icon: MessageCircle,
        to: "/chat",
    },
    {
        id: "planeacion",
        label: "Planeaciones",
        note: "6 activas",
        icon: NotebookPen,
        to: "/planeacion/nueva",
    },
    {
        id: "recursos",
        label: "Recursos",
        note: "128 disponibles",
        icon: BookOpen,
        to: "/recursos",
    },
    {
        id: "comunidad",
        label: "Comunidad",
        note: "12 publicaciones nuevas",
        icon: Users,
        to: "/comunidad",
    },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<"intro" | "home">("intro");

    useEffect(() => {
        const t = setTimeout(() => setPhase("home"), 1500);
        return () => clearTimeout(t);
    }, []);

    const isHome = phase === "home";

    return (
        <div
            className={`relative flex min-h-screen overflow-hidden font-sans transition-colors duration-700 ${
                isHome ? "bg-linen" : "bg-cuali-blue-dark"
            }`}
        >
            {/* Sidebar — solo aparece una vez que termina la intro */}
            <div
                className={`transition-opacity duration-700 ${
                    isHome ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            >
                <Sidebar />
            </div>

            <div className="relative flex-1">
                {/* Blobs liquid glass — se desvanecen al pasar a "home" */}
                <div
                    className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
                        isHome ? "opacity-0" : "opacity-100"
                    }`}
                >
                    <div className="glass-blob glass-blob-blue" />
                    <div className="glass-blob glass-blob-lavender" />
                    <div className="glass-blob glass-blob-sage" />
                </div>

                {/* Título "Cuali.ai" — centrado en intro, header pequeño en home */}
                <div
                    className={`absolute z-20 flex items-center gap-2 transition-all duration-700 ease-out ${
                        isHome
                            ? "left-10 top-8 scale-100"
                            : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-100"
                    }`}
                >
          <span className={`transition-all duration-700 ${isHome ? "text-lg text-cuali-blue" : "text-4xl text-white"}`}>
            ❦
          </span>
                    <span
                        className={`font-serif font-semibold transition-all duration-700 ${
                            isHome ? "text-xl text-ink" : "text-6xl text-white"
                        }`}
                    >
            Cuali.ai
          </span>
                </div>

                {/* Contenido de inicio — entra después de la intro */}
                <div
                    className={`relative z-10 mx-auto max-w-5xl px-10 pt-28 transition-all duration-700 ${
                        isHome ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                >
                    <p className="text-sm uppercase tracking-wide text-ink-soft">Martes 14 de julio</p>
                    <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
                        ¿Qué quieres hacer hoy, Mtra. Rosa?
                    </h1>

                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {QUICK_ACCESS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.to)}
                                    className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cuali-blue-soft text-cuali-blue-dark">
                    <Icon size={22} />
                  </span>
                                    <span>
                    <span className="block font-serif text-lg font-semibold text-ink">{item.label}</span>
                    <span className="block text-sm text-ink-soft">{item.note}</span>
                  </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
        .glass-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
        }
        .glass-blob-blue {
          width: 480px; height: 480px;
          top: -120px; left: 10%;
          background: var(--blue-light);
          opacity: 0.55;
        }
        .glass-blob-lavender {
          width: 420px; height: 420px;
          bottom: -100px; right: 5%;
          background: var(--lavender);
          opacity: 0.45;
        }
        .glass-blob-sage {
          width: 360px; height: 360px;
          bottom: 10%; left: 25%;
          background: var(--sage);
          opacity: 0.3;
        }
      `}</style>
        </div>
    );
}