import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface ExerciseSuggestion {
    id: number;
    name: string;
    muscleGroup: string | null;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Registers a new exercise name in the shared catalog on a best-effort basis.
// Coached clients get a silent 403 from the API and the attempt is simply ignored.
export async function registerExerciseName(name: string, token: string | null): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
        await axios.post(`${api.baseURL}${api.endpoints.exercisesCreate}`, { name: trimmed }, { headers: authHeaders(token) });
    } catch {
        // ignore - either already exists or the requester isn't allowed to extend the catalog
    }
}

export default function ExerciseAutocomplete({
    value,
    onChange,
    placeholder = 'Ejercicio',
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const { token } = useAuth();
    const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetches on every value change, including an empty value, so opening the field shows the
    // full catalog like a combobox instead of requiring the user to type first.
    useEffect(() => {
        const handle = setTimeout(() => {
            axios
                .get(`${api.baseURL}${api.endpoints.exercisesSearch}`, { params: { search: value.trim() }, headers: authHeaders(token) })
                .then((res) => setSuggestions(res.data?.data ?? []))
                .catch(() => setSuggestions([]));
        }, 200);
        return () => clearTimeout(handle);
    }, [value, token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <input
                className={className ?? 'rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100'}
                onChange={(event) => {
                    onChange(event.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                value={value}
            />
            {open && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-white/10 bg-slate-900 shadow-xl">
                    {suggestions.map((suggestion) => (
                        <li key={suggestion.id}>
                            <button
                                className="block w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-amber-500/20"
                                onClick={() => {
                                    onChange(suggestion.name);
                                    setOpen(false);
                                }}
                                type="button"
                            >
                                {suggestion.name}
                                {suggestion.muscleGroup ? <span className="ml-1 text-slate-500">· {suggestion.muscleGroup}</span> : null}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
