import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface Workout {
  id: number;
  name: string;
  durationMinutes: number;
  status: 'planned' | 'completed';
}

export interface WorkoutSet {
  id: number;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number | null;
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useWorkoutToday() {
  const { user, token } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${api.baseURL}${api.endpoints.workoutToday}`, { headers: authHeaders(token) });
      setWorkout(res.data?.workout ?? null);
      setSets(res.data?.sets ?? []);
    } catch {
      setError('No se pudo cargar tu entrenamiento de hoy.');
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (name: string, durationMinutes: number) => {
      const res = await axios.put(
        `${api.baseURL}${api.endpoints.workoutToday}`,
        { name, durationMinutes },
        { headers: authHeaders(token) },
      );
      setWorkout(res.data?.workout ?? null);
    },
    [token],
  );

  const complete = useCallback(async () => {
    if (!workout) return;
    const res = await axios.patch(
      `${api.baseURL}${api.endpoints.workoutComplete(workout.id)}`,
      {},
      { headers: authHeaders(token) },
    );
    setWorkout(res.data?.workout ?? null);
  }, [workout, token]);

  const addSet = useCallback(
    async (input: { exerciseName: string; sets: number; reps: number; weightKg: number | null }) => {
      if (!workout) return;
      const res = await axios.post(
        `${api.baseURL}${api.endpoints.workoutSets(workout.id)}`,
        input,
        { headers: authHeaders(token) },
      );
      setSets((current) => [...current, res.data.set]);
    },
    [workout, token],
  );

  const removeSet = useCallback(
    async (setId: number) => {
      await axios.delete(`${api.baseURL}${api.endpoints.workoutSetDelete(setId)}`, { headers: authHeaders(token) });
      setSets((current) => current.filter((set) => set.id !== setId));
    },
    [token],
  );

  return { workout, sets, loading, error, save, complete, addSet, removeSet };
}
