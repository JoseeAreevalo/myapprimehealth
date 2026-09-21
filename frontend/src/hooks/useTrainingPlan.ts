import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface SetLog {
  setNumber: number;
  actualReps: number | null;
  actualWeightKg: number | null;
}

export interface TrainingExercise {
  id: number;
  dayId: number;
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number | null;
  logs: SetLog[];
}

export interface TrainingDay {
  id: number;
  planId: number;
  dayOrder: number;
  label: string;
  exercises: TrainingExercise[];
}

export interface TrainingPlan {
  id: number;
  clientId: number;
  coachId: number;
  label: string;
  isActive: boolean;
  days: TrainingDay[];
}

export interface ExerciseDraft {
  name: string;
  targetSets: string;
  targetReps: string;
  targetWeightKg: string;
}

export interface DayDraft {
  label: string;
  exercises: ExerciseDraft[];
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useTrainingPlan(clientId: number | null) {
  const { token } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${api.baseURL}${api.endpoints.trainingPlan(clientId)}`, { headers: authHeaders(token) });
      setPlan(res.data?.plan ?? null);
    } catch {
      setError('No se pudo cargar el plan de entrenamiento.');
    } finally {
      setLoading(false);
    }
  }, [clientId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const createPlan = useCallback(
    async (label: string, days: DayDraft[]) => {
      if (!clientId) return;
      await axios.post(
        `${api.baseURL}${api.endpoints.trainingPlanCreate}`,
        {
          clientId,
          label,
          days: days.map((day) => ({
            label: day.label,
            exercises: day.exercises.map((exercise) => ({
              name: exercise.name,
              targetSets: Number(exercise.targetSets),
              targetReps: Number(exercise.targetReps),
              targetWeightKg: exercise.targetWeightKg ? Number(exercise.targetWeightKg) : null,
            })),
          })),
        },
        { headers: authHeaders(token) },
      );
      await load();
    },
    [clientId, token, load],
  );

  const addDay = useCallback(
    async (label: string) => {
      if (!plan) return;
      await axios.post(`${api.baseURL}${api.endpoints.trainingPlanAddDay(plan.id)}`, { label }, { headers: authHeaders(token) });
      await load();
    },
    [plan, token, load],
  );

  const deleteDay = useCallback(
    async (dayId: number) => {
      await axios.delete(`${api.baseURL}${api.endpoints.trainingDayDelete(dayId)}`, { headers: authHeaders(token) });
      await load();
    },
    [token, load],
  );

  const addExercise = useCallback(
    async (dayId: number, exercise: { name: string; targetSets: number; targetReps: number; targetWeightKg: number | null }) => {
      await axios.post(`${api.baseURL}${api.endpoints.trainingDayAddExercise(dayId)}`, exercise, { headers: authHeaders(token) });
      await load();
    },
    [token, load],
  );

  const updateExercise = useCallback(
    async (exerciseId: number, updates: { name?: string; targetSets?: number; targetReps?: number; targetWeightKg?: number | null }) => {
      await axios.patch(`${api.baseURL}${api.endpoints.trainingExerciseUpdate(exerciseId)}`, updates, { headers: authHeaders(token) });
      await load();
    },
    [token, load],
  );

  const deleteExercise = useCallback(
    async (exerciseId: number) => {
      await axios.delete(`${api.baseURL}${api.endpoints.trainingExerciseDelete(exerciseId)}`, { headers: authHeaders(token) });
      await load();
    },
    [token, load],
  );

  const logSets = useCallback(
    async (exerciseId: number, sets: SetLog[]) => {
      await axios.put(`${api.baseURL}${api.endpoints.trainingExerciseLogs(exerciseId)}`, { sets }, { headers: authHeaders(token) });
      await load();
    },
    [token, load],
  );

  return { plan, loading, error, refresh: load, createPlan, addDay, deleteDay, addExercise, updateExercise, deleteExercise, logSets };
}
