import axios from 'axios';
import { useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface PersonSummary {
    id: number;
    email: string;
    fullName: string | null;
    role: string;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Shared across the coach's dedicated client-management pages (nutrition/training/review).
export function useCoachClients() {
    const { user, token } = useAuth();
    const [clients, setClients] = useState<PersonSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const reload = () => {
        if (!user) return;
        setLoading(true);
        axios
            .get(`${api.baseURL}${api.endpoints.coachClients(user.id)}`, { headers: authHeaders(token) })
            .then((res) => setClients(res.data?.data ?? []))
            .catch(() => setError('No se pudo cargar tu lista de clientes.'))
            .finally(() => setLoading(false));
    };

    useEffect(reload, [user, token]);

    return { clients, loading, error, reload };
}
