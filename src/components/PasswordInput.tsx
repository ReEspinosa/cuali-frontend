import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className: string;
    minLength?: number;
    required?: boolean;
};

export default function PasswordInput({ value, onChange, placeholder, className, minLength, required }: Props) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input
                type={visible ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                minLength={minLength}
                required={required}
                className={`${className} w-full pr-11`}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition hover:text-ink"
                tabIndex={-1}
            >
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
}