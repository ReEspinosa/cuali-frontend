import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, setToken, setUser, ApiError } from "../lib/api";
import AuthLayout from "../components/AuthLayout";

export default function VerificarCorreo() {
    const location = useLocation();
    const navigate = useNavigate();
    const email = (location.state as { email?: string } | null)?.email ?? "";

    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await api.verifyEmail(email, code);
            setToken(data.access_token);
            setUser(data.user);
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setError(null);
        setInfo(null);
        setResending(true);
        try {
            await api.resendCode(email);
            setInfo("Te reenviamos el código.");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo reenviar el código.");
        } finally {
            setResending(false);
        }
    }

    if (!email) {
        return (
            <AuthLayout>
                <p className="text-sm text-ink-soft">
                    Necesitas venir desde el registro para verificar tu correo.
                </p>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">Verifica tu correo</h1>
            <p className="mb-8 text-sm text-ink-soft">
                Te mandamos un código de 6 dígitos a <strong>{email}</strong>.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-center text-lg tracking-[0.5em] outline-none placeholder:tracking-normal placeholder:text-ink-soft focus:border-cuali-blue"
                />

                {error && <p className="text-sm text-red-600">{error}</p>}
                {info && <p className="text-sm text-cuali-blue-dark">{info}</p>}

                <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-60"
                >
                    {loading ? "Verificando…" : "Verificar"}
                </button>
            </form>

            <button
                onClick={handleResend}
                disabled={resending}
                className="mt-6 text-sm font-medium text-cuali-blue-dark hover:underline disabled:opacity-60"
            >
                {resending ? "Reenviando…" : "¿No te llegó? Reenviar código"}
            </button>
        </AuthLayout>
    );
}