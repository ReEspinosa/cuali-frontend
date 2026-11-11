import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { api } from "../lib/api";

type Props = {
    url: string;
    alt: string;
    className?: string;
};

/**
 * Imagen protegida por sesion.
 *
 * El backend ya no sirve los archivos como carpeta publica: exige el token
 * (o una URL firmada). Como <img src> no puede mandar el token, la imagen
 * se descarga con fetch y se muestra desde un blob local. El objeto URL se
 * libera al desmontar para no acumular memoria.
 */
export default function AuthImage({ url, alt, className = "" }: Props) {
    const [src, setSrc] = useState<string | null>(null);
    const [fallo, setFallo] = useState(false);

    useEffect(() => {
        let vigente = true;
        let objeto: string | null = null;
        setFallo(false);
        setSrc(null);

        api.descargarArchivoBlob(url)
            .then((blob) => {
                if (!vigente) return;
                objeto = URL.createObjectURL(blob);
                setSrc(objeto);
            })
            .catch(() => {
                if (vigente) setFallo(true);
            });

        return () => {
            vigente = false;
            if (objeto) URL.revokeObjectURL(objeto);
        };
    }, [url]);

    if (fallo) {
        return (
            <span className={`flex items-center justify-center bg-relleno text-tinta-tenue ${className}`} title="No se pudo cargar la imagen">
                <ImageOff size={18} aria-hidden="true" />
                <span className="sr-only">{alt}</span>
            </span>
        );
    }
    if (!src) return <span className={`block animate-pulse bg-relleno ${className}`} aria-label={alt} />;
    return <img src={src} alt={alt} className={className} />;
}
