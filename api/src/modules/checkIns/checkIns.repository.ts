import { pool } from '../../db/pool';
import { CheckIn, CheckInInput, CheckInStatus } from './checkIns.types';

interface CheckInRow {
  id: number;
  client_id: number;
  coach_id: number | null;
  week_start_date: string;
  weight_kg: string | null;
  measurements: Record<string, number> | null;
  adherence_percent: number | null;
  notes: string | null;
  status: CheckInStatus;
  coach_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function toCheckIn(row: CheckInRow): CheckIn {
  return {
    id: row.id,
    clientId: row.client_id,
    coachId: row.coach_id,
    weekStartDate: row.week_start_date,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    measurements: row.measurements,
    adherencePercent: row.adherence_percent,
    notes: row.notes,
    status: row.status,
    coachFeedback: row.coach_feedback,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const checkInsRepository = {
  async listByClientId(clientId: number): Promise<CheckIn[]> {
    const { rows } = await pool.query<CheckInRow>(
      'SELECT * FROM check_ins WHERE client_id = $1 ORDER BY week_start_date DESC',
      [clientId],
    );
    return rows.map(toCheckIn);
  },

  async findById(id: number): Promise<CheckIn | undefined> {
    const { rows } = await pool.query<CheckInRow>('SELECT * FROM check_ins WHERE id = $1', [id]);
    return rows[0] ? toCheckIn(rows[0]) : undefined;
  },

  async listPendingByCoachId(coachId: number): Promise<CheckIn[]> {
    const { rows } = await pool.query<CheckInRow>(
      `SELECT * FROM check_ins WHERE coach_id = $1 AND status = 'submitted' ORDER BY week_start_date ASC`,
      [coachId],
    );
    return rows.map(toCheckIn);
  },

  async upsertForWeek(clientId: number, coachId: number | null, weekStartDate: string, input: CheckInInput): Promise<CheckIn> {
    const { rows } = await pool.query<CheckInRow>(
      `INSERT INTO check_ins (client_id, coach_id, week_start_date, weight_kg, measurements, adherence_percent, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (client_id, week_start_date) DO UPDATE SET
         weight_kg = EXCLUDED.weight_kg,
         measurements = EXCLUDED.measurements,
         adherence_percent = EXCLUDED.adherence_percent,
         notes = EXCLUDED.notes,
         status = 'submitted',
         updated_at = now()
       RETURNING *`,
      [
        clientId,
        coachId,
        weekStartDate,
        input.weightKg ?? null,
        input.measurements ? JSON.stringify(input.measurements) : null,
        input.adherencePercent ?? null,
        input.notes ?? null,
      ],
    );
    return toCheckIn(rows[0]);
  },

  async review(id: number, coachFeedback: string): Promise<CheckIn> {
    const { rows } = await pool.query<CheckInRow>(
      `UPDATE check_ins
       SET status = 'reviewed', coach_feedback = $2, reviewed_at = now(), updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, coachFeedback],
    );
    return toCheckIn(rows[0]);
  },
};
