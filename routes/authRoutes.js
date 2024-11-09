const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');

const validateUser = [
  body('name').not().isEmpty().withMessage('Nama tidak boleh kosong'),
  body('email').isEmail().withMessage('Tolong masukkan email yang valid'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password minimal 8 karakter')
    .isStrongPassword()
    .withMessage(
      'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol'
    ),
  body('phone')
    .isMobilePhone()
    .withMessage('Tolong masukkan nomor telepon yang valid'),
];

const validatePassword = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password minimal 8 karakter')
    .isStrongPassword()
    .withMessage(
      'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol'
    ),
];

router.post('/login', authController.login);

router.post('/register', validateUser, authController.register);

router.get('/verify-token', authController.verifyToken);

router.post('/forgot-password', authController.forgotPassword);

router.post('/verify-otp', authController.verifyPasswordResetOTP);

router.post('/reset-password', validatePassword, authController.resetPassword);

module.exports = router;
