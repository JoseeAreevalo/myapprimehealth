import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Local disk storage for the MVP; swap for S3/Blob storage behind this same interface in production.
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function generateStoredName(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  return `${randomUUID()}${extension}`;
}

export async function saveFile(storedName: string, buffer: Buffer): Promise<void> {
  ensureUploadsDir();
  await fs.promises.writeFile(path.join(UPLOADS_DIR, storedName), buffer);
}

export async function readFile(storedName: string): Promise<Buffer> {
  return fs.promises.readFile(path.join(UPLOADS_DIR, storedName));
}

export async function deleteFile(storedName: string): Promise<void> {
  await fs.promises.rm(path.join(UPLOADS_DIR, storedName), { force: true });
}
