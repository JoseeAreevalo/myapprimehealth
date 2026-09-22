import { pool } from '../../db/pool';
import { IdentityUser, RefreshSession, UserRole } from './identity.types';

interface UserRow {
    id: number;
    email: string;
    password_hash: string;
    full_name: string | null;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface RefreshSessionRow {
    id: string;
    user_id: number;
    token_hash: string;
    created_at: string;
    updated_at: string;
    expires_at: string;
    revoked_at: string | null;
    replaced_by_token_id: string | null;
    rotation_counter: number;
}

function toUser(row: UserRow): IdentityUser {
    return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        fullName: row.full_name,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isActive: row.is_active,
    };
}

function toRefreshSession(row: RefreshSessionRow): RefreshSession {
    return {
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        replacedByTokenId: row.replaced_by_token_id,
        rotationCounter: row.rotation_counter,
    };
}

export const usersRepository = {
    async findByEmail(email: string): Promise<IdentityUser | undefined> {
        const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0] ? toUser(rows[0]) : undefined;
    },

    async findById(id: number): Promise<IdentityUser | undefined> {
        const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
        return rows[0] ? toUser(rows[0]) : undefined;
    },

    async create(email: string, passwordHash: string, fullName: string | null, role: UserRole): Promise<IdentityUser> {
        const { rows } = await pool.query<UserRow>(
            `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [email, passwordHash, fullName, role],
        );
        return toUser(rows[0]);
    },

    async listAll(): Promise<IdentityUser[]> {
        const { rows } = await pool.query<UserRow>('SELECT * FROM users ORDER BY created_at DESC');
        return rows.map(toUser);
    },

    async updateRoleAndStatus(id: number, updates: { role?: UserRole; isActive?: boolean }): Promise<IdentityUser | undefined> {
        const { rows } = await pool.query<UserRow>(
            `UPDATE users
       SET role = COALESCE($2, role), is_active = COALESCE($3, is_active), updated_at = now()
       WHERE id = $1
       RETURNING *`,
            [id, updates.role ?? null, updates.isActive ?? null],
        );
        return rows[0] ? toUser(rows[0]) : undefined;
    },

    async delete(id: number): Promise<boolean> {
        const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return (rowCount ?? 0) > 0;
    },

    async updateAccount(id: number, updates: { fullName?: string | null; email?: string }): Promise<IdentityUser | undefined> {
        const { rows } = await pool.query<UserRow>(
            `UPDATE users
       SET full_name = COALESCE($2, full_name), email = COALESCE($3, email), updated_at = now()
       WHERE id = $1
       RETURNING *`,
            [id, updates.fullName ?? null, updates.email ?? null],
        );
        return rows[0] ? toUser(rows[0]) : undefined;
    },
};

export const refreshSessionsRepository = {
    async create(session: {
        id: string;
        userId: number;
        tokenHash: string;
        expiresAt: string;
    }): Promise<RefreshSession> {
        const { rows } = await pool.query<RefreshSessionRow>(
            `INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [session.id, session.userId, session.tokenHash, session.expiresAt],
        );
        return toRefreshSession(rows[0]);
    },

    async findByTokenHash(tokenHash: string): Promise<RefreshSession | undefined> {
        const { rows } = await pool.query<RefreshSessionRow>(
            'SELECT * FROM refresh_sessions WHERE token_hash = $1',
            [tokenHash],
        );
        return rows[0] ? toRefreshSession(rows[0]) : undefined;
    },

    async revoke(id: string, replacedByTokenId: string | null): Promise<void> {
        await pool.query(
            `UPDATE refresh_sessions
       SET revoked_at = now(), replaced_by_token_id = $2, updated_at = now()
       WHERE id = $1`,
            [id, replacedByTokenId],
        );
    },

    async revokeAllForUser(userId: number): Promise<void> {
        await pool.query(
            `UPDATE refresh_sessions
       SET revoked_at = now(), updated_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
            [userId],
        );
    },
};
