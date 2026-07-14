import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp } from "lucide-react";

/**
 * Cuali — Pantalla de autenticación (Sign up / Log in)
 * Layout de dos columnas como Discourse: panel izquierdo con el
 * formulario sobre linen, panel derecho con un blob "liquid glass"
 * difuminado en tonos azul/lavanda/sage, y un input flotante
 * mostrando una interacción de ejemplo con Cuali.
 */

type Mode = "signup" | "login";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3C33.7 32 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.8l5.1-5.1C33.2 8 28.8 6 24 6 13 6 4 15 4 26s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-5.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6 4.4C14 15.8 18.6 13 24 13c2.8 0 5.3 1 7.3 2.8l5.1-5.1C33.2 8 28.8 6 24 6c-7.7 0-14.3 4.4-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 46c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 37.1 26.7 38 24 38c-5.2 0-9.6-3-11.3-7.2l-6.2 4.8C10 41.5 16.5 46 24 46z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C40.6 35.5 44 30.7 44 26c0-1.3-.1-2.6-.4-5.5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 384 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (isSignup && password.length < 8) {
      setError("Tu contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (isSignup && !acceptTerms) {
      setError("Debes aceptar los Términos y condiciones.");
      return;
    }

    // TODO: conectar con el endpoint real de auth del backend FastAPI.
    // Por ahora navega directo al dashboard para probar el flujo.
    console.log({ mode, fullName, email, password, remember });
    navigate("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full font-sans text-ink">
      {/* Panel izquierdo — formulario */}
      <div className="flex w-full max-w-[520px] flex-col justify-center bg-linen px-16">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="mb-10 flex items-center gap-2">
            <span className="text-xl text-cuali-blue">❦</span>
            <span className="font-serif text-2xl font-semibold text-ink">Cuali</span>
          </div>

          <h1 className="mb-8 font-serif text-3xl font-semibold text-ink">
            {isSignup ? "Crea tu cuenta" : "Inicia sesión"}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isSignup && (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Nombre completo</span>
                  <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre y apellidos"
                      className="rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                      required
                  />
                </label>
            )}
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

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="rounded-xl border border-transparent bg-cuali-blue-soft px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:border-cuali-blue"
                required
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {isSignup ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-soft accent-cuali-blue"
                />
                Acepto los{" "}
                <a href="#" className="underline underline-offset-2">
                  Términos y condiciones
                </a>
              </label>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-ink-soft accent-cuali-blue"
                  />
                  Recordarme
                </label>
                <a href="#" className="text-cuali-blue-dark hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}

            <button
              type="submit"
              className="rounded-xl bg-cuali-blue py-3 text-sm font-semibold text-linen transition hover:bg-cuali-blue-dark"
            >
              {isSignup ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-soft">
            <span className="h-px flex-1 bg-black/10" />
            O continúa con
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-center gap-3 rounded-xl bg-cuali-blue-soft py-3 text-sm font-medium hover:bg-cuali-blue-light">
              <GoogleIcon />
              Iniciar sesión con Google
            </button>
            <button className="flex items-center justify-center gap-3 rounded-xl bg-cuali-blue-soft py-3 text-sm font-medium hover:bg-cuali-blue-light">
              <AppleIcon />
              Iniciar sesión con Apple
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-ink-soft">
            {isSignup ? (
              <>
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-ink hover:underline">
                  Inicia sesión
                </button>
              </>
            ) : (
              <>
                ¿No tienes cuenta?{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-ink hover:underline">
                  Regístrate
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Panel derecho — blob liquid glass */}
      <div className="relative hidden flex-1 items-center overflow-hidden bg-cuali-blue-dark md:flex">
        <div className="glass-blob glass-blob-blue" />
        <div className="glass-blob glass-blob-lavender" />
        <div className="glass-blob glass-blob-sage" />

        <div className="relative z-10 flex w-full flex-col items-start gap-10 px-20">
          <div className="flex w-full max-w-md items-center gap-3 rounded-full bg-white/85 px-6 py-4 shadow-lg backdrop-blur-xl">
            <span className="flex-1 text-sm text-ink">Ayúdame a planear mi próxima clase</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cuali-blue-dark text-white">
              <ArrowUp size={16} />
            </span>
          </div>

          <h2 className="font-serif text-5xl font-medium leading-tight text-white">
            Tu compañera
            <br />
            en el salón de clases
          </h2>
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
