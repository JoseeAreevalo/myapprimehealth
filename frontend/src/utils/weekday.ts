import { NutritionDayConfig } from '../hooks/useNutritionToday';

// Monday=1 .. Sunday=7, matching the training module's weekday convention.
export function todayWeekday(): number {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
}

export function findActiveDayConfig(dayConfigs: NutritionDayConfig[], weekday: number = todayWeekday()): NutritionDayConfig | undefined {
    return dayConfigs.find((config) => config.weekdays.includes(weekday));
}
