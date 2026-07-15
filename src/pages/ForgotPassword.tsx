import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import AuthLayout from "../components/AuthLayout";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await api.forgotPassword(email);
            setEnviado(true);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    }

    if (enviado) {
        return (
            <AuthLayout>
                <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">Revisa tu correo</h1>
                <p className="mb-6 text-sm text-ink-soft">
                    Si <strong>{email}</strong> tiene una cuenta con nosotros, te llegará un link para
                    restablecer tu contraseña. El link expira en 2 horas.
                </p>
                <Link to="/login" className="text-sm font-semibold text-ink hover:underline">
                    ← Volver a iniciar sesión
                </Link>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">¿Olvidaste tu contraseña?</h1>
            <p className="mb-8 text-sm text-ink-soft">
                Escribe tu correo y te mandamos un link para restablecerla.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Correo electrónico</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@escuela.edu.mx"
                        className="rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        required
                    />
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-60"
                >
                    {loading ? "Enviando…" : "Mandar link de restablecimiento"}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-ink-soft">
                <Link to="/login" className="font-semibold text-ink hover:underline">
                    ← Volver a iniciar sesión
                </Link>
            </p>
        </AuthLayout>
    );
}