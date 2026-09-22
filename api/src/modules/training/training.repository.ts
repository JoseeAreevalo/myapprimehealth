import { pool } from '../../db/pool';
import { SetLog, TrainingDay, TrainingExercise, TrainingExerciseInput, TrainingPlan } from './training.types';

interface PlanRow {
    id: number;
    client_id: number;
    coach_id: number;
    label: string;
    duration_weeks: number;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
}

interface DayRow {
    id: number;
    plan_id: number;
    day_order: number;
    label: string;
    weekday: number | null;
}

interface ExerciseRow {
    id: number;
    day_id: number;
    name: string;
    target_sets: number;
    target_reps: number;
    target_weight_kg: string | null;
    target_rir: number | null;
    sort_order: number;
}

interface SetLogRow {
    exercise_id: number;
    set_number: number;
    actual_reps: number | null;
    actual_weight_kg: string | null;
    actual_rir: number | null;
}

interface HistoryRow {
    exercise_id: number;
    log_date: string;
    set_number: number;
    actual_reps: number | null;
    actual_weight_kg: string | null;
    actual_rir: number | null;
    exercise_name: string;
    day_label: string;
}

function toPlan(row: PlanRow): TrainingPlan {
    return {
        id: row.id,
        clientId: row.client_id,
        coachId: row.coach_id,
        label: row.label,
        durationWeeks: row.duration_weeks,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
    };
}

function toDay(row: DayRow): TrainingDay {
    return { id: row.id, planId: row.plan_id, dayOrder: row.day_order, label: row.label, weekday: row.weekday };
}

function toExercise(row: ExerciseRow): TrainingExercise {
    return {
        id: row.id,
        dayId: row.day_id,
        name: row.name,
        targetSets: row.target_sets,
        targetReps: row.target_reps,
        targetWeightKg: row.target_weight_kg === null ? null : Number(row.target_weight_kg),
        targetRir: row.target_rir,
        sortOrder: row.sort_order,
    };
}

function toSetLog(row: SetLogRow): SetLog {
    return {
        setNumber: row.set_number,
        actualReps: row.actual_reps,
        actualWeightKg: row.actual_weight_kg === null ? null : Number(row.actual_weight_kg),
        actualRir: row.actual_rir,
    };
}

export const trainingPlansRepository = {
    async findActiveByClientId(clientId: number): Promise<TrainingPlan | undefined> {
        const { rows } = await pool.query<PlanRow>('SELECT * FROM training_plans WHERE client_id = $1 AND is_active = TRUE', [clientId]);
        return rows[0] ? toPlan(rows[0]) : undefined;
    },

    async findById(id: number): Promise<TrainingPlan | undefined> {
        const { rows } = await pool.query<PlanRow>('SELECT * FROM training_plans WHERE id = $1', [id]);
        return rows[0] ? toPlan(rows[0]) : undefined;
    },

    async create(input: { clientId: number; coachId: number; label: string; durationWeeks?: number; startDate?: string | null; endDate?: string | null }): Promise<TrainingPlan> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE training_plans SET is_active = FALSE, updated_at = now() WHERE client_id = $1', [input.clientId]);
            const { rows } = await client.query<PlanRow>(
                `INSERT INTO training_plans (client_id, coach_id, label, duration_weeks, start_date, end_date) VALUES ($1, $2, $3, COALESCE($4, 4), $5, $6) RETURNING *`,
                [input.clientId, input.coachId, input.label, input.durationWeeks ?? null, input.startDate ?? null, input.endDate ?? null],
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

    async update(id: number, updates: { label?: string; durationWeeks?: number; startDate?: string | null; endDate?: string | null }): Promise<TrainingPlan> {
        const { rows } = await pool.query<PlanRow>(
            `UPDATE training_plans SET label = COALESCE($2, label), duration_weeks = COALESCE($3, duration_weeks), start_date = COALESCE($4, start_date), end_date = COALESCE($5, end_date), updated_at = now() WHERE id = $1 RETURNING *`,
            [id, updates.label ?? null, updates.durationWeeks ?? null, updates.startDate ?? null, updates.endDate ?? null],
        );
        return toPlan(rows[0]);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM training_plans WHERE id = $1', [id]);
    },
};

export const trainingDaysRepository = {
    async listByPlanId(planId: number): Promise<TrainingDay[]> {
        const { rows } = await pool.query<DayRow>(
            'SELECT * FROM training_plan_days WHERE plan_id = $1 ORDER BY COALESCE(weekday, 8) ASC, day_order ASC',
            [planId],
        );
        return rows.map(toDay);
    },

    async findById(id: number): Promise<TrainingDay | undefined> {
        const { rows } = await pool.query<DayRow>('SELECT * FROM training_plan_days WHERE id = $1', [id]);
        return rows[0] ? toDay(rows[0]) : undefined;
    },

    async create(planId: number, label: string, dayOrder: number, weekday?: number | null): Promise<TrainingDay> {
        const { rows } = await pool.query<DayRow>(
            `INSERT INTO training_plan_days (plan_id, day_order, label, weekday) VALUES ($1, $2, $3, $4) RETURNING *`,
            [planId, dayOrder, label, weekday ?? null],
        );
        return toDay(rows[0]);
    },

    async update(id: number, updates: { label?: string; weekday?: number | null }): Promise<TrainingDay> {
        const { rows } = await pool.query<DayRow>(
            `UPDATE training_plan_days SET label = COALESCE($2, label), weekday = COALESCE($3, weekday) WHERE id = $1 RETURNING *`,
            [id, updates.label ?? null, updates.weekday ?? null],
        );
        return toDay(rows[0]);
    },

    async countByPlanId(planId: number): Promise<number> {
        const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*) AS count FROM training_plan_days WHERE plan_id = $1', [planId]);
        return Number(rows[0]?.count ?? 0);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM training_plan_days WHERE id = $1', [id]);
    },
};

export const trainingExercisesRepository = {
    async listByDayId(dayId: number): Promise<TrainingExercise[]> {
        const { rows } = await pool.query<ExerciseRow>(
            'SELECT * FROM training_plan_exercises WHERE day_id = $1 ORDER BY sort_order ASC, id ASC',
            [dayId],
        );
        return rows.map(toExercise);
    },

    async findById(id: number): Promise<TrainingExercise | undefined> {
        const { rows } = await pool.query<ExerciseRow>('SELECT * FROM training_plan_exercises WHERE id = $1', [id]);
        return rows[0] ? toExercise(rows[0]) : undefined;
    },

    async create(dayId: number, input: TrainingExerciseInput, sortOrder: number): Promise<TrainingExercise> {
        const { rows } = await pool.query<ExerciseRow>(
            `INSERT INTO training_plan_exercises (day_id, name, target_sets, target_reps, target_weight_kg, target_rir, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [dayId, input.name, input.targetSets, input.targetReps, input.targetWeightKg ?? null, input.targetRir ?? null, sortOrder],
        );
        return toExercise(rows[0]);
    },

    async countByDayId(dayId: number): Promise<number> {
        const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*) AS count FROM training_plan_exercises WHERE day_id = $1', [dayId]);
        return Number(rows[0]?.count ?? 0);
    },

    async update(
        id: number,
        updates: { name?: string; targetSets?: number; targetReps?: number; targetWeightKg?: number | null; targetRir?: number | null },
    ): Promise<TrainingExercise> {
        const { rows } = await pool.query<ExerciseRow>(
            `UPDATE training_plan_exercises
       SET name = COALESCE($2, name),
           target_sets = COALESCE($3, target_sets),
           target_reps = COALESCE($4, target_reps),
           target_weight_kg = COALESCE($5, target_weight_kg),
           target_rir = COALESCE($6, target_rir)
       WHERE id = $1
       RETURNING *`,
            [id, updates.name ?? null, updates.targetSets ?? null, updates.targetReps ?? null, updates.targetWeightKg ?? null, updates.targetRir ?? null],
        );
        return toExercise(rows[0]);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM training_plan_exercises WHERE id = $1', [id]);
    },
};

export const trainingSetLogsRepository = {
    async listForExerciseAndDate(exerciseId: number, logDate: string): Promise<SetLog[]> {
        const { rows } = await pool.query<SetLogRow>(
            'SELECT * FROM training_set_logs WHERE exercise_id = $1 AND log_date = $2 ORDER BY set_number ASC',
            [exerciseId, logDate],
        );
        return rows.map(toSetLog);
    },

    async listForExercisesAndDate(exerciseIds: number[], logDate: string): Promise<Map<number, SetLog[]>> {
        if (exerciseIds.length === 0) return new Map();
        const { rows } = await pool.query<SetLogRow>(
            'SELECT * FROM training_set_logs WHERE exercise_id = ANY($1::int[]) AND log_date = $2 ORDER BY set_number ASC',
            [exerciseIds, logDate],
        );
        const map = new Map<number, SetLog[]>();
        for (const row of rows) {
            const list = map.get(row.exercise_id) ?? [];
            list.push(toSetLog(row));
            map.set(row.exercise_id, list);
        }
        return map;
    },

    async upsertSet(exerciseId: number, logDate: string, setNumber: number, actualReps: number | null, actualWeightKg: number | null, actualRir: number | null): Promise<void> {
        await pool.query(
            `INSERT INTO training_set_logs (exercise_id, log_date, set_number, actual_reps, actual_weight_kg, actual_rir)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (exercise_id, log_date, set_number) DO UPDATE SET
         actual_reps = EXCLUDED.actual_reps,
         actual_weight_kg = EXCLUDED.actual_weight_kg,
         actual_rir = EXCLUDED.actual_rir,
         updated_at = now()`,
            [exerciseId, logDate, setNumber, actualReps, actualWeightKg, actualRir],
        );
    },

    async listHistoryForClient(clientId: number, fromDate: string, toDate: string): Promise<HistoryRow[]> {
        const { rows } = await pool.query<HistoryRow>(
            `SELECT tsl.exercise_id, tsl.log_date::text AS log_date, tsl.set_number, tsl.actual_reps, tsl.actual_weight_kg, tsl.actual_rir,
              tpe.name AS exercise_name, tpd.label AS day_label
       FROM training_set_logs tsl
       JOIN training_plan_exercises tpe ON tpe.id = tsl.exercise_id
       JOIN training_plan_days tpd ON tpd.id = tpe.day_id
       JOIN training_plans tp ON tp.id = tpd.plan_id
       WHERE tp.client_id = $1
         AND tsl.log_date BETWEEN $2 AND $3
         AND (tsl.actual_reps IS NOT NULL OR tsl.actual_weight_kg IS NOT NULL)
       ORDER BY tsl.log_date ASC, tpd.day_order ASC, tpe.sort_order ASC, tsl.set_number ASC`,
            [clientId, fromDate, toDate],
        );
        return rows;
    },
};
