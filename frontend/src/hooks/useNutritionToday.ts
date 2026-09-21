import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export type MealStatus = 'completed' | 'next' | 'planned';

export interface NutritionMeal {
  id: number;
  name: string;
  detail: string | null;
  mealTime: string | null;
  calories: number;
  status: MealStatus;
}

export interface NutritionPlan {
  id: number;
  planKey: string;
  label: string;
  goalCalories: number;
  isActive: boolean;
}

export interface NutritionPlanWithMeals extends NutritionPlan {
  meals: NutritionMeal[];
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useNutritionToday() {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [todayPlan, setTodayPlan] = useState<NutritionPlanWithMeals | null>(null);
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
      const [plansRes, todayRes] = await Promise.all([
        axios.get(`${api.baseURL}${api.endpoints.nutritionPlans(user.id)}`, { headers: authHeaders(token) }),
        axios.get(`${api.baseURL}${api.endpoints.nutritionToday(user.id)}`, { headers: authHeaders(token) }),
      ]);
      setPlans(plansRes.data?.data ?? []);
      setTodayPlan(todayRes.data?.plan ?? null);
    } catch {
      setError('No se pudo cargar tu plan de nutrición.');
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    load();
  }, [load]);

  const activatePlan = useCallback(
    async (planId: number) => {
      if (!user) return;
      await axios.patch(
        `${api.baseURL}${api.endpoints.nutritionActivatePlan(user.id, planId)}`,
        {},
        { headers: authHeaders(token) },
      );
      await load();
    },
    [user, token, load],
  );

  const logMeal = useCallback(
    async (mealId: number, status: MealStatus) => {
      await axios.patch(
        `${api.baseURL}${api.endpoints.nutritionMealLog(mealId)}`,
        { status },
        { headers: authHeaders(token) },
      );
      setTodayPlan((current) =>
        current
          ? { ...current, meals: current.meals.map((meal) => (meal.id === mealId ? { ...meal, status } : meal)) }
          : current,
      );
    },
    [token],
  );

  return { plans, todayPlan, loading, error, activatePlan, logMeal, refresh: load, isClient: !!user };
}
