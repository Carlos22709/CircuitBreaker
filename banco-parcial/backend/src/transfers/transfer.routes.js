const express = require('express');
const {
  createTransfer,
  getTransfersFromSql,
  getTransfersFromMongo
} = require('./transfer.service');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { cuentaOrigen, cuentaDestino, monto } = req.body;
    const parsedAmount = Number(monto);

    if (!cuentaOrigen || !cuentaDestino || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: 'cuentaOrigen, cuentaDestino y monto positivo son obligatorios'
      });
    }

    const transferencia = await createTransfer({
      cuentaOrigen,
      cuentaDestino,
      monto: parsedAmount
    });

    res.status(201).json({
      message: 'Transferencia registrada en SQL',
      transferencia,
      notice: 'Todavia puede no aparecer en las consultas NoSQL por consistencia eventual'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const transferencias = await getTransfersFromMongo();
    res.json({
      source: 'MongoDB',
      transferencias
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sql', async (req, res, next) => {
  try {
    const transferencias = await getTransfersFromSql();
    res.json({
      source: 'PostgreSQL',
      transferencias
    });
  } catch (error) {
    next(error);
  }
});

router.get('/nosql', async (req, res, next) => {
  try {
    const transferencias = await getTransfersFromMongo();
    res.json({
      source: 'MongoDB',
      transferencias
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
