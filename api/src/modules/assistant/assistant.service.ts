import { AiNotConfiguredError, generateChatReply } from '../ai/ai.client';
import { learningNotesRepository } from '../learning/learning.repository';

class ValidationError extends Error { }
export { ValidationError };

const APP_DESCRIPTION = `Prime Health es una plataforma de coaching de nutrición y entrenamiento con tres roles:
- Cliente: ve y registra su plan de nutrición (comidas, agua, macros), su plan de entrenamiento (series/reps/peso/RIR), su actividad diaria (HEAT = cardio, NEAT = pasos), sus check-ins semanales (peso, adherencia) y su progreso, y consulta la sección "Aprendizaje" con notas educativas.
- Coach: además de su propio espacio, gestiona a sus clientes desde "Planes Clientes" (crear/editar dietas y rutinas) y "Revisión de Clientes" (ver seguimiento y progreso), y configura Actividad de clientes.
- Super admin: administra perfiles de usuario (Configuración de perfiles) y el contenido de la sección Aprendizaje.
Secciones del menú: Resumen, Nutrición, Entrenamiento, Actividad, Progreso, Aprendizaje (para todos); Planes Clientes, Actividad de clientes, Revisión de Clientes (solo coach); Configuración de perfiles (solo super admin).`;

function localFallbackAnswer(message: string, notes: { title: string; body: string }[]): string {
    const normalized = message.toLowerCase();
    const match = notes.find(
        (note) => normalized.includes(note.title.toLowerCase()) || note.title.toLowerCase().split(/\s+/).some((word) => word.length > 3 && normalized.includes(word)),
    );
    if (match) return `${match.title}: ${match.body}`;
    return 'No tengo una IA configurada en este servidor para responder libremente (falta OPENAI_API_KEY), pero puedo ayudarte a buscar en la sección Aprendizaje o guiarte por la app: pregunta por un término como "RIR", "sobrecarga progresiva" o "macros", o dime qué sección buscas (Nutrición, Entrenamiento, Actividad, Progreso).';
}

export function createAssistantService() {
    return {
        async chat(message: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
            if (!message?.trim()) throw new ValidationError('Escribe un mensaje.');
            const notes = await learningNotesRepository.list();
            try {
                const reply = await generateChatReply([
                    {
                        role: 'system',
                        content:
                            `Eres el asistente de ayuda de Prime Health. Responde en español, de forma breve y clara, ` +
                            `únicamente sobre temas relacionados a esta app (nutrición, entrenamiento, actividad, progreso, uso de la plataforma). ` +
                            `Aquí tienes una descripción de la app:\n${APP_DESCRIPTION}\n\n` +
                            `Y estas son las notas educativas disponibles en la sección Aprendizaje, úsalas como referencia cuando apliquen:\n` +
                            notes.map((note) => `- ${note.title}: ${note.body}`).join('\n'),
                    },
                    ...history.slice(-8).map((turn) => ({ role: turn.role, content: turn.content })),
                    { role: 'user', content: message.trim() },
                ]);
                return reply;
            } catch (error) {
                if (error instanceof AiNotConfiguredError) return localFallbackAnswer(message, notes);
                throw error;
            }
        },
    };
}
