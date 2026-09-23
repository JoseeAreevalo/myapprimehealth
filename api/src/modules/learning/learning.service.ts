import { AuthenticatedUser } from '../identity/identity.types';
import { learningNotesRepository } from './learning.repository';
import { LearningNote } from './learning.types';

class ForbiddenError extends Error { }
class NotFoundError extends Error { }
class ValidationError extends Error { }

export { ForbiddenError, NotFoundError, ValidationError };

function assertIsSuperAdmin(requester: AuthenticatedUser): void {
    if (requester.role !== 'super_admin') throw new ForbiddenError('Solo un super admin puede administrar el contenido de Aprendizaje.');
}

function validateNoteInput(title: string, body: string): void {
    if (!title?.trim()) throw new ValidationError('El título de la nota es obligatorio.');
    if (!body?.trim()) throw new ValidationError('La descripción de la nota es obligatoria.');
}

export function createLearningService() {
    return {
        async listNotes(): Promise<LearningNote[]> {
            return learningNotesRepository.list();
        },

        async createNote(requester: AuthenticatedUser, input: { title: string; body: string }): Promise<LearningNote> {
            assertIsSuperAdmin(requester);
            validateNoteInput(input.title, input.body);
            const sortOrder = await learningNotesRepository.nextSortOrder();
            return learningNotesRepository.create({ title: input.title.trim(), body: input.body.trim(), createdBy: requester.id, sortOrder });
        },

        async updateNote(requester: AuthenticatedUser, noteId: number, updates: { title?: string; body?: string }): Promise<LearningNote> {
            assertIsSuperAdmin(requester);
            const note = await learningNotesRepository.findById(noteId);
            if (!note) throw new NotFoundError('No se encontró la nota.');
            if (updates.title !== undefined && !updates.title.trim()) throw new ValidationError('El título de la nota es obligatorio.');
            if (updates.body !== undefined && !updates.body.trim()) throw new ValidationError('La descripción de la nota es obligatoria.');
            return learningNotesRepository.update(noteId, { title: updates.title?.trim(), body: updates.body?.trim() });
        },

        async deleteNote(requester: AuthenticatedUser, noteId: number): Promise<void> {
            assertIsSuperAdmin(requester);
            const note = await learningNotesRepository.findById(noteId);
            if (!note) throw new NotFoundError('No se encontró la nota.');
            await learningNotesRepository.delete(noteId);
        },
    };
}
