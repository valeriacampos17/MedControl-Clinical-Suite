import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.routes.js';
import { patientsRouter } from './routes/patients.routes.js';
import { appointmentsRouter } from './routes/appointments.routes.js';
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medcontrol-server', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

app.use('/api/patients', requireAuth, patientsRouter);
app.use('/api/appointments', requireAuth, appointmentsRouter);
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

app.listen(PORT, () => {
  console.log(`[medcontrol-server] API + frontend en http://localhost:${PORT}`);
});