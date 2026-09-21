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

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useWorkoutToday() {
  const { user, token } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
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

  return { workout, loading, error, save, complete };
}
