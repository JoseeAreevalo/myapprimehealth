import axios from 'axios';
import { useState } from 'react';
import { Calculator, ScanLine } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface Food {
  id: number;
  name: string;
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface SelectedFood extends Food {
  grams: number;
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function scale(value: number, grams: number) {
  return Math.round(((value * grams) / 100) * 10) / 10;
}

export default function FoodCalculator() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [selected, setSelected] = useState<SelectedFood[]>([]);
  const [barcode, setBarcode] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setError('');
    try {
      const res = await axios.get(`${api.baseURL}${api.endpoints.foodsSearch}?search=${encodeURIComponent(query)}`, {
        headers: authHeaders(token),
      });
      setResults(res.data?.data ?? []);
    } catch {
      setError('No se pudo buscar alimentos.');
    } finally {
      setSearching(false);
    }
  };

  const handleBarcode = async () => {
    if (!barcode.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await axios.get(`${api.baseURL}${api.endpoints.foodsBarcode(barcode.trim())}`, { headers: authHeaders(token) });
      const food: Food = res.data?.food;
      if (food) addFood(food);
      setBarcode('');
    } catch {
      setError('No se encontró ese código de barras.');
    } finally {
      setSearching(false);
    }
  };

  const addFood = (food: Food) => {
    setSelected((current) => [...current, { ...food, grams: 100 }]);
  };

  const updateGrams = (index: number, grams: number) => {
    setSelected((current) => current.map((item, i) => (i === index ? { ...item, grams } : item)));
  };

  const removeItem = (index: number) => {
    setSelected((current) => current.filter((_, i) => i !== index));
  };

  const totals = selected.reduce(
    (acc, item) => ({
      calories: acc.calories + scale(item.caloriesPer100g, item.grams),
      protein: acc.protein + scale(item.proteinG, item.grams),
      carbs: acc.carbs + scale(item.carbsG, item.grams),
      fat: acc.fat + scale(item.fatG, item.grams),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Nutrición</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Calculadora de calorías</h2>
        </div>
        <Calculator className="text-amber-300" size={20} />
      </div>

      <div className="mt-5 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
          placeholder="Buscar alimento (ej. pollo)"
          value={query}
        />
        <button className="rounded-xl bg-white/8 px-3 text-sm text-slate-100 hover:bg-white/15" onClick={handleSearch} type="button">
          Buscar
        </button>
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          onChange={(event) => setBarcode(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleBarcode()}
          placeholder="Código de barras"
          value={barcode}
        />
        <button className="flex items-center gap-1.5 rounded-xl bg-white/8 px-3 text-sm text-slate-100 hover:bg-white/15" onClick={handleBarcode} type="button">
          <ScanLine size={15} /> Buscar
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      {searching && <p className="mt-2 text-xs text-slate-500">Buscando…</p>}

      {results.length > 0 && (
        <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto">
          {results.map((food) => (
            <li key={food.id}>
              <button
                className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-white/8"
                onClick={() => addFood(food)}
                type="button"
              >
                {food.name} · {food.caloriesPer100g} kcal/100g
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-white/7 pt-4">
          {selected.map((item, index) => (
            <div className="flex items-center gap-2 text-xs" key={`${item.id}-${index}`}>
              <span className="flex-1 truncate text-slate-200">{item.name}</span>
              <input
                className="w-16 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-slate-100"
                onChange={(event) => updateGrams(index, Number(event.target.value))}
                type="number"
                value={item.grams}
              />
              <span className="text-slate-500">g</span>
              <span className="w-14 text-right text-slate-300">{scale(item.caloriesPer100g, item.grams)} kcal</span>
              <button className="text-rose-300 hover:text-rose-200" onClick={() => removeItem(index)} type="button">
                ✕
              </button>
            </div>
          ))}

          <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center text-xs">
            <div>
              <p className="text-slate-500">kcal</p>
              <p className="mt-0.5 font-semibold text-amber-300">{Math.round(totals.calories)}</p>
            </div>
            <div>
              <p className="text-slate-500">Prot.</p>
              <p className="mt-0.5 font-semibold text-slate-100">{totals.protein.toFixed(1)}g</p>
            </div>
            <div>
              <p className="text-slate-500">Carb.</p>
              <p className="mt-0.5 font-semibold text-slate-100">{totals.carbs.toFixed(1)}g</p>
            </div>
            <div>
              <p className="text-slate-500">Grasa</p>
              <p className="mt-0.5 font-semibold text-slate-100">{totals.fat.toFixed(1)}g</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
