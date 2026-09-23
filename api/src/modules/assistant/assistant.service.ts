import { AuthenticatedUser } from '../identity/identity.types';
import { learningNotesRepository } from '../learning/learning.repository';
import { createPeopleService } from '../people/people.service';

class ValidationError extends Error { }
export { ValidationError };

const peopleService = createPeopleService();

const NO_KNOWLEDGE_MESSAGE = 'No tengo información sobre eso. Para mayor información contacta a tu coach o al administrador.';

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

const STOPWORDS = new Set([
    'que', 'es', 'el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'unos', 'unas', 'en', 'y', 'o',
    'con', 'por', 'para', 'sin', 'como', 'mas', 'cada', 'tu', 'mi', 'son', 'este', 'esta', 'al', 'se',
]);

// Significant (non-stopword) words from a note title, used to match a user message to a specific
// learning note by whole-word overlap (e.g. title "¿Qué es el RIR?" -> keyword "rir").
function significantWords(text: string): string[] {
    return normalize(text)
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
}

function hasWord(message: string, word: string): boolean {
    return new RegExp(`\\b${word}\\b`).test(message);
}

// Simple keyword -> answer FAQ about how to use the app. Checked only after the learning notes
// search fails to find a more specific match, and finally falls back to NO_KNOWLEDGE_MESSAGE.
// No AI/LLM calls — this bot is intentionally rule-based to avoid any paid API usage.
const FAQ: { keywords: string[]; answer: string }[] = [
    { keywords: ['coach', 'entrenador'], answer: '__COACH__' },
    { keywords: ['nutricion', 'dieta', 'comida', 'comidas', 'macro'], answer: 'En la sección "Nutrición" puedes ver tu plan de comidas, registrar lo que comes y tu consumo de agua.' },
    { keywords: ['entrenamiento', 'rutina', 'ejercicio', 'series', 'repeticion'], answer: 'En la sección "Entrenamiento" puedes ver tu rutina semanal y registrar tus series (repeticiones, peso y RIR) de cada ejercicio.' },
    { keywords: ['actividad', 'cardio', 'pasos', 'heat', 'neat'], answer: 'En la sección "Actividad" puedes ver tus metas de cardio (HEAT) y pasos diarios (NEAT), y registrar cuánto hiciste cada día.' },
    { keywords: ['progreso', 'peso', 'adherencia', 'check-in', 'checkin', 'check in'], answer: 'En la sección "Progreso" puedes ver tu historial de check-ins semanales (peso y adherencia).' },
    { keywords: ['aprendizaje', 'nota', 'termino'], answer: 'En la sección "Aprendizaje" (ícono junto a las notificaciones) encuentras notas cortas sobre términos de nutrición y entrenamiento.' },
    { keywords: ['contrasena', 'password', 'perfil', 'cuenta', 'telefono', 'correo'], answer: 'Puedes editar tu correo, teléfono y datos de perfil desde el menú de tu usuario (arriba a la derecha) → "Mi perfil".' },
];

async function describeCoach(requester: AuthenticatedUser): Promise<string> {
    if (requester.role !== 'client') return 'Solo los clientes tienen un coach asignado.';
    const coach = await peopleService.getClientCoach(requester, requester.id);
    if (!coach) return 'Todavía no tienes un coach asignado.';
    return `Tu coach asignado es ${coach.fullName ?? coach.email} (${coach.email}).`;
}

export function createAssistantService() {
    return {
        async chat(requester: AuthenticatedUser, message: string): Promise<string> {
            if (!message?.trim()) throw new ValidationError('Escribe un mensaje.');
            const normalized = normalize(message);

            const notes = await learningNotesRepository.list();
            const noteMatch = notes.find((note) => significantWords(note.title).some((word) => hasWord(normalized, word)));
            if (noteMatch) return `${noteMatch.title}: ${noteMatch.body}`;

            const faqMatch = FAQ.find((entry) => entry.keywords.some((keyword) => normalized.includes(normalize(keyword))));
            if (faqMatch) {
                return faqMatch.answer === '__COACH__' ? describeCoach(requester) : faqMatch.answer;
            }

            return NO_KNOWLEDGE_MESSAGE;
        },
    };
}
