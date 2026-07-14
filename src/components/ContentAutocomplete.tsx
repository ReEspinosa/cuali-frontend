import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

type Contenido = { contenido: string; pda_6: string };

type Props = {
    contenidos: Contenido[];
    value: Contenido | null;
    onSelect: (c: Contenido) => void;
    placeholder?: string;
};

/**
 * Buscador tipo "Google suggest": el usuario escribe, y abajo aparecen
 * los contenidos reales del campo formativo que coinciden, en vez de
 * desplegar una lista completa de golpe.
 */
export default function ContentAutocomplete({ contenidos, value, onSelect, placeholder }: Props) {
    const [query, setQuery] = useState(value?.contenido ?? "");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value?.contenido ?? "");
    }, [value]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const q = query.trim().toLowerCase();

    const suggestions =
        q.length === 0
            ? []
            : contenidos
                .filter((c) => c.contenido.toLowerCase().includes(q))
                // los que empiezan con lo escrito van primero, como en un buscador real
                .sort((a, b) => {
                    const aStarts = a.contenido.toLowerCase().startsWith(q) ? 0 : 1;
                    const bStarts = b.contenido.toLowerCase().startsWith(q) ? 0 : 1;
                    return aStarts - bStarts;
                })
                .slice(0, 8);

    function highlight(text: string) {
        const idx = text.toLowerCase().indexOf(q);
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <span className="font-semibold text-cuali-blue-dark">{text.slice(idx, idx + q.length)}</span>
                {text.slice(idx + q.length)}
            </>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="flex items-center gap-2 rounded-xl border border-cuali-blue-light/50 bg-cuali-blue-soft/60 px-4 py-3 backdrop-blur-sm transition focus-within:border-cuali-blue focus-within:bg-cuali-blue-soft">
                <Search size={16} className="text-ink-soft" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder ?? "Escribe para buscar un contenido…"}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
                />
            </div>

            {open && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-black/5 bg-white shadow-lg">
                    {suggestions.map((c, i) => (
                        <li key={i}>
                            <button
                                type="button"
                                onClick={() => {
                                    onSelect(c);
                                    setQuery(c.contenido);
                                    setOpen(false);
                                }}
                                className="block w-full px-4 py-3 text-left text-sm hover:bg-cuali-blue-soft"
                            >
                                {highlight(c.contenido)}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {open && q.length > 0 && suggestions.length === 0 && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-black/5 bg-white p-4 text-sm text-ink-soft shadow-lg">
                    No encontré contenidos que coincidan con "{query}".
                </div>
            )}
        </div>
    );
}