const express = require('express');
const router = express.Router();

const checkoutController = require('../controllers/checkoutController');

router.post('/', checkoutController.checkout);
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  checkoutController.webhook
);

module.exports = router;
