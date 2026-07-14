import { useEffect, useState, type ReactNode } from "react";
import { ArrowUp } from "lucide-react";

function TypewriterBubble() {
    const fullText = "Ayúdame a planear mi próxima clase";
    const [text, setText] = useState("");
    const [phase, setPhase] = useState<"typing" | "pausing" | "deleting" | "waiting">("typing");

    useEffect(() => {
        let timeout: number;

        if (phase === "typing") {
            if (text.length < fullText.length) {
                timeout = window.setTimeout(() => setText(fullText.slice(0, text.length + 1)), 55);
            } else {
                timeout = window.setTimeout(() => setPhase("pausing"), 1600);
            }
        } else if (phase === "pausing") {
            timeout = window.setTimeout(() => setPhase("deleting"), 900);
        } else if (phase === "deleting") {
            if (text.length > 0) {
                timeout = window.setTimeout(() => setText(fullText.slice(0, text.length - 1)), 25);
            } else {
                timeout = window.setTimeout(() => setPhase("waiting"), 500);
            }
        } else if (phase === "waiting") {
            timeout = window.setTimeout(() => setPhase("typing"), 400);
        }

        return () => window.clearTimeout(timeout);
    }, [text, phase, fullText]);

    return (
        <div className="flex w-full max-w-md items-center gap-3 rounded-full bg-white/85 px-6 py-4 shadow-lg backdrop-blur-xl">
      <span className="flex-1 text-sm text-ink">
        {text}
          <span className="typewriter-cursor">|</span>
      </span>
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cuali-blue-dark text-white">
        <ArrowUp size={16} />
      </span>
        </div>
    );
}

type Props = {
    children: ReactNode;
    formMaxWidth?: string; // ej. "max-w-[380px]" o "max-w-xl"
};

export default function AuthLayout({ children, formMaxWidth = "max-w-[380px]" }: Props) {
    return (
        <div className="flex min-h-screen w-full font-sans text-ink">
            {/* Panel izquierdo — blanco con círculos azules difuminados */}
            <div className="relative flex w-full md:w-1/2 flex-col overflow-hidden bg-white px-16 py-10">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`auth-blob auth-blob-${i}`} />
                    ))}
                </div>

                <div className="relative z-10 flex items-center gap-2">
                    <span className="text-xl text-cuali-blue">❦</span>
                    <span className="font-serif text-2xl font-semibold text-ink">Cuali</span>
                </div>

                <div className="relative z-10 flex flex-1 items-center">
                    <div className={`mx-auto w-full ${formMaxWidth}`}>{children}</div>
                </div>
            </div>

            {/* Panel derecho — azul, con blobs en movimiento constante */}
            <div className="relative hidden md:flex md:w-1/2 items-center overflow-hidden bg-cuali-blue-dark">
                <div className="glass-blob glass-blob-blue" />
                <div className="glass-blob glass-blob-lavender" />
                <div className="glass-blob glass-blob-sage" />

                <div className="relative z-10 flex w-full flex-col items-start gap-10 px-20">
                    <TypewriterBubble />

                    <h2 className="animate-float font-serif text-5xl font-medium leading-tight text-white">
                        Tu compañera
                        <br />
                        en el salón de clases
                    </h2>
                </div>
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        .animate-float { animation: float 4.5s ease-in-out infinite; }

        .typewriter-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }

        .glass-blob { position: absolute; border-radius: 9999px; filter: blur(90px); }
        .glass-blob-blue {
          width: 480px; height: 480px; top: -120px; left: 10%;
          background: var(--blue-light); opacity: 0.55;
          animation: driftBlue 10s ease-in-out infinite;
        }
        .glass-blob-lavender {
          width: 420px; height: 420px; bottom: -100px; right: 5%;
          background: var(--lavender); opacity: 0.45;
          animation: driftLavender 13s ease-in-out infinite;
        }
        .glass-blob-sage {
          width: 360px; height: 360px; bottom: 10%; left: 25%;
          background: var(--sage); opacity: 0.3;
          animation: driftSage 16s ease-in-out infinite;
        }
        @keyframes driftBlue {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.08); }
        }
        @keyframes driftLavender {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -25px) scale(1.1); }
        }
        @keyframes driftSage {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -35px) scale(0.95); }
        }

        .auth-blob { position: absolute; border-radius: 9999px; background: var(--blue-light); filter: blur(65px); }
        .auth-blob-0 { width: 220px; height: 220px; top: -60px; left: 5%; opacity: 0.3; }
        .auth-blob-1 { width: 180px; height: 180px; top: 5%; right: 10%; opacity: 0.22; background: var(--lavender); }
        .auth-blob-2 { width: 260px; height: 260px; top: 20%; left: 45%; opacity: 0.18; }
        .auth-blob-3 { width: 160px; height: 160px; top: 15%; left: 65%; opacity: 0.25; }
        .auth-blob-4 { width: 200px; height: 200px; top: 40%; right: 8%; opacity: 0.2; background: var(--sage); }
        .auth-blob-5 { width: 240px; height: 240px; bottom: -50px; left: 10%; opacity: 0.28; }
        .auth-blob-6 { width: 170px; height: 170px; bottom: 15%; right: 25%; opacity: 0.18; }
        .auth-blob-7 { width: 210px; height: 210px; bottom: -70px; right: -50px; opacity: 0.25; background: var(--lavender); }
        .auth-blob-8 { width: 150px; height: 150px; top: 55%; left: 8%; opacity: 0.2; }
        .auth-blob-9 { width: 190px; height: 190px; bottom: 30%; left: 55%; opacity: 0.16; background: var(--sage); }
      `}</style>
        </div>
    );
}