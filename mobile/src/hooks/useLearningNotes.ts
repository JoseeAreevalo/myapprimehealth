import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface LearningNote {
    id: number;
    title: string;
    body: string;
    createdBy: number | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorMessage(error: unknown, fallback: string): string {
    return (axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined) || fallback;
}

export function useLearningNotes() {
    const { token } = useAuth();
    const [notes, setNotes] = useState<LearningNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${api.baseURL}${api.endpoints.learningNotes}`, { headers: authHeaders(token) });
            setNotes(res.data?.data ?? []);
        } catch (err) {
            setError(errorMessage(err, 'No se pudieron cargar las notas de aprendizaje.'));
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        load();
    }, [load]);

    const createNote = useCallback(
        async (title: string, body: string) => {
            await axios.post(`${api.baseURL}${api.endpoints.learningNotes}`, { title, body }, { headers: authHeaders(token) });
            await load();
        },
        [token, load],
    );

    const updateNote = useCallback(
        async (id: number, updates: { title?: string; body?: string }) => {
            await axios.patch(`${api.baseURL}${api.endpoints.learningNoteUpdate(id)}`, updates, { headers: authHeaders(token) });
            await load();
        },
        [token, load],
    );

    const deleteNote = useCallback(
        async (id: number) => {
            await axios.delete(`${api.baseURL}${api.endpoints.learningNoteDelete(id)}`, { headers: authHeaders(token) });
            await load();
        },
        [token, load],
    );

    return { notes, loading, error, createNote, updateNote, deleteNote };
}
