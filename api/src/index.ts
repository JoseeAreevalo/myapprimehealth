import 'dotenv/config';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { identityRouter } from './modules/identity/identity.router';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const allowedOrigins = (process.env.API_CORS_ORIGINS ?? 'http://localhost:5137,http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }));
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApi));
app.get('/api-docs.json', (_req, res): void => {
  res.json(openApi);
});

app.use((_req, res): void => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found.' } });
});
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
});

app.listen(port, () => console.log(`Prime Health API listening on port ${port}.`));
