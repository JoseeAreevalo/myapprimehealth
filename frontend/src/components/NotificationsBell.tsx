import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Preferences {
  emailEnabled: boolean;
  checkinReminders: boolean;
  coachMessages: boolean;
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function NotificationsBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    axios
      .get(`${api.baseURL}${api.endpoints.notifications}`, { headers: authHeaders(token) })
      .then((res) => {
        setItems(res.data?.data ?? []);
        setUnreadCount(res.data?.meta?.unreadCount ?? 0);
      })
      .catch(() => {
        setItems([]);
        setUnreadCount(0);
      });
    axios
      .get(`${api.baseURL}${api.endpoints.notificationPreferences}`, { headers: authHeaders(token) })
      .then((res) => setPreferences(res.data?.preferences ?? null))
      .catch(() => setPreferences(null));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [token, load]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((current) => !current);
  };

  const markRead = async (id: number) => {
    await axios.patch(`${api.baseURL}${api.endpoints.notificationRead(id)}`, {}, { headers: authHeaders(token) });
    load();
  };

  const markAllRead = async () => {
    await axios.patch(`${api.baseURL}${api.endpoints.notificationReadAll}`, {}, { headers: authHeaders(token) });
    load();
  };

  const togglePreference = async (key: keyof Preferences) => {
    if (!preferences) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    await axios.put(`${api.baseURL}${api.endpoints.notificationPreferences}`, { [key]: next[key] }, { headers: authHeaders(token) });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Notificaciones"
        className="relative grid size-11 place-items-center rounded-xl border border-white/8 bg-white/[0.035] text-slate-300 transition hover:bg-white/8"
        onClick={handleOpen}
        type="button"
      >
        <Bell size={19} />
        {unreadCount > 0 && <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-amber-400" />}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-white/10 bg-panel p-3 shadow-2xl">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-semibold text-slate-100">Notificaciones</p>
            {unreadCount > 0 && (
              <button className="text-xs text-amber-300 hover:text-amber-200" onClick={markAllRead} type="button">
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="mt-2 max-h-80 space-y-1 overflow-y-auto">
            {items.length === 0 && <p className="px-2 py-4 text-sm text-slate-500">Aun no tienes notificaciones.</p>}
            {items.map((item) => (
              <button
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${item.isRead ? 'text-slate-400 hover:bg-white/5' : 'bg-amber-500/10 text-slate-100 hover:bg-amber-500/15'}`}
                key={item.id}
                onClick={() => !item.isRead && markRead(item.id)}
                type="button"
              >
                <p className="font-medium">{item.title}</p>
                {item.body && <p className="mt-0.5 text-xs text-slate-500">{item.body}</p>}
              </button>
            ))}
          </div>
          {preferences && (
            <div className="mt-2 space-y-1 border-t border-white/7 pt-2">
              <label className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
                Recordatorios de check-in
                <input checked={preferences.checkinReminders} onChange={() => togglePreference('checkinReminders')} type="checkbox" />
              </label>
              <label className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
                Mensajes del coach
                <input checked={preferences.coachMessages} onChange={() => togglePreference('coachMessages')} type="checkbox" />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
