import { pool } from '../../db/pool';
import { WaterLog } from './hydration.types';

interface WaterLogRow {
    user_id: number;
    log_date: string;
    consumed_ml: number;
}

function toWaterLog(row: WaterLogRow): WaterLog {
    return {
        userId: row.user_id,
        logDate: row.log_date,
        consumedMl: row.consumed_ml,
    };
}

function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export const hydrationRepository = {
    async findForToday(userId: number): Promise<WaterLog | undefined> {
        const { rows } = await pool.query<WaterLogRow>(
            'SELECT * FROM water_logs WHERE user_id = $1 AND log_date = $2',
            [userId, todayIsoDate()],
        );
        return rows[0] ? toWaterLog(rows[0]) : undefined;
    },

    async setForToday(userId: number, consumedMl: number): Promise<WaterLog> {
        const { rows } = await pool.query<WaterLogRow>(
            `INSERT INTO water_logs (user_id, log_date, consumed_ml)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, log_date) DO UPDATE SET consumed_ml = EXCLUDED.consumed_ml, updated_at = now()
       RETURNING *`,
            [userId, todayIsoDate(), consumedMl],
        );
        return toWaterLog(rows[0]);
    },
};
