import { pool } from '../../db/pool';
import { FileRelatedType, StoredFile } from './files.types';

interface FileRow {
    id: number;
    owner_id: number;
    related_type: FileRelatedType;
    related_id: number;
    stored_name: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
}

function toStoredFile(row: FileRow): StoredFile {
    return {
        id: row.id,
        ownerId: row.owner_id,
        relatedType: row.related_type,
        relatedId: row.related_id,
        storedName: row.stored_name,
        originalName: row.original_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
    };
}

export const filesRepository = {
    async create(input: {
        ownerId: number;
        relatedType: FileRelatedType;
        relatedId: number;
        storedName: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
    }): Promise<StoredFile> {
        const { rows } = await pool.query<FileRow>(
            `INSERT INTO files (owner_id, related_type, related_id, stored_name, original_name, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [input.ownerId, input.relatedType, input.relatedId, input.storedName, input.originalName, input.mimeType, input.sizeBytes],
        );
        return toStoredFile(rows[0]);
    },

    async findById(id: number): Promise<StoredFile | undefined> {
        const { rows } = await pool.query<FileRow>('SELECT * FROM files WHERE id = $1', [id]);
        return rows[0] ? toStoredFile(rows[0]) : undefined;
    },

    async listByRelated(relatedType: FileRelatedType, relatedId: number): Promise<StoredFile[]> {
        const { rows } = await pool.query<FileRow>(
            'SELECT * FROM files WHERE related_type = $1 AND related_id = $2 ORDER BY created_at ASC',
            [relatedType, relatedId],
        );
        return rows.map(toStoredFile);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM files WHERE id = $1', [id]);
    },
};
