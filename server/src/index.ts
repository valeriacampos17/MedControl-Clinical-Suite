import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.routes.js';
import { patientsRouter } from './routes/patients.routes.js';
import { appointmentsRouter } from './routes/appointments.routes.js';
import { availabilityRouter } from './routes/availability.routes.js';
import { doctorsRouter } from './routes/doctors.routes.js';
import { consultationsRouter } from './routes/consultations.routes.js';
import { catalogsRouter } from './routes/catalogs.routes.js';
import { configRouter } from './routes/config.routes.js';
import { recordsRouter } from './routes/records.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);

migrate();
seed();

const app = express();
app.use(express.json({ limit: '1mb' }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowAnyOrigin = allowedOrigins.includes('*');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowAnyOrigin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medcontrol-server', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

app.use('/api/patients', requireAuth, patientsRouter);
app.use('/api/appointments', requireAuth, appointmentsRouter);
app.use('/api/availability', requireAuth, availabilityRouter);
app.use('/api/doctors', requireAuth, doctorsRouter);
app.use('/api/consultations', requireAuth, consultationsRouter);
app.use('/api/catalogs', requireAuth, catalogsRouter);
app.use('/api/config', requireAuth, configRouter);
app.use('/api/records', requireAuth, recordsRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

const distDir = path.resolve(__dirname, '../../dist/medcontrol-clinical-suite/browser');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/*splat', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Sin esto Express responde con su HTML generico y el mensaje del error nunca
// llega al cliente: el 500 de produccion era imposible de leer desde la app.
// El stack completo igual va a stderr, que es lo que Render muestra en Logs.
// Express identifica un middleware de error por su aridad: hay que declarar
// el cuarto argumento aunque no se use.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[medcontrol-server] error no atendido:', err);
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`[medcontrol-server] API + frontend en http://localhost:${PORT}`);
});