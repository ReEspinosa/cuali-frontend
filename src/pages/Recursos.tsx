import Sidebar from "../components/Sidebar";

export default function Recursos() {
    return (
        <div className="flex min-h-screen bg-white font-sans text-ink">
            <Sidebar />
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <p className="mb-2 text-xl text-cuali-blue">❦</p>
                    <h1 className="font-serif text-2xl font-semibold">Recursos — próximamente</h1>
                </div>
            </div>
        </div>
    );
}