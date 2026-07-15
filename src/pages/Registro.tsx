import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";

const fieldClass =
    "rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue";

export default function Registro() {
    const navigate = useNavigate();

    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [rol, setRol] = useState("");
    const [tipoEscuela, setTipoEscuela] = useState("");
    const [genero, setGenero] = useState("");
    const [gradoImparte, setGradoImparte] = useState("");
    const [nombreEscuela, setNombreEscuela] = useState("");
    const [estado, setEstado] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== passwordConfirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        try {
            await api.register({
                nombre,
                apellido,
                email,
                password,
                password_confirm: passwordConfirm,
                rol,
                tipo_escuela: tipoEscuela,
                genero,
                grado_imparte: gradoImparte || undefined,
                nombre_escuela: nombreEscuela || undefined,
                estado: estado || undefined,
            });

            navigate("/verificar", { state: { email } });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout formMaxWidth="max-w-xl">
            <h1 className="mb-1 font-serif text-3xl font-semibold text-ink">Crea tu cuenta</h1>
            <p className="mb-8 text-sm text-ink-soft">
                Te vamos a mandar un código de verificación a tu correo.
            </p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Nombre</span>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={fieldClass} required />
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Apellido</span>
                    <input value={apellido} onChange={(e) => setApellido(e.target.value)} className={fieldClass} required />
                </label>

                <label className="flex flex-col gap-2 sm:col-span-2">
                    <span className="text-sm font-medium">Correo electrónico</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@escuela.edu.mx"
                        className={fieldClass}
                        required
                    />
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Contraseña</span>
                    <PasswordInput value={password} onChange={setPassword} className={fieldClass} minLength={8} required />
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Confirmar contraseña</span>
                    <PasswordInput
                        value={passwordConfirm}
                        onChange={setPasswordConfirm}
                        className={fieldClass}
                        minLength={8}
                        required
                    />
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Rol</span>
                    <select value={rol} onChange={(e) => setRol(e.target.value)} className={fieldClass} required>
                        <option value="">Selecciona una opción</option>
                        <option value="maestro">Maestro/a</option>
                        <option value="director">Director/a</option>
                        <option value="estudiante">Estudiante</option>
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Tipo de escuela</span>
                    <select value={tipoEscuela} onChange={(e) => setTipoEscuela(e.target.value)} className={fieldClass} required>
                        <option value="">Selecciona una opción</option>
                        <option value="publica">Pública</option>
                        <option value="privada">Privada</option>
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Género</span>
                    <select value={genero} onChange={(e) => setGenero(e.target.value)} className={fieldClass} required>
                        <option value="">Selecciona una opción</option>
                        <option value="mujer">Mujer</option>
                        <option value="hombre">Hombre</option>
                        <option value="prefiero_no_decirlo">Prefiero no decirlo</option>
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Grado que impartes (opcional)</span>
                    <select value={gradoImparte} onChange={(e) => setGradoImparte(e.target.value)} className={fieldClass}>
                        <option value="">No aplica</option>
                        {[1, 2, 3, 4, 5, 6].map((g) => (
                            <option key={g} value={g}>{g}°</option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Nombre de la escuela (opcional)</span>
                    <input value={nombreEscuela} onChange={(e) => setNombreEscuela(e.target.value)} className={fieldClass} />
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Estado (opcional)</span>
                    <input value={estado} onChange={(e) => setEstado(e.target.value)} className={fieldClass} />
                </label>

                {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark disabled:opacity-60 sm:col-span-2"
                >
                    {loading ? "Creando cuenta…" : "Crear cuenta"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="font-semibold text-ink hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </AuthLayout>
    );
}