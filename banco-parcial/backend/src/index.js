const express = require('express');
const cors = require('cors');
const path = require('path');

const { initPostgres } = require('./db/postgres');
const { initMongo } = require('./db/mongo');
const smsRoutes = require('./sms/sms.routes');
const transferRoutes = require('./transfers/transfer.routes');
const { startSyncWorker, syncPendingTransfers } = require('./transfers/syncWorker');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'banco-parcial' });
});

app.use('/api/sms', smsRoutes);
app.use('/api/transferencias', transferRoutes);

app.post('/api/sync', async (req, res, next) => {
  try {
    const result = await syncPendingTransfers();
    res.json({
      message: 'Sincronizacion manual ejecutada',
      ...result
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || 'Error interno del servidor'
  });
});

async function bootstrap() {
  await initPostgres();
  await initMongo();

  startSyncWorker();

  app.listen(port, () => {
    console.log(`Backend listo en http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('No se pudo iniciar el backend', error);
  process.exit(1);
});
