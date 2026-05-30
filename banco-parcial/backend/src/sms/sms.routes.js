const express = require('express');
const { CircuitBreaker } = require('./circuitBreaker');
const {
  sendWithAldeamo,
  forceAldeamoFailure,
  recoverAldeamo,
  isAldeamoFailing
} = require('./aldeamoProvider');
const { sendWithTwilio } = require('./twilioProvider');

const router = express.Router();
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeoutMs: 30000
});

async function sendSms(req, res, next) {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'phone y message son obligatorios' });
    }

    if (!circuitBreaker.allowRequest()) {
      await sendWithTwilio({ phone, message });
      return res.json({
        status: 'SENT',
        provider: 'TWILIO',
        circuitState: circuitBreaker.getState(),
        fallback: true,
        transition: circuitBreaker.snapshot().lastTransition
      });
    }

    try {
      await sendWithAldeamo({ phone, message });
      circuitBreaker.recordSuccess();

      return res.json({
        status: 'SENT',
        provider: 'ALDEAMO',
        circuitState: circuitBreaker.getState(),
        fallback: false,
        transition: circuitBreaker.snapshot().lastTransition
      });
    } catch (error) {
      circuitBreaker.recordFailure();
      await sendWithTwilio({ phone, message });

      return res.json({
        status: 'SENT',
        provider: 'TWILIO',
        circuitState: circuitBreaker.getState(),
        fallback: true,
        transition: circuitBreaker.snapshot().lastTransition,
        reason: error.message
      });
    }
  } catch (error) {
    next(error);
  }
}

router.post('/send', sendSms);
router.post('/pagar', sendSms);

router.get('/circuit-state', (req, res) => {
  res.json({
    ...circuitBreaker.snapshot(),
    aldeamoFailing: isAldeamoFailing()
  });
});

router.post('/aldeamo/fail', (req, res) => {
  forceAldeamoFailure();
  res.json({
    message: 'Aldeamo simulado ahora falla',
    aldeamoFailing: isAldeamoFailing(),
    circuit: circuitBreaker.snapshot()
  });
});

router.post('/aldeamo/recover', (req, res) => {
  recoverAldeamo();
  res.json({
    message: 'Aldeamo simulado recuperado',
    aldeamoFailing: isAldeamoFailing(),
    circuit: circuitBreaker.snapshot()
  });
});

module.exports = router;
