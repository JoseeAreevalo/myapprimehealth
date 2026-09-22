import axios from 'axios';
import { useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// For a client, tells us whether they have a coach assigned. A client with no coach manages
// their own nutrition/training; a client with a coach only views/logs what the coach set up.
export function useMyCoach() {
    const { user, token } = useAuth();
    const [hasCoach, setHasCoach] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'client') {
            setLoading(false);
            return;
        }
        setLoading(true);
        axios
            .get(`${api.baseURL}${api.endpoints.clientCoach(user.id)}`, { headers: authHeaders(token) })
            .then((res) => setHasCoach(!!res.data?.coach))
            .catch(() => setHasCoach(false))
            .finally(() => setLoading(false));
    }, [user, token]);

    return { hasCoach, loading };
}
