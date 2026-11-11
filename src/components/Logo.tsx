type Props = {
    compacto?: boolean;
    className?: string;
};

/** Marca de Cuali: la palabra en tinta con el punto amarillo de marcatexto. */
export default function Logo({ compacto = false, className = "" }: Props) {
    return (
        <span
            className={`inline-flex items-baseline gap-0.5 font-display font-extrabold tracking-tight text-tinta ${className}`}
            aria-label="Cuali"
        >
            <span aria-hidden="true">{compacto ? "c" : "cuali"}</span>
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-marcatexto" />
        </span>
    );
}
