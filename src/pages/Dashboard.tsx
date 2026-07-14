import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, NotebookPen, BookOpen, Users } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getUser } from "../lib/api";

const QUICK_ACCESS = [
    {
        id: "chat",
        label: "Chatbot",
        note: "Habla con Cuali",
        description: "Resuelve dudas rápidas sobre NEM, evaluación o cualquier tema del aula.",
        icon: MessageCircle,
        to: "/chat",
    },
    {
        id: "planeacion",
        label: "Planeaciones",
        note: "6 activas",
        description: "Crea una planeación nueva alineada al campo formativo y PDA que elijas.",
        icon: NotebookPen,
        to: "/planeacion/nueva",
    },
    {
        id: "recursos",
        label: "Recursos",
        note: "128 disponibles",
        description: "Explora fichas, láminas y materiales listos para usar en tu salón.",
        icon: BookOpen,
        to: "/recursos",
    },
    {
        id: "comunidad",
        label: "Comunidad",
        note: "12 publicaciones nuevas",
        description: "Comparte y descubre ideas de otras maestras y maestros de primaria.",
        icon: Users,
        to: "/comunidad",
    },
];

function getFechaCDMX() {
    const raw = new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "America/Mexico_City",
    }).format(new Date());
    return raw.replace(",", "").toUpperCase();
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<"intro" | "home">("intro");
    const user = getUser();
    const primerNombre = user?.nombre ?? "";

    useEffect(() => {
        const t = setTimeout(() => setPhase("home"), 1500);
        return () => clearTimeout(t);
    }, []);

    const isHome = phase === "home";

    return (
        <div
            className={`relative flex min-h-screen overflow-hidden font-sans transition-colors duration-700 ${
                isHome ? "bg-white" : "bg-cuali-blue-dark"
            }`}
        >
            {isHome && (
                <div className="animate-[fadeIn_0.5s_ease-out]">
                    <Sidebar />
                </div>
            )}

            <div className="relative flex-1 overflow-hidden">
                {/* Blobs azules difuminados del fondo blanco — 10 en total */}
                <div
                    className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
                        isHome ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                >
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`bg-blob bg-blob-${i}`} />
                    ))}
                </div>

                {/* Blobs de la intro (azul/lavanda/sage) — se desvanecen al pasar a "home" */}
                <div
                    className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
                        isHome ? "opacity-0" : "opacity-100"
                    }`}
                >
                    <div className="glass-blob glass-blob-blue" />
                    <div className="glass-blob glass-blob-lavender" />
                    <div className="glass-blob glass-blob-sage" />
                </div>

                {/* Título grande "Cuali.ai" — solo durante la intro */}
                <div
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                        isHome ? "opacity-0" : "opacity-100"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-4xl text-white">❦</span>
                        <span className="font-serif text-6xl font-semibold text-white">Cuali.ai</span>
                    </div>
                </div>

                {/* Contenido de inicio */}
                <div
                    className={`relative z-10 mx-auto max-w-5xl px-10 pt-16 transition-all duration-700 ${
                        isHome ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                >
                    <p className="text-sm uppercase tracking-wide text-ink-soft">{getFechaCDMX()}</p>
                    <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
                        ¿Qué quieres hacer hoy{primerNombre ? `, ${primerNombre}` : ""}?
                    </h1>
                    <p className="mt-2 max-w-xl text-sm text-ink-soft">
                        Desde aquí puedes platicar con Cuali, armar tu próxima planeación, revisar
                        recursos listos para usar, o ver qué comparte la comunidad docente.
                    </p>

                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {QUICK_ACCESS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.to)}
                                    className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-black/5 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                                        <div className="card-blob card-blob-1" />
                                        <div className="card-blob card-blob-2" />
                                    </div>

                                    <div className="relative z-10 flex items-center gap-4">
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-cuali-blue-soft text-cuali-blue-dark">
                      <Icon size={22} />
                    </span>
                                        <span>
                      <span className="block font-serif text-lg font-semibold text-ink">{item.label}</span>
                      <span className="block text-xs font-medium text-cuali-blue-dark">{item.note}</span>
                    </span>
                                    </div>

                                    <p className="relative z-10 text-sm text-ink-soft">{item.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .glass-blob { position: absolute; border-radius: 9999px; filter: blur(90px); }
        .glass-blob-blue { width: 480px; height: 480px; top: -120px; left: 10%; background: var(--blue-light); opacity: 0.55; }
        .glass-blob-lavender { width: 420px; height: 420px; bottom: -100px; right: 5%; background: var(--lavender); opacity: 0.45; }
        .glass-blob-sage { width: 360px; height: 360px; bottom: 10%; left: 25%; background: var(--sage); opacity: 0.3; }

        .bg-blob { position: absolute; border-radius: 9999px; background: var(--blue-light); filter: blur(70px); }
        .bg-blob-0 { width: 260px; height: 260px; top: -80px; left: 5%; opacity: 0.35; }
        .bg-blob-1 { width: 200px; height: 200px; top: 10%; right: 15%; opacity: 0.25; background: var(--lavender); }
        .bg-blob-2 { width: 300px; height: 300px; top: 25%; left: 40%; opacity: 0.2; }
        .bg-blob-3 { width: 180px; height: 180px; top: 5%; left: 60%; opacity: 0.3; }
        .bg-blob-4 { width: 220px; height: 220px; top: 45%; right: 5%; opacity: 0.25; background: var(--sage); }
        .bg-blob-5 { width: 260px; height: 260px; bottom: -60px; left: 15%; opacity: 0.3; }
        .bg-blob-6 { width: 200px; height: 200px; bottom: 10%; right: 30%; opacity: 0.2; }
        .bg-blob-7 { width: 240px; height: 240px; bottom: -80px; right: -60px; opacity: 0.3; background: var(--lavender); }
        .bg-blob-8 { width: 180px; height: 180px; top: 55%; left: 5%; opacity: 0.22; }
        .bg-blob-9 { width: 220px; height: 220px; bottom: 30%; left: 55%; opacity: 0.18; background: var(--sage); }

        .card-blob { position: absolute; border-radius: 9999px; filter: blur(50px); background: var(--blue-light); }
        .card-blob-1 { width: 140px; height: 140px; top: -50px; right: -40px; opacity: 0.3; }
        .card-blob-2 { width: 110px; height: 110px; bottom: -40px; left: -30px; opacity: 0.25; }
      `}</style>
        </div>
    );
}