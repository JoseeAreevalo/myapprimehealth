import { pool } from '../../db/pool';
import { LearningNote } from './learning.types';

interface NoteRow {
    id: number;
    title: string;
    body: string;
    created_by: number | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

function toNote(row: NoteRow): LearningNote {
    return {
        id: row.id,
        title: row.title,
        body: row.body,
        createdBy: row.created_by,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export const learningNotesRepository = {
    async list(): Promise<LearningNote[]> {
        const { rows } = await pool.query<NoteRow>('SELECT * FROM learning_notes ORDER BY sort_order ASC, id ASC');
        return rows.map(toNote);
    },

    async findById(id: number): Promise<LearningNote | undefined> {
        const { rows } = await pool.query<NoteRow>('SELECT * FROM learning_notes WHERE id = $1', [id]);
        return rows[0] ? toNote(rows[0]) : undefined;
    },

    async create(input: { title: string; body: string; createdBy: number | null; sortOrder: number }): Promise<LearningNote> {
        const { rows } = await pool.query<NoteRow>(
            `INSERT INTO learning_notes (title, body, created_by, sort_order) VALUES ($1, $2, $3, $4) RETURNING *`,
            [input.title, input.body, input.createdBy, input.sortOrder],
        );
        return toNote(rows[0]);
    },

    async update(id: number, updates: { title?: string; body?: string }): Promise<LearningNote> {
        const { rows } = await pool.query<NoteRow>(
            `UPDATE learning_notes SET title = COALESCE($2, title), body = COALESCE($3, body), updated_at = now() WHERE id = $1 RETURNING *`,
            [id, updates.title ?? null, updates.body ?? null],
        );
        return toNote(rows[0]);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM learning_notes WHERE id = $1', [id]);
    },

    async nextSortOrder(): Promise<number> {
        const { rows } = await pool.query<{ max: number | null }>('SELECT MAX(sort_order) AS max FROM learning_notes');
        return (rows[0]?.max ?? -1) + 1;
    },
};
