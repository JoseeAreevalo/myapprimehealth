import { AuthenticatedUser } from '../identity/identity.types';
import { AiNotConfiguredError, generateChatReply } from '../ai/ai.client';
import { learningNotesRepository } from '../learning/learning.repository';
import { createPeopleService } from '../people/people.service';

class ValidationError extends Error { }
export { ValidationError };

const peopleService = createPeopleService();

const APP_DESCRIPTION = `Prime Health es una plataforma de coaching de nutrición y entrenamiento con tres roles:
- Cliente: ve y registra su plan de nutrición (comidas, agua, macros), su plan de entrenamiento (series/reps/peso/RIR), su actividad diaria (HEAT = cardio, NEAT = pasos), sus check-ins semanales (peso, adherencia) y su progreso, y consulta la sección "Aprendizaje" con notas educativas.
- Coach: además de su propio espacio, gestiona a sus clientes desde "Planes Clientes" (crear/editar dietas y rutinas) y "Revisión de Clientes" (ver seguimiento y progreso), y configura Actividad de clientes.
- Super admin: administra perfiles de usuario (Configuración de perfiles) y el contenido de la sección Aprendizaje.
Secciones del menú: Resumen, Nutrición, Entrenamiento, Actividad, Progreso, Aprendizaje (para todos); Planes Clientes, Actividad de clientes, Revisión de Clientes (solo coach); Configuración de perfiles (solo super admin).`;

async function describeCoach(requester: AuthenticatedUser): Promise<string | null> {
    if (requester.role !== 'client') return null;
    const coach = await peopleService.getClientCoach(requester, requester.id);
    if (!coach) return 'Este usuario todavía no tiene un coach asignado.';
    return `El coach asignado a este usuario es ${coach.fullName ?? coach.email} (${coach.email}).`;
}

function isAskingAboutCoach(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('coach') && (normalized.includes('quien') || normalized.includes('quién') || normalized.includes('mi '));
}

function localFallbackAnswer(message: string, notes: { title: string; body: string }[], coachInfo: string | null): string {
    if (coachInfo && isAskingAboutCoach(message)) return coachInfo;
    const normalized = message.toLowerCase();
    const match = notes.find(
        (note) => normalized.includes(note.title.toLowerCase()) || note.title.toLowerCase().split(/\s+/).some((word) => word.length > 3 && normalized.includes(word)),
    );
    if (match) return `${match.title}: ${match.body}`;
    return 'No tengo una IA configurada en este servidor para responder libremente (falta OPENAI_API_KEY), pero puedo ayudarte a buscar en la sección Aprendizaje o guiarte por la app: pregunta por un término como "RIR", "sobrecarga progresiva" o "macros", quién es tu coach, o dime qué sección buscas (Nutrición, Entrenamiento, Actividad, Progreso).';
}

export function createAssistantService() {
    return {
        async chat(requester: AuthenticatedUser, message: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
            if (!message?.trim()) throw new ValidationError('Escribe un mensaje.');
            const [notes, coachInfo] = await Promise.all([learningNotesRepository.list(), describeCoach(requester)]);
            try {
                const reply = await generateChatReply([
                    {
                        role: 'system',
                        content:
                            `Eres un asistente de ayuda simple para la app Prime Health. Responde en español, en 1-3 oraciones, ` +
                            `SOLO sobre: cómo usar la app, dónde está cada sección, quién es el coach del usuario, y términos generales ` +
                            `de nutrición/entrenamiento (como los de la sección Aprendizaje). Si preguntan algo fuera de esos temas, dilo brevemente ` +
                            `y sugiere reformular. Descripción de la app:\n${APP_DESCRIPTION}\n\n` +
                            (coachInfo ? `${coachInfo}\n\n` : '') +
                            `Notas de la sección Aprendizaje disponibles como referencia:\n${notes.map((note) => `- ${note.title}: ${note.body}`).join('\n')}`,
                    },
                    ...history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content })),
                    { role: 'user', content: message.trim() },
                ]);
                return reply;
            } catch (error) {
                if (error instanceof AiNotConfiguredError) return localFallbackAnswer(message, notes, coachInfo);
                throw error;
            }
        },
    };
}
