import { useState } from 'react';
import axios from 'axios';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Floating AI help widget, available to every logged-in user, that can answer questions about
// the app and pull from the "Aprendizaje" notes as a knowledge base (with a local fallback when
// no AI provider is configured server-side).
export default function ChatbotWidget() {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatTurn[]>([
        { role: 'assistant', content: '¡Hola! Soy el asistente de Prime Health. Pregúntame sobre nutrición, entrenamiento, actividad o cómo usar la app.' },
    ]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        const text = draft.trim();
        if (!text || sending) return;
        const nextMessages: ChatTurn[] = [...messages, { role: 'user', content: text }];
        setMessages(nextMessages);
        setDraft('');
        setSending(true);
        setError('');
        try {
            const res = await axios.post(
                `${api.baseURL}${api.endpoints.assistantChat}`,
                { message: text },
                { headers: authHeaders(token) },
            );
            setMessages((current) => [...current, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setError('Tu sesión expiró. Vuelve a iniciar sesión para seguir usando el asistente.');
            } else {
                setError((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'No se pudo obtener una respuesta.');
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-6 z-50">
            {open && (
                <div className="mb-3 flex h-[28rem] w-80 flex-col rounded-2xl border border-white/10 bg-panel shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/7 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
                                <Bot size={16} />
                            </span>
                            <p className="text-sm font-semibold text-slate-100">Asistente Prime Health</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-200" onClick={() => setOpen(false)} type="button">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                        {messages.map((turn, index) => (
                            <div className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`} key={index}>
                                <p
                                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-5 ${turn.role === 'user' ? 'bg-amber-500 text-white' : 'bg-white/[0.06] text-slate-200'
                                        }`}
                                >
                                    {turn.content}
                                </p>
                            </div>
                        ))}
                        {sending && <p className="text-xs text-slate-500">Escribiendo…</p>}
                        {error && <p className="text-xs text-rose-300">{error}</p>}
                    </div>
                    <div className="flex items-center gap-2 border-t border-white/7 p-3">
                        <input
                            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-100"
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') handleSend();
                            }}
                            placeholder="Escribe tu pregunta…"
                            value={draft}
                        />
                        <button
                            className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-400 disabled:opacity-50"
                            disabled={sending || !draft.trim()}
                            onClick={handleSend}
                            type="button"
                        >
                            <Send size={15} />
                        </button>
                    </div>
                </div>
            )}
            <button
                aria-label="Abrir asistente de ayuda"
                className="grid size-14 place-items-center rounded-full bg-amber-500 text-white shadow-2xl transition hover:bg-amber-400"
                onClick={() => setOpen((current) => !current)}
                type="button"
            >
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>
        </div>
    );
}
