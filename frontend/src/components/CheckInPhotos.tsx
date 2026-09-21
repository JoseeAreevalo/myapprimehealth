import axios from 'axios';
import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface PhotoMeta {
    id: number;
    originalName: string;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CheckInPhotos({ checkInId, canUpload }: { checkInId: number; canUpload: boolean }) {
    const { token } = useAuth();
    const [thumbs, setThumbs] = useState<Record<number, string>>({});
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const res = await axios.get(`${api.baseURL}${api.endpoints.checkInPhotos(checkInId)}`, { headers: authHeaders(token) });
            const photos: PhotoMeta[] = res.data?.data ?? [];
            const entries = await Promise.all(
                photos.map(async (photo) => {
                    const blobRes = await axios.get(`${api.baseURL}${api.endpoints.fileDownload(photo.id)}`, {
                        headers: authHeaders(token),
                        responseType: 'blob',
                    });
                    return [photo.id, URL.createObjectURL(blobRes.data)] as const;
                }),
            );
            setThumbs(Object.fromEntries(entries));
        } catch {
            setError('No se pudieron cargar las fotos.');
        }
    };

    useEffect(() => {
        load();
        return () => {
            Object.values(thumbs).forEach((url) => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkInId, token]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('photo', file);
        try {
            await axios.post(`${api.baseURL}${api.endpoints.checkInPhotos(checkInId)}`, formData, { headers: authHeaders(token) });
            await load();
        } catch {
            setError('No se pudo subir la foto.');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    return (
        <div className="mt-3">
            <div className="flex flex-wrap gap-2">
                {Object.entries(thumbs).map(([id, url]) => (
                    <img alt="Progreso" className="size-16 rounded-lg object-cover" key={id} src={url} />
                ))}
            </div>
            {canUpload && (
                <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-white/8 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/8">
                    <Camera size={14} /> {uploading ? 'Subiendo…' : 'Agregar foto'}
                    <input accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={handleFileChange} type="file" />
                </label>
            )}
            {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
        </div>
    );
}
