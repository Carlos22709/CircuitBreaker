const {
  getPendingTransfers,
  markTransferAsSynced,
  upsertTransferInMongo
} = require('./transfer.service');

let isSyncing = false;

async function syncPendingTransfers() {
  if (isSyncing) {
    return { synced: 0, skipped: true };
  }

  isSyncing = true;
  let synced = 0;

  try {
    const pendingTransfers = await getPendingTransfers();

    for (const transfer of pendingTransfers) {
      console.log('Sincronizando transferencia a MongoDB');
      await upsertTransferInMongo(transfer);
      await markTransferAsSynced(transfer.id);
      console.log('Transferencia sincronizada correctamente');
      synced += 1;
    }

    return { synced, skipped: false };
  } finally {
    isSyncing = false;
  }
}

function startSyncWorker() {
  console.log('Worker de sincronizacion iniciado: cada 5 segundos');
  setInterval(() => {
    syncPendingTransfers().catch((error) => {
      console.error('Error sincronizando transferencias', error);
    });
  }, 5000);
}

module.exports = {
  startSyncWorker,
  syncPendingTransfers
};
