import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface CheckIn {
    id: number;
    weekStartDate: string;
    weightKg: number | null;
    adherencePercent: number | null;
    notes: string | null;
    status: 'submitted' | 'reviewed';
    coachFeedback: string | null;
}

interface SubmitInput {
    weightKg?: number | null;
    adherencePercent?: number | null;
    notes?: string | null;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useCheckIns() {
    const { user, token } = useAuth();
    const [history, setHistory] = useState<CheckIn[]>([]);
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
            const res = await axios.get(`${api.baseURL}${api.endpoints.checkInHistory(user.id)}`, { headers: authHeaders(token) });
            setHistory(res.data?.data ?? []);
        } catch {
            setError('No se pudo cargar tu historial de check-ins.');
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    useEffect(() => {
        load();
    }, [load]);

    const submit = useCallback(
        async (input: SubmitInput) => {
            await axios.post(`${api.baseURL}${api.endpoints.checkInSubmit}`, input, { headers: authHeaders(token) });
            await load();
        },
        [token, load],
    );

    const latest = history[0] ?? null;

    return { latest, history, loading, error, submit, isClient: !!user };
}
