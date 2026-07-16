import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";

export default function MapasMentales() {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-white font-sans text-ink">
            <Sidebar />
            <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-10">
                <button
                    onClick={() => navigate("/recursos")}
                    className="absolute left-10 top-10 flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
                >
                    <ArrowLeft size={16} />
                    Volver a Recursos
                </button>
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cuali-blue-soft text-cuali-blue-dark">
                    <Share2 size={28} />
                </span>
                <h1 className="font-serif text-2xl font-semibold text-ink">Próximamente</h1>
                <p className="max-w-sm text-center text-sm text-ink-soft">
                    Esta sección está en construcción. Pronto vas a poder crear este recurso platicando con Cuali.
                </p>
            </div>
        </div>
    );
}
