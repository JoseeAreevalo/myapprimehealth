import { AuthenticatedUser } from '../identity/identity.types';
import { coachClientsRepository } from '../people/people.repository';
import { foodsRepository } from './foods.repository';
import { Food } from './foods.types';

class ValidationError extends Error { }
class NotFoundError extends Error { }
class ForbiddenError extends Error { }

export { ValidationError, NotFoundError, ForbiddenError };

// Clients being coached must follow their coach's catalog; only self-managed clients, coaches, and admins may extend it.
async function assertCanExtendCatalog(requester: AuthenticatedUser): Promise<void> {
    if (requester.role !== 'client') return;
    const link = await coachClientsRepository.findActiveByClientId(requester.id);
    if (link) {
        throw new ForbiddenError('Tu coach define los alimentos disponibles; no puedes agregar nuevos.');
    }
}

interface OpenFoodFactsResponse {
    status: number;
    product?: {
        product_name?: string;
        nutriments?: {
            'energy-kcal_100g'?: number;
            proteins_100g?: number;
            carbohydrates_100g?: number;
            fat_100g?: number;
        };
    };
}

async function fetchFromOpenFoodFacts(barcode: string): Promise<Food | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`, {
            signal: controller.signal,
        });
        if (!res.ok) return null;

        const data = (await res.json()) as OpenFoodFactsResponse;
        if (data.status !== 1 || !data.product) return null;

        const nutriments = data.product.nutriments ?? {};
        const caloriesPer100g = nutriments['energy-kcal_100g'];
        if (caloriesPer100g == null) return null;

        return {
            id: 0,
            name: data.product.product_name || `Producto ${barcode}`,
            caloriesPer100g,
            proteinG: nutriments.proteins_100g ?? 0,
            carbsG: nutriments.carbohydrates_100g ?? 0,
            fatG: nutriments.fat_100g ?? 0,
            barcode,
            source: 'openfoodfacts',
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export function createFoodsService() {
    return {
        async search(query: string): Promise<Food[]> {
            if (!query || query.trim().length < 2) {
                throw new ValidationError('Escribe al menos 2 caracteres para buscar.');
            }
            return foodsRepository.search(query.trim());
        },

        async create(requester: AuthenticatedUser, input: { name: string; caloriesPer100g: number; proteinG?: number; carbsG?: number; fatG?: number }): Promise<Food> {            await assertCanExtendCatalog(requester);
            if (!input.name || !input.name.trim()) {
                throw new ValidationError('El nombre del alimento es obligatorio.');
            }
            if (!Number.isFinite(input.caloriesPer100g) || input.caloriesPer100g < 0) {
                throw new ValidationError('Las calor\u00edas por 100g deben ser un n\u00famero v\u00e1lido.');
            }

            return foodsRepository.create({
                name: input.name.trim(),
                caloriesPer100g: input.caloriesPer100g,
                proteinG: input.proteinG ?? 0,
                carbsG: input.carbsG ?? 0,
                fatG: input.fatG ?? 0,
                createdBy: requester.id,
            });
        },

        async lookupBarcode(barcode: string): Promise<Food> {
            const existing = await foodsRepository.findByBarcode(barcode);
            if (existing) return existing;

            const remote = await fetchFromOpenFoodFacts(barcode);
            if (!remote) {
                throw new NotFoundError('No se encontr\u00f3 informaci\u00f3n para ese c\u00f3digo de barras.');
            }

            return foodsRepository.create({
                name: remote.name,
                caloriesPer100g: remote.caloriesPer100g,
                proteinG: remote.proteinG,
                carbsG: remote.carbsG,
                fatG: remote.fatG,
                barcode,
                source: 'openfoodfacts',
            });
        },
    };
}
