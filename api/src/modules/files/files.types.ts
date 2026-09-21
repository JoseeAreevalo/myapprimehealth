export type FileRelatedType = 'check_in';

export interface StoredFile {
    id: number;
    ownerId: number;
    relatedType: FileRelatedType;
    relatedId: number;
    storedName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
}
