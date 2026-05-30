const { pool } = require('../db/postgres');
const { getTransferCollection } = require('../db/mongo');

function mapSqlTransfer(row) {
  return {
    id: row.id,
    cuentaOrigen: row.cuenta_origen,
    cuentaDestino: row.cuenta_destino,
    monto: Number(row.monto),
    estado: row.estado,
    fechaCreacion: row.fecha_creacion,
    sincronizada: row.sincronizada
  };
}

function mapSqlTransferToReadModel(row) {
  return {
    transferenciaId: row.id,
    cuentaOrigen: row.cuenta_origen,
    cuentaDestino: row.cuenta_destino,
    monto: Number(row.monto),
    estado: row.estado,
    fechaCreacion: row.fecha_creacion
  };
}

async function createTransfer({ cuentaOrigen, cuentaDestino, monto }) {
  const result = await pool.query(
    `
      INSERT INTO transferencias_cmd
        (cuenta_origen, cuenta_destino, monto, estado, sincronizada)
      VALUES ($1, $2, $3, 'COMPLETADA', FALSE)
      RETURNING *;
    `,
    [cuentaOrigen, cuentaDestino, monto]
  );

  console.log('Transferencia creada en SQL');
  return mapSqlTransfer(result.rows[0]);
}

async function getTransfersFromSql() {
  const result = await pool.query(`
    SELECT *
    FROM transferencias_cmd
    ORDER BY id DESC;
  `);

  return result.rows.map(mapSqlTransfer);
}

async function getPendingTransfers() {
  const result = await pool.query(`
    SELECT *
    FROM transferencias_cmd
    WHERE sincronizada = FALSE
    ORDER BY id ASC;
  `);

  return result.rows;
}

async function markTransferAsSynced(id) {
  await pool.query(
    'UPDATE transferencias_cmd SET sincronizada = TRUE WHERE id = $1;',
    [id]
  );
}

async function getTransfersFromMongo() {
  const transfers = await getTransferCollection()
    .find({})
    .sort({ transferenciaId: -1 })
    .toArray();

  return transfers.map(({ _id, ...transfer }) => transfer);
}

async function upsertTransferInMongo(row) {
  const readModel = mapSqlTransferToReadModel(row);

  await getTransferCollection().updateOne(
    { transferenciaId: readModel.transferenciaId },
    { $set: readModel },
    { upsert: true }
  );
}

module.exports = {
  createTransfer,
  getTransfersFromSql,
  getTransfersFromMongo,
  getPendingTransfers,
  markTransferAsSynced,
  upsertTransferInMongo
};
