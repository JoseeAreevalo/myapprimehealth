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

// Simple keyword -> answer FAQ about how to use the app. Matched before falling back to the
// learning notes search, and finally to NO_KNOWLEDGE_MESSAGE. No AI/LLM calls — this bot is
// intentionally rule-based to avoid any paid API usage.
const FAQ: { keywords: string[]; answer: string }[] = [
    { keywords: ['coach', 'entrenador'], answer: '__COACH__' },
    { keywords: ['nutricion', 'dieta', 'comida', 'comidas', 'macro'], answer: 'En la sección "Nutrición" puedes ver tu plan de comidas, registrar lo que comes y tu consumo de agua.' },
    { keywords: ['entrenamiento', 'rutina', 'ejercicio', 'series', 'repeticion', 'rir'], answer: 'En la sección "Entrenamiento" puedes ver tu rutina semanal y registrar tus series (repeticiones, peso y RIR) de cada ejercicio.' },
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

            const faqMatch = FAQ.find((entry) => entry.keywords.some((keyword) => normalized.includes(normalize(keyword))));
            if (faqMatch) {
                return faqMatch.answer === '__COACH__' ? describeCoach(requester) : faqMatch.answer;
            }

            const notes = await learningNotesRepository.list();
            const noteMatch = notes.find(
                (note) => normalized.includes(normalize(note.title)) || normalize(note.title).split(/\s+/).some((word) => word.length > 3 && normalized.includes(word)),
            );
            if (noteMatch) return `${noteMatch.title}: ${noteMatch.body}`;

            return NO_KNOWLEDGE_MESSAGE;
        },
    };
}
