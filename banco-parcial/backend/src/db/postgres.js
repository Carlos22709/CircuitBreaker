const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || 'admin',
  password: process.env.POSTGRES_PASSWORD || 'admin',
  database: process.env.POSTGRES_DB || 'banco'
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function initPostgres() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS transferencias_cmd (
          id SERIAL PRIMARY KEY,
          cuenta_origen VARCHAR(50) NOT NULL,
          cuenta_destino VARCHAR(50) NOT NULL,
          monto NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
          estado VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA',
          fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
          sincronizada BOOLEAN NOT NULL DEFAULT FALSE
        );
      `);
      console.log('PostgreSQL conectado y tabla transferencias_cmd lista');
      return;
    } catch (error) {
      console.log(`Esperando PostgreSQL... intento ${attempt}/20`);
      await sleep(1500);
    }
  }

  throw new Error('No fue posible conectar con PostgreSQL');
}

module.exports = {
  pool,
  initPostgres
};
