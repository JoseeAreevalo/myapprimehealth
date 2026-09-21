import axios from 'axios';
import { useEffect, useState } from 'react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

export interface WeightPoint {
  weekStartDate: string;
  weightKg: number;
}

export interface AdherencePoint {
  weekStartDate: string;
  adherencePercent: number;
}

export interface ClientProgress {
  clientId: number;
  summary: {
    totalCheckIns: number;
    reviewedCheckIns: number;
    startingWeightKg: number | null;
    currentWeightKg: number | null;
    weightChangeKg: number | null;
    averageAdherencePercent: number | null;
  };
  weightSeries: WeightPoint[];
  adherenceSeries: AdherencePoint[];
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useClientProgress(clientId: number | null) {
  const { token } = useAuth();
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clientId) {
      setProgress(null);
      return;
    }

    setLoading(true);
    setError('');
    axios
      .get(`${api.baseURL}${api.endpoints.progress(clientId)}`, { headers: authHeaders(token) })
      .then((res) => setProgress(res.data?.progress ?? null))
      .catch(() => setError('Unable to load progress.'))
      .finally(() => setLoading(false));
  }, [clientId, token]);

  return { progress, loading, error };
}
