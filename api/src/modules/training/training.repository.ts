import { pool } from '../../db/pool';
import { SetLog, TrainingDay, TrainingExercise, TrainingExerciseInput, TrainingPlan } from './training.types';

interface PlanRow {
    id: number;
    client_id: number;
    coach_id: number;
    label: string;
    is_active: boolean;
}

interface DayRow {
    id: number;
    plan_id: number;
    day_order: number;
    label: string;
}

interface ExerciseRow {
    id: number;
    day_id: number;
    name: string;
    target_sets: number;
    target_reps: number;
    target_weight_kg: string | null;
    sort_order: number;
}

interface SetLogRow {
    exercise_id: number;
    set_number: number;
    actual_reps: number | null;
    actual_weight_kg: string | null;
}

function toPlan(row: PlanRow): TrainingPlan {
    return { id: row.id, clientId: row.client_id, coachId: row.coach_id, label: row.label, isActive: row.is_active };
}

function toDay(row: DayRow): TrainingDay {
    return { id: row.id, planId: row.plan_id, dayOrder: row.day_order, label: row.label };
}

function toExercise(row: ExerciseRow): TrainingExercise {
    return {
        id: row.id,
        dayId: row.day_id,
        name: row.name,
        targetSets: row.target_sets,
        targetReps: row.target_reps,
        targetWeightKg: row.target_weight_kg === null ? null : Number(row.target_weight_kg),
        sortOrder: row.sort_order,
    };
}

function toSetLog(row: SetLogRow): SetLog {
    return {
        setNumber: row.set_number,
        actualReps: row.actual_reps,
        actualWeightKg: row.actual_weight_kg === null ? null : Number(row.actual_weight_kg),
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

    async create(input: { clientId: number; coachId: number; label: string }): Promise<TrainingPlan> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE training_plans SET is_active = FALSE, updated_at = now() WHERE client_id = $1', [input.clientId]);
            const { rows } = await client.query<PlanRow>(
                `INSERT INTO training_plans (client_id, coach_id, label) VALUES ($1, $2, $3) RETURNING *`,
                [input.clientId, input.coachId, input.label],
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

    async update(id: number, updates: { label?: string }): Promise<TrainingPlan> {
        const { rows } = await pool.query<PlanRow>(
            `UPDATE training_plans SET label = COALESCE($2, label), updated_at = now() WHERE id = $1 RETURNING *`,
            [id, updates.label ?? null],
        );
        return toPlan(rows[0]);
    },
};

export const trainingDaysRepository = {
    async listByPlanId(planId: number): Promise<TrainingDay[]> {
        const { rows } = await pool.query<DayRow>('SELECT * FROM training_plan_days WHERE plan_id = $1 ORDER BY day_order ASC', [planId]);
        return rows.map(toDay);
    },

    async findById(id: number): Promise<TrainingDay | undefined> {
        const { rows } = await pool.query<DayRow>('SELECT * FROM training_plan_days WHERE id = $1', [id]);
        return rows[0] ? toDay(rows[0]) : undefined;
    },

    async create(planId: number, label: string, dayOrder: number): Promise<TrainingDay> {
        const { rows } = await pool.query<DayRow>(
            `INSERT INTO training_plan_days (plan_id, day_order, label) VALUES ($1, $2, $3) RETURNING *`,
            [planId, dayOrder, label],
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
            `INSERT INTO training_plan_exercises (day_id, name, target_sets, target_reps, target_weight_kg, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [dayId, input.name, input.targetSets, input.targetReps, input.targetWeightKg ?? null, sortOrder],
        );
        return toExercise(rows[0]);
    },

    async countByDayId(dayId: number): Promise<number> {
        const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*) AS count FROM training_plan_exercises WHERE day_id = $1', [dayId]);
        return Number(rows[0]?.count ?? 0);
    },

    async update(
        id: number,
        updates: { name?: string; targetSets?: number; targetReps?: number; targetWeightKg?: number | null },
    ): Promise<TrainingExercise> {
        const { rows } = await pool.query<ExerciseRow>(
            `UPDATE training_plan_exercises
       SET name = COALESCE($2, name),
           target_sets = COALESCE($3, target_sets),
           target_reps = COALESCE($4, target_reps),
           target_weight_kg = COALESCE($5, target_weight_kg)
       WHERE id = $1
       RETURNING *`,
            [id, updates.name ?? null, updates.targetSets ?? null, updates.targetReps ?? null, updates.targetWeightKg ?? null],
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

    async upsertSet(exerciseId: number, logDate: string, setNumber: number, actualReps: number | null, actualWeightKg: number | null): Promise<void> {
        await pool.query(
            `INSERT INTO training_set_logs (exercise_id, log_date, set_number, actual_reps, actual_weight_kg)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (exercise_id, log_date, set_number) DO UPDATE SET
         actual_reps = EXCLUDED.actual_reps,
         actual_weight_kg = EXCLUDED.actual_weight_kg,
         updated_at = now()`,
            [exerciseId, logDate, setNumber, actualReps, actualWeightKg],
        );
    },
};
