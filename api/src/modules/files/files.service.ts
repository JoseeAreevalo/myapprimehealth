import { coachClientsRepository } from '../people/people.repository';
import { checkInsRepository } from '../checkIns/checkIns.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import { filesRepository } from './files.repository';
import { deleteFile, generateStoredName, readFile, saveFile } from './files.storage';
import { StoredFile } from './files.types';

class ForbiddenError extends Error { }
class NotFoundError extends Error { }
class ValidationError extends Error { }

export { ForbiddenError, NotFoundError, ValidationError };

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

async function getCheckInOwnerId(checkInId: number): Promise<number> {
    const checkIn = await checkInsRepository.findById(checkInId);
    if (!checkIn) {
        throw new NotFoundError('Check-in no encontrado.');
    }
    return checkIn.clientId;
}

async function assertCanView(requester: AuthenticatedUser, ownerId: number): Promise<void> {
    if (requester.role === 'super_admin') return;
    if (requester.id === ownerId) return;
    if (requester.role === 'coach') {
        const link = await coachClientsRepository.findActiveByClientId(ownerId);
        if (link && link.coachId === requester.id) return;
    }
    throw new ForbiddenError('No tienes permiso para acceder a este archivo.');
}

export function createFilesService() {
    return {
        async uploadCheckInPhoto(
            requester: AuthenticatedUser,
            checkInId: number,
            file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
        ): Promise<StoredFile> {
            const ownerId = await getCheckInOwnerId(checkInId);
            if (requester.role !== 'super_admin' && requester.id !== ownerId) {
                throw new ForbiddenError('Solo puedes adjuntar fotos a tu propio check-in.');
            }
            if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
                throw new ValidationError('Solo se permiten imágenes JPEG, PNG o WebP.');
            }
            if (file.size > MAX_SIZE_BYTES) {
                throw new ValidationError('El archivo supera el límite de 5 MB.');
            }

            const storedName = generateStoredName(file.originalname);
            await saveFile(storedName, file.buffer);

            return filesRepository.create({
                ownerId,
                relatedType: 'check_in',
                relatedId: checkInId,
                storedName,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
            });
        },

        async listCheckInPhotos(requester: AuthenticatedUser, checkInId: number): Promise<StoredFile[]> {
            const ownerId = await getCheckInOwnerId(checkInId);
            await assertCanView(requester, ownerId);
            return filesRepository.listByRelated('check_in', checkInId);
        },

        async getFileForDownload(requester: AuthenticatedUser, fileId: number): Promise<{ meta: StoredFile; buffer: Buffer }> {
            const meta = await filesRepository.findById(fileId);
            if (!meta) {
                throw new NotFoundError('Archivo no encontrado.');
            }
            await assertCanView(requester, meta.ownerId);
            const buffer = await readFile(meta.storedName);
            return { meta, buffer };
        },

        async deleteFile(requester: AuthenticatedUser, fileId: number): Promise<void> {
            const meta = await filesRepository.findById(fileId);
            if (!meta) {
                throw new NotFoundError('Archivo no encontrado.');
            }
            if (requester.role !== 'super_admin' && requester.id !== meta.ownerId) {
                throw new ForbiddenError('Solo puedes eliminar tus propios archivos.');
            }
            await deleteFile(meta.storedName);
            await filesRepository.delete(fileId);
        },
    };
}
