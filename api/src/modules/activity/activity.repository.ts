import { pool } from '../../db/pool';
import { ActivityLog, ActivityPlan, CardioTarget, StepsTarget } from './activity.types';

interface PlanRow {
    id: number;
    client_id: number;
    coach_id: number;
    is_active: boolean;
}

interface CardioRow {
    id: number;
    plan_id: number;
    weekday: number;
    minutes: number;
}

interface StepsRow {
    id: number;
    plan_id: number;
    weekday: number;
    steps_target: number;
}

interface LogRow {
    client_id: number;
    log_date: string;
    actual_cardio_minutes: number | null;
    actual_steps: number | null;
}

function toPlan(row: PlanRow): ActivityPlan {
    return { id: row.id, clientId: row.client_id, coachId: row.coach_id, isActive: row.is_active };
}

function toCardioTarget(row: CardioRow): CardioTarget {
    return { id: row.id, planId: row.plan_id, weekday: row.weekday, minutes: row.minutes };
}

function toStepsTarget(row: StepsRow): StepsTarget {
    return { id: row.id, planId: row.plan_id, weekday: row.weekday, stepsTarget: row.steps_target };
}

function toLog(row: LogRow): ActivityLog {
    return {
        clientId: row.client_id,
        logDate: row.log_date,
        actualCardioMinutes: row.actual_cardio_minutes,
        actualSteps: row.actual_steps,
    };
}

export const activityPlansRepository = {
    async findActiveByClientId(clientId: number): Promise<ActivityPlan | undefined> {
        const { rows } = await pool.query<PlanRow>('SELECT * FROM activity_plans WHERE client_id = $1 AND is_active = TRUE', [clientId]);
        return rows[0] ? toPlan(rows[0]) : undefined;
    },

    async findById(id: number): Promise<ActivityPlan | undefined> {
        const { rows } = await pool.query<PlanRow>('SELECT * FROM activity_plans WHERE id = $1', [id]);
        return rows[0] ? toPlan(rows[0]) : undefined;
    },

    async create(clientId: number, coachId: number): Promise<ActivityPlan> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE activity_plans SET is_active = FALSE, updated_at = now() WHERE client_id = $1', [clientId]);
            const { rows } = await client.query<PlanRow>(
                `INSERT INTO activity_plans (client_id, coach_id) VALUES ($1, $2) RETURNING *`,
                [clientId, coachId],
            );
            await client.query('COMMIT');
            return toPlan(rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM activity_plans WHERE id = $1', [id]);
    },
};

export const cardioTargetsRepository = {
    async listByPlanId(planId: number): Promise<CardioTarget[]> {
        const { rows } = await pool.query<CardioRow>('SELECT * FROM activity_cardio_targets WHERE plan_id = $1 ORDER BY weekday ASC', [planId]);
        return rows.map(toCardioTarget);
    },

    async upsert(planId: number, weekday: number, minutes: number): Promise<CardioTarget> {
        const { rows } = await pool.query<CardioRow>(
            `INSERT INTO activity_cardio_targets (plan_id, weekday, minutes)
       VALUES ($1, $2, $3)
       ON CONFLICT (plan_id, weekday) DO UPDATE SET minutes = EXCLUDED.minutes
       RETURNING *`,
            [planId, weekday, minutes],
        );
        return toCardioTarget(rows[0]);
    },

    async deleteByWeekday(planId: number, weekday: number): Promise<void> {
        await pool.query('DELETE FROM activity_cardio_targets WHERE plan_id = $1 AND weekday = $2', [planId, weekday]);
    },
};

export const stepsTargetsRepository = {
    async listByPlanId(planId: number): Promise<StepsTarget[]> {
        const { rows } = await pool.query<StepsRow>('SELECT * FROM activity_steps_targets WHERE plan_id = $1 ORDER BY weekday ASC', [planId]);
        return rows.map(toStepsTarget);
    },

    async upsert(planId: number, weekday: number, stepsTarget: number): Promise<StepsTarget> {
        const { rows } = await pool.query<StepsRow>(
            `INSERT INTO activity_steps_targets (plan_id, weekday, steps_target)
       VALUES ($1, $2, $3)
       ON CONFLICT (plan_id, weekday) DO UPDATE SET steps_target = EXCLUDED.steps_target
       RETURNING *`,
            [planId, weekday, stepsTarget],
        );
        return toStepsTarget(rows[0]);
    },

    async deleteByWeekday(planId: number, weekday: number): Promise<void> {
        await pool.query('DELETE FROM activity_steps_targets WHERE plan_id = $1 AND weekday = $2', [planId, weekday]);
    },
};

export const activityLogsRepository = {
    async findForDate(clientId: number, logDate: string): Promise<ActivityLog | undefined> {
        const { rows } = await pool.query<LogRow>('SELECT * FROM activity_logs WHERE client_id = $1 AND log_date = $2', [clientId, logDate]);
        return rows[0] ? toLog(rows[0]) : undefined;
    },

    async upsert(clientId: number, logDate: string, updates: { actualCardioMinutes?: number | null; actualSteps?: number | null }): Promise<ActivityLog> {
        const { rows } = await pool.query<LogRow>(
            `INSERT INTO activity_logs (client_id, log_date, actual_cardio_minutes, actual_steps)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (client_id, log_date) DO UPDATE SET
         actual_cardio_minutes = COALESCE(EXCLUDED.actual_cardio_minutes, activity_logs.actual_cardio_minutes),
         actual_steps = COALESCE(EXCLUDED.actual_steps, activity_logs.actual_steps),
         updated_at = now()
       RETURNING *`,
            [clientId, logDate, updates.actualCardioMinutes ?? null, updates.actualSteps ?? null],
        );
        return toLog(rows[0]);
    },

    async listRecentForClient(clientId: number, fromDate: string, toDate: string): Promise<ActivityLog[]> {
        const { rows } = await pool.query<LogRow>(
            'SELECT * FROM activity_logs WHERE client_id = $1 AND log_date BETWEEN $2 AND $3 ORDER BY log_date DESC',
            [clientId, fromDate, toDate],
        );
        return rows.map(toLog);
    },
};
