import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface CardioTarget {
    id: number;
    planId: number;
    weekday: number;
    minutes: number;
}

export interface StepsTarget {
    id: number;
    planId: number;
    weekday: number;
    stepsTarget: number;
}

export interface ActivityLog {
    clientId: number;
    logDate: string;
    actualCardioMinutes: number | null;
    actualSteps: number | null;
}

export interface ActivityPlan {
    id: number;
    clientId: number;
    coachId: number;
    isActive: boolean;
    cardioTargets: CardioTarget[];
    stepsTargets: StepsTarget[];
    todayLog: ActivityLog | null;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useActivityPlan(clientId: number | null) {
    const { token } = useAuth();
    const [plan, setPlan] = useState<ActivityPlan | null>(null);
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
            const res = await axios.get(`${api.baseURL}${api.endpoints.activityPlan(clientId)}`, { headers: authHeaders(token) });
            setPlan(res.data?.plan ?? null);
        } catch {
            setError('No se pudo cargar la configuración de actividad.');
        } finally {
            setLoading(false);
        }
    }, [clientId, token]);

    useEffect(() => {
        load();
    }, [load]);

    const createPlan = useCallback(
        async (cardioTargets: { weekday: number; minutes: number }[], stepsTargets: { weekday: number; stepsTarget: number }[]) => {
            if (!clientId) return;
            await axios.post(
                `${api.baseURL}${api.endpoints.activityPlan(clientId)}`,
                { cardioTargets, stepsTargets },
                { headers: authHeaders(token) },
            );
            await load();
        },
        [clientId, token, load],
    );

    const deletePlan = useCallback(async () => {
        if (!plan) return;
        await axios.delete(`${api.baseURL}${api.endpoints.activityPlanDelete(plan.id)}`, { headers: authHeaders(token) });
        await load();
    }, [plan, token, load]);

    const setCardioTarget = useCallback(
        async (weekday: number, minutes: number) => {
            if (!plan) return;
            await axios.patch(
                `${api.baseURL}${api.endpoints.activityCardioUpdate(plan.id)}`,
                { weekday, minutes },
                { headers: authHeaders(token) },
            );
            await load();
        },
        [plan, token, load],
    );

    const removeCardioTarget = useCallback(
        async (weekday: number) => {
            if (!plan) return;
            await axios.delete(`${api.baseURL}${api.endpoints.activityCardioDelete(plan.id, weekday)}`, { headers: authHeaders(token) });
            await load();
        },
        [plan, token, load],
    );

    const setStepsTarget = useCallback(
        async (weekday: number, stepsTarget: number) => {
            if (!plan) return;
            await axios.patch(
                `${api.baseURL}${api.endpoints.activityStepsUpdate(plan.id)}`,
                { weekday, stepsTarget },
                { headers: authHeaders(token) },
            );
            await load();
        },
        [plan, token, load],
    );

    const removeStepsTarget = useCallback(
        async (weekday: number) => {
            if (!plan) return;
            await axios.delete(`${api.baseURL}${api.endpoints.activityStepsDelete(plan.id, weekday)}`, { headers: authHeaders(token) });
            await load();
        },
        [plan, token, load],
    );

    const logToday = useCallback(
        async (updates: { actualCardioMinutes?: number | null; actualSteps?: number | null }) => {
            if (!clientId) return;
            await axios.patch(`${api.baseURL}${api.endpoints.activityLog(clientId)}`, updates, { headers: authHeaders(token) });
            await load();
        },
        [clientId, token, load],
    );

    return { plan, loading, error, refresh: load, createPlan, deletePlan, setCardioTarget, removeCardioTarget, setStepsTarget, removeStepsTarget, logToday };
}
