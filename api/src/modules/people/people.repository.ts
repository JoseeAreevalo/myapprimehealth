import { pool } from '../../db/pool';
import { CoachClientLink, CoachClientStatus, PersonSummary, Profile } from './people.types';

interface ProfileRow {
  user_id: number;
  phone: string | null;
  birth_date: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CoachClientRow {
  id: number;
  coach_id: number;
  client_id: number;
  status: CoachClientStatus;
  assigned_at: string;
  ended_at: string | null;
}

interface PersonRow {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    phone: row.phone,
    birthDate: row.birth_date,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCoachClientLink(row: CoachClientRow): CoachClientLink {
  return {
    id: row.id,
    coachId: row.coach_id,
    clientId: row.client_id,
    status: row.status,
    assignedAt: row.assigned_at,
    endedAt: row.ended_at,
  };
}

function toPersonSummary(row: PersonRow): PersonSummary {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
  };
}

export const profilesRepository = {
  async findByUserId(userId: number): Promise<Profile | undefined> {
    const { rows } = await pool.query<ProfileRow>('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return rows[0] ? toProfile(rows[0]) : undefined;
  },

  async upsert(userId: number, input: { phone?: string | null; birthDate?: string | null; bio?: string | null; avatarUrl?: string | null }): Promise<Profile> {
    const { rows } = await pool.query<ProfileRow>(
      `INSERT INTO profiles (user_id, phone, birth_date, bio, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         phone = EXCLUDED.phone,
         birth_date = EXCLUDED.birth_date,
         bio = EXCLUDED.bio,
         avatar_url = EXCLUDED.avatar_url,
         updated_at = now()
       RETURNING *`,
      [userId, input.phone ?? null, input.birthDate ?? null, input.bio ?? null, input.avatarUrl ?? null],
    );
    return toProfile(rows[0]);
  },
};

export const peopleRepository = {
  async findById(userId: number): Promise<PersonSummary | undefined> {
    const { rows } = await pool.query<PersonRow>('SELECT id, email, full_name, role FROM users WHERE id = $1', [userId]);
    return rows[0] ? toPersonSummary(rows[0]) : undefined;
  },
};

export const coachClientsRepository = {
  async findActiveByClientId(clientId: number): Promise<CoachClientLink | undefined> {
    const { rows } = await pool.query<CoachClientRow>(
      `SELECT * FROM coach_clients WHERE client_id = $1 AND status = 'active'`,
      [clientId],
    );
    return rows[0] ? toCoachClientLink(rows[0]) : undefined;
  },

  async listActiveByCoachId(coachId: number): Promise<CoachClientLink[]> {
    const { rows } = await pool.query<CoachClientRow>(
      `SELECT * FROM coach_clients WHERE coach_id = $1 AND status = 'active' ORDER BY assigned_at DESC`,
      [coachId],
    );
    return rows.map(toCoachClientLink);
  },

  async findById(id: number): Promise<CoachClientLink | undefined> {
    const { rows } = await pool.query<CoachClientRow>('SELECT * FROM coach_clients WHERE id = $1', [id]);
    return rows[0] ? toCoachClientLink(rows[0]) : undefined;
  },

  async assign(coachId: number, clientId: number): Promise<CoachClientLink> {
    const { rows } = await pool.query<CoachClientRow>(
      `INSERT INTO coach_clients (coach_id, client_id)
       VALUES ($1, $2)
       RETURNING *`,
      [coachId, clientId],
    );
    return toCoachClientLink(rows[0]);
  },

  async end(id: number): Promise<void> {
    await pool.query(
      `UPDATE coach_clients SET status = 'ended', ended_at = now() WHERE id = $1 AND status = 'active'`,
      [id],
    );
  },
};
