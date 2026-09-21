import 'dotenv/config';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { runMigrations } from './db/migrate';
import identityRouter, { bootstrapSuperAdmin } from './modules/identity/identity.router';
import peopleRouter from './modules/people/people.router';
import nutritionRouter from './modules/nutrition/nutrition.router';
import checkInsRouter from './modules/checkIns/checkIns.router';
import progressRouter from './modules/progress/progress.router';
import administrationRouter from './modules/administration/administration.router';
import notificationsRouter from './modules/notifications/notifications.router';
import filesRouter from './modules/files/files.router';
import foodsRouter from './modules/foods/foods.router';
import hydrationRouter from './modules/hydration/hydration.router';
import trainingRouter from './modules/training/training.router';
import exercisesRouter from './modules/exercises/exercises.router';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  'http://localhost:5137',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5137',
  'http://127.0.0.1:5173',
];
const allowedOrigins = (process.env.API_CORS_ORIGINS ?? defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin ?? 'unknown'}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '64kb' }));

const openApi = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'Prime Health API', version: '0.1.0', description: 'Prime Health platform API.' },
    servers: [{ url: `http://localhost:${port}`, description: 'Development server' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
  },
  apis: ['./src/modules/**/*.ts'],
});

app.get('/health', (_req, res): void => {
  res.status(200).json({ status: 'ok' });
});
app.use('/api/v1/identity', identityRouter);
app.use('/api/v1/people', peopleRouter);
app.use('/api/v1/nutrition', nutritionRouter);
app.use('/api/v1/check-ins', checkInsRouter);
app.use('/api/v1/progress', progressRouter);
app.use('/api/v1/administration', administrationRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/files', filesRouter);
app.use('/api/v1/training', trainingRouter);
app.use('/api/v1/exercises', exercisesRouter);
app.use('/api/v1/foods', foodsRouter);
app.use('/api/v1/hydration', hydrationRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApi));
app.get('/api-docs.json', (_req, res): void => {
  res.json(openApi);
});

app.use((_req, res): void => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado.' } });
});
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.' } });
});

async function start(): Promise<void> {
  await runMigrations();
  await bootstrapSuperAdmin();
  app.listen(port, () => console.log(`Prime Health API listening on port ${port}.`));
}

start().catch((error) => {
  console.error('Failed to start the Prime Health API.', error);
  process.exit(1);
});
