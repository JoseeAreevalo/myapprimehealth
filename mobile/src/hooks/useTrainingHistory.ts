import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface HistorySetLog {
    setNumber: number;
    actualReps: number | null;
    actualWeightKg: number | null;
}

export interface HistoryExercise {
    exerciseId: number;
    exerciseName: string;
    dayLabel: string;
    sets: HistorySetLog[];
}

export interface HistoryDay {
    date: string;
    exercises: HistoryExercise[];
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Loads which days had actual logged sets for a given month, for the training calendar view.
export function useTrainingHistory(clientId: number) {
    const { token } = useAuth();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [days, setDays] = useState<HistoryDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${api.baseURL}${api.endpoints.trainingHistory(clientId)}`, {
                params: { year, month },
                headers: authHeaders(token),
            });
            setDays(res.data?.data ?? []);
        } catch {
            setError('No se pudo cargar el historial de entrenamiento.');
        } finally {
            setLoading(false);
        }
    }, [clientId, year, month, token]);

    useEffect(() => {
        load();
    }, [load]);

    const goToPreviousMonth = () => {
        if (month === 1) {
            setYear((current) => current - 1);
            setMonth(12);
        } else {
            setMonth((current) => current - 1);
        }
    };

    const goToNextMonth = () => {
        if (month === 12) {
            setYear((current) => current + 1);
            setMonth(1);
        } else {
            setMonth((current) => current + 1);
        }
    };

    return { year, month, days, loading, error, goToPreviousMonth, goToNextMonth };
}
