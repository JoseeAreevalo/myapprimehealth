export interface LearningNote {
    id: number;
    title: string;
    body: string;
    createdBy: number | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}
