import { pool } from '../../db/pool';
import { Food } from './foods.types';

interface FoodRow {
  id: number;
  name: string;
  calories_per_100g: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  barcode: string | null;
  source: string;
}

function toFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    caloriesPer100g: Number(row.calories_per_100g),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
    barcode: row.barcode,
    source: row.source,
  };
}

export const foodsRepository = {
  async search(query: string, limit = 20): Promise<Food[]> {
    const { rows } = await pool.query<FoodRow>(
      'SELECT * FROM foods WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2',
      [`%${query}%`, limit],
    );
    return rows.map(toFood);
  },

  async findByBarcode(barcode: string): Promise<Food | undefined> {
    const { rows } = await pool.query<FoodRow>('SELECT * FROM foods WHERE barcode = $1', [barcode]);
    return rows[0] ? toFood(rows[0]) : undefined;
  },

  async create(input: {
    name: string;
    caloriesPer100g: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    barcode?: string | null;
    source?: string;
    createdBy?: number | null;
  }): Promise<Food> {
    const { rows } = await pool.query<FoodRow>(
      `INSERT INTO foods (name, calories_per_100g, protein_g, carbs_g, fat_g, barcode, source, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.name,
        input.caloriesPer100g,
        input.proteinG,
        input.carbsG,
        input.fatG,
        input.barcode ?? null,
        input.source ?? 'local',
        input.createdBy ?? null,
      ],
    );
    return toFood(rows[0]);
  },
};
