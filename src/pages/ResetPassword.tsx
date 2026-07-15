import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [listo, setListo] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== passwordConfirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        try {
            await api.resetPassword(token, password, passwordConfirm);
            setListo(true);
            setTimeout(() => navigate("/login"), 2500);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <AuthLayout>
                <p className="text-sm text-ink-soft">
                    Este link no es válido. Solicita uno nuevo desde{" "}
                    <Link to="/forgot-password" className="font-semibold text-ink hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </p>
            </AuthLayout>
        );
    }

    if (listo) {
        return (
            <AuthLayout>
                <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">Contraseña actualizada</h1>
                <p className="text-sm text-ink-soft">Te vamos a mandar a iniciar sesión en un momento…</p>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">Elige tu nueva contraseña</h1>
            <p className="mb-8 text-sm text-ink-soft">Este link expira 2 horas después de haberlo solicitado.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Nueva contraseña</span>
                    <PasswordInput
                        value={password}
                        onChange={setPassword}
                        placeholder="Mínimo 8 caracteres"
                        className="rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        minLength={8}
                        required
                    />
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Confirmar nueva contraseña</span>
                    <PasswordInput
                        value={passwordConfirm}
                        onChange={setPasswordConfirm}
                        placeholder="Repite tu contraseña"
                        className="rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                        minLength={8}
                        required
                    />
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-60"
                >
                    {loading ? "Guardando…" : "Restablecer contraseña"}
                </button>
            </form>
        </AuthLayout>
    );
}