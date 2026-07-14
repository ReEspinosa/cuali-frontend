import { useNavigate, useLocation } from "react-router-dom";

const MODULES = [
    { id: "dashboard", label: "Dashboard", icon: "◆", color: "var(--cuali-blue-light)", to: "/dashboard" },
    { id: "chat", label: "Chat con Cuali", icon: "✳", color: "var(--cuali-blue-light)", to: "/chat" },
    { id: "planeacion", label: "Nueva Planeación", icon: "✎", color: "var(--sage)", to: "/planeacion/nueva" },
    { id: "biblioteca", label: "Mi Biblioteca", icon: "▤", color: "var(--amber, #D9A441)", to: "/biblioteca" },
    { id: "comunidad", label: "Comunidad", icon: "❁", color: "var(--coral, #E1604C)", to: "/comunidad" },
    { id: "materiales", label: "Mis Materiales", icon: "▧", color: "var(--rose, #C98A96)", to: "/materiales" },
    { id: "recursos", label: "Recursos", icon: "◈", color: "var(--berry, #6B2737)", to: "/recursos" },
    { id: "diapositivas", label: "Diapositivas", icon: "▥", color: "var(--berry-light, #9C5D6B)", to: "/diapositivas" },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className="relative flex w-72 flex-shrink-0 flex-col overflow-hidden bg-cuali-blue-dark px-5 py-7">
            {/* Blobs liquid glass — igual que en el login, contenidos dentro del sidebar */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="sidebar-blob sidebar-blob-blue" />
                <div className="sidebar-blob sidebar-blob-lavender" />
                <div className="sidebar-blob sidebar-blob-sage" />
            </div>

            <div className="relative z-10 mb-9 flex items-center gap-2 px-2">
                <span className="text-xl text-cuali-blue-light">❦</span>
                <span className="font-serif text-xl font-semibold text-linen">Cuali</span>
            </div>

            <nav className="relative z-10 flex flex-1 flex-col gap-1">
                {MODULES.map((m) => {
                    const isActive = location.pathname.startsWith(m.to);
                    return (
                        <button
                            key={m.id}
                            onClick={() => navigate(m.to)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium backdrop-blur-sm transition ${
                                isActive
                                    ? "bg-white/14 text-linen shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                                    : "text-linen/65 hover:bg-white/8 hover:text-linen"
                            }`}
                        >
              <span className="w-4 text-center text-sm" style={{ color: m.color }}>
                {m.icon}
              </span>
                            {m.label}
                        </button>
                    );
                })}
            </nav>

            <div className="relative z-10 flex items-center gap-2 border-t border-white/10 px-2 pt-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cuali-blue-light text-xs font-semibold text-cuali-blue-dark">
                    MR
                </div>
                <div>
                    <div className="text-sm font-semibold text-linen">Mtra. Rosa</div>
                    <div className="text-xs text-linen/60">3° Primaria</div>
                </div>
            </div>

            <style>{`
        .sidebar-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
        }
        .sidebar-blob-blue {
          width: 320px; height: 320px;
          top: -100px; left: -60px;
          background: var(--blue-light);
          opacity: 0.5;
        }
        .sidebar-blob-lavender {
          width: 280px; height: 280px;
          bottom: 20%; right: -100px;
          background: var(--lavender);
          opacity: 0.4;
        }
        .sidebar-blob-sage {
          width: 240px; height: 240px;
          bottom: -80px; left: 10%;
          background: var(--sage);
          opacity: 0.3;
        }
      `}</style>
        </aside>
    );
}