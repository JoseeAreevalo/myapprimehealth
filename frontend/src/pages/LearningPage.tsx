import { useState } from 'react';
import { BookOpen, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LearningNote, useLearningNotes } from '../hooks/useLearningNotes';

function NoteFormModal({
    initial,
    onClose,
    onSave,
    onGenerate,
}: {
    initial?: LearningNote;
    onClose: () => void;
    onSave: (title: string, body: string) => Promise<void>;
    onGenerate: (prompt: string) => Promise<{ title: string; body: string }>;
}) {
    const [title, setTitle] = useState(initial?.title ?? '');
    const [body, setBody] = useState(initial?.body ?? '');
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setGenerating(true);
        setError('');
        try {
            const draft = await onGenerate(prompt.trim());
            setTitle(draft.title);
            setBody(draft.body);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No se pudo generar la nota con IA.';
            setError(message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !body.trim()) {
            setError('Completa el título y la descripción.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await onSave(title.trim(), body.trim());
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No se pudo guardar la nota.';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-slate-50">{initial ? 'Editar nota' : 'Nueva nota'}</h3>
                    <button className="text-slate-400 hover:text-slate-200" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {!initial && (
                    <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-3">
                        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-300">
                            <Sparkles size={12} /> Generar con IA (opcional)
                        </label>
                        <div className="flex gap-2">
                            <input
                                className="w-full rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setPrompt(event.target.value)}
                                placeholder="Ej. Explica qué es el déficit calórico"
                                value={prompt}
                            />
                            <button
                                className="shrink-0 rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
                                disabled={generating || !prompt.trim()}
                                onClick={handleGenerate}
                                type="button"
                            >
                                {generating ? 'Generando…' : 'Generar'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="mb-1 block text-[11px] text-slate-500">Título</label>
                        <input
                            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Ej. ¿Qué es el RIR?"
                            value={title}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] text-slate-500">Descripción</label>
                        <textarea
                            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                            onChange={(event) => setBody(event.target.value)}
                            placeholder="Describe el tema con claridad…"
                            rows={5}
                            value={body}
                        />
                    </div>
                </div>

                {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

                <div className="mt-5 flex justify-end gap-2">
                    <button className="rounded-lg bg-white/8 px-4 py-2 text-sm text-slate-100 hover:bg-white/15" onClick={onClose} type="button">
                        Cancelar
                    </button>
                    <button
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                        disabled={saving}
                        onClick={handleSave}
                        type="button"
                    >
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LearningPage() {
    const { user } = useAuth();
    const { notes, loading, error, createNote, updateNote, deleteNote, generateDraft } = useLearningNotes();
    const [formMode, setFormMode] = useState<'closed' | 'create' | number>('closed');
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
    const isSuperAdmin = user?.role === 'super_admin';

    const editingNote = typeof formMode === 'number' ? notes.find((note) => note.id === formMode) : undefined;

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel sm:p-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="eyebrow">Aprendizaje</p>
                    <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">Aprende sobre nutrición y entrenamiento</h1>
                    <p className="mt-2 max-w-xl text-sm text-slate-400">Notas breves para entender los términos y principios que usamos en tu plan.</p>
                </div>
                <BookOpen className="text-amber-300" size={22} />
            </div>

            {isSuperAdmin && (
                <button
                    className="mt-5 flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
                    onClick={() => setFormMode('create')}
                    type="button"
                >
                    <Plus size={16} /> Nueva nota
                </button>
            )}

            {loading && <p className="mt-6 text-sm text-slate-500">Cargando…</p>}
            {error && <p className="mt-6 text-sm text-rose-300">{error}</p>}

            {!loading && !error && notes.length === 0 && <p className="mt-6 text-sm text-slate-400">Aún no hay notas de aprendizaje.</p>}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {notes.map((note) => (
                    <article className="rounded-2xl border border-white/7 bg-white/[0.03] p-4" key={note.id}>
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="font-display text-base font-semibold text-slate-50">{note.title}</h2>
                            {isSuperAdmin && (
                                <div className="flex shrink-0 gap-1">
                                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/8 hover:text-slate-200" onClick={() => setFormMode(note.id)} type="button">
                                        <Pencil size={14} />
                                    </button>
                                    <button className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/15" onClick={() => setConfirmingDeleteId(note.id)} type="button">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{note.body}</p>
                    </article>
                ))}
            </div>

            {(formMode === 'create' || editingNote) && (
                <NoteFormModal
                    initial={editingNote}
                    onClose={() => setFormMode('closed')}
                    onGenerate={generateDraft}
                    onSave={(title, body) => (editingNote ? updateNote(editingNote.id, { title, body }) : createNote(title, body))}
                />
            )}

            {confirmingDeleteId != null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" onClick={() => setConfirmingDeleteId(null)}>
                    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <h3 className="font-display text-lg font-semibold text-slate-50">¿Eliminar esta nota?</h3>
                        <p className="mt-2 text-sm text-slate-400">Esta acción no se puede deshacer.</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button className="rounded-lg bg-white/8 px-4 py-2 text-sm text-slate-100 hover:bg-white/15" onClick={() => setConfirmingDeleteId(null)} type="button">
                                Cancelar
                            </button>
                            <button
                                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400"
                                onClick={async () => {
                                    await deleteNote(confirmingDeleteId);
                                    setConfirmingDeleteId(null);
                                }}
                                type="button"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
