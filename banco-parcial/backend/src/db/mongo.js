const { MongoClient } = require('mongodb');

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/banco_read';
const client = new MongoClient(mongoUrl);
let database;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function initMongo() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await client.connect();
      database = client.db();
      await database.collection('transferencias_read').createIndex(
        { transferenciaId: 1 },
        { unique: true }
      );
      console.log('MongoDB conectado y coleccion transferencias_read lista');
      return;
    } catch (error) {
      console.log(`Esperando MongoDB... intento ${attempt}/20`);
      await sleep(1500);
    }
  }

  throw new Error('No fue posible conectar con MongoDB');
}

function getTransferCollection() {
  if (!database) {
    throw new Error('MongoDB todavia no esta inicializado');
  }

  return database.collection('transferencias_read');
}

module.exports = {
  initMongo,
  getTransferCollection
};
