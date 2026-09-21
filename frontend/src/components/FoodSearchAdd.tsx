import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface FoodOption {
  id: number;
  name: string;
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Search the shared foods catalog, or add a new food (with cooked-weight macros) if nothing matches.
export default function FoodSearchAdd({ onSelect }: { onSelect: (food: FoodOption) => void }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodOption[]>([]);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState(false);
  const [newFood, setNewFood] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [addError, setAddError] = useState('');
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResults([]);
      setSearched(false);
      return;
    }
    const handle = setTimeout(() => {
      axios
        .get(`${api.baseURL}${api.endpoints.foodsSearch}`, { params: { search: query.trim() }, headers: authHeaders(token) })
        .then((res) => {
          setResults(res.data?.data ?? []);
          setSearched(true);
        })
        .catch(() => {
          setResults([]);
          setSearched(true);
        });
    }, 250);
    return () => clearTimeout(handle);
  }, [query, token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pick = (food: FoodOption) => {
    onSelect(food);
    setQuery('');
    setResults([]);
    setSearched(false);
    setOpen(false);
  };

  const handleAddNewFood = async () => {
    if (!query.trim() || !newFood.calories) return;
    setBusy(true);
    setAddError('');
    try {
      const res = await axios.post(
        `${api.baseURL}${api.endpoints.foodsCreate}`,
        {
          name: query.trim(),
          caloriesPer100g: Number(newFood.calories),
          proteinG: newFood.protein ? Number(newFood.protein) : 0,
          carbsG: newFood.carbs ? Number(newFood.carbs) : 0,
          fatG: newFood.fat ? Number(newFood.fat) : 0,
        },
        { headers: authHeaders(token) },
      );
      const food: FoodOption | undefined = res.data?.food;
      if (food) pick(food);
      setNewFood({ calories: '', protein: '', carbs: '', fat: '' });
    } catch (err) {
      const axiosError = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      setAddError(
        axiosError.response?.status === 403
          ? axiosError.response.data?.error?.message ?? 'Tu coach administra el catálogo de alimentos.'
          : 'No se pudo agregar el alimento.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="w-full rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar alimento (ej. arroz, pollo)…"
        value={query}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-white/10 bg-slate-900 shadow-xl">
          {results.map((food) => (
            <li key={food.id}>
              <button className="block w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-amber-500/20" onClick={() => pick(food)} type="button">
                {food.name} <span className="text-slate-500">· {food.caloriesPer100g} kcal/100g</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && searched && results.length === 0 && query.trim().length >= 1 && (
        <div className="absolute z-20 mt-1 w-full space-y-2 rounded-lg border border-white/10 bg-slate-900 p-3 shadow-xl">
          <p className="text-[11px] text-slate-400">No encontramos "{query}". Agrégalo con sus valores por 100g (alimento cocido):</p>
          <div className="grid grid-cols-4 gap-1.5">
            <input
              className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
              onChange={(event) => setNewFood((current) => ({ ...current, calories: event.target.value }))}
              placeholder="kcal"
              type="number"
              value={newFood.calories}
            />
            <input
              className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
              onChange={(event) => setNewFood((current) => ({ ...current, protein: event.target.value }))}
              placeholder="prot. g"
              type="number"
              value={newFood.protein}
            />
            <input
              className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
              onChange={(event) => setNewFood((current) => ({ ...current, carbs: event.target.value }))}
              placeholder="carb. g"
              type="number"
              value={newFood.carbs}
            />
            <input
              className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
              onChange={(event) => setNewFood((current) => ({ ...current, fat: event.target.value }))}
              placeholder="grasa g"
              type="number"
              value={newFood.fat}
            />
          </div>
          {addError && <p className="text-[11px] text-rose-300">{addError}</p>}
          <button
            className="w-full rounded-lg bg-amber-500/15 py-1.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
            disabled={busy || !newFood.calories}
            onClick={handleAddNewFood}
            type="button"
          >
            {busy ? 'Agregando…' : 'Agregar alimento nuevo'}
          </button>
        </div>
      )}
    </div>
  );
}
