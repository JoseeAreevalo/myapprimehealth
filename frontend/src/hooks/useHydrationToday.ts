import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useHydrationToday() {
    const { user, token } = useAuth();
    const [consumedMl, setConsumedMl] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${api.baseURL}${api.endpoints.hydrationToday}`, { headers: authHeaders(token) });
            setConsumedMl(res.data?.log?.consumedMl ?? 0);
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    useEffect(() => {
        load();
    }, [load]);

    const logWater = useCallback(
        async (amountMl: number) => {
            const next = consumedMl + amountMl;
            setConsumedMl(next);
            await axios.put(`${api.baseURL}${api.endpoints.hydrationToday}`, { consumedMl: next }, { headers: authHeaders(token) });
        },
        [consumedMl, token],
    );

    return { consumedMl, loading, logWater };
}
