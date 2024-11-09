const { validationResult } = require('express-validator');
const { User } = require('../models/userModel');
const { Token } = require('../models/token');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mailSender = require('../helpers/email_sender');

// Helper function for sending errors
const sendError = (res, code, type, message) =>
  res.status(code).json({ type, message });

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors
        .array()
        .map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  try {
    const user = new User({
      ...req.body,
      passwordHash: bcrypt.hashSync(req.body.password, 8),
    });
    const savedUser = await user.save();
    if (!savedUser)
      return sendError(
        res,
        500,
        'Internal Server Error',
        'User tidak dapat dibuat'
      );

    return res.status(201).json(savedUser);
  } catch (error) {
    console.error(error);
    if (error.message.includes('duplicate key error collection')) {
      return sendError(res, 409, 'AuthError', 'User dengan Email sudah ada.');
    }
    return sendError(res, 500, error.name, error.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const errorMessage = !user
      ? 'Email tidak ditemukan'
      : !bcrypt.compareSync(password, user.passwordHash)
      ? 'Password salah'
      : null;

    if (errorMessage) {
      return sendError(res, 400, 'AuthError', errorMessage);
    }

    const accessToken = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '60d' }
    );

    await Token.findOneAndDelete({ userId: user.id });
    await new Token({ userId: user.id, accessToken, refreshToken }).save();

    return res.json({ ...user._doc, accessToken });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, error.name, error.message);
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const accessToken = req.headers.authorization
      ?.replace('Bearer ', '')
      .trim();
    if (!accessToken) return res.json(false);

    const token = await Token.findOne({ accessToken });
    if (!token) return res.json(false);

    const { id } = jwt.verify(
      token.refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(id);
    return res.json(!!user);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'AuthError', 'Internal Server Error');
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(
        res,
        404,
        'AuthError',
        'User dengan Email tidak ditemukan'
      );
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 600000;
    await user.save();

    const response = await mailSender.sendEmail(
      email,
      'Reset Password OTP',
      `Kode OTP untuk reset password anda adalah ${otp}`
    );

    // if (response.statusCode === 500) {
    //   return sendError(res, 500, response.message);
    // } else if (response.statusCode === 200) {
    //   return res.json({
    //     message: 'Password reset OTP sudah dikirim ke email anda',
    //   });
    // }

    return res.json({
      message: response.message,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, error.name, error.message);
  }
};

exports.verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(
        res,
        404,
        'AuthError',
        'User dengan Email tidak ditemukan'
      );
    }

    if (
      user.resetPasswordOtp !== +otp ||
      Date.now() > user.resetPasswordOtpExpires
    ) {
      return sendError(
        res,
        400,
        'AuthError',
        'OTP tidak valid atau sudah kadaluarsa'
      );
    }

    // if (user.resetPasswordOtp !== otp) {
    //   return sendError(res, 400, 'AuthError', 'OTP tidak valid');
    // }

    // if (user.resetPasswordOtpExpires < Date.now()) {
    //   return sendError(res, 400, 'AuthError', 'OTP sudah kadaluarsa');
    // }

    user.resetPasswordOtp = 1;
    user.resetPasswordOtpExpires = undefined;

    await user.save();

    return res.json({
      message: 'Konfirmasi OTP berhasil',
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, error.name, error.message);
  }
};

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors
        .array()
        .map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(
        res,
        404,
        'AuthError',
        'User dengan Email tidak ditemukan'
      );
    }

    if (user.resetPasswordOtp !== 1) {
      return sendError(
        res,
        401,
        'AuthError',
        'Anda belum melakukan verifikasi OTP'
      );
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 8);
    user.resetPasswordOtp = undefined;
    await user.save();

    return res.json({
      message: 'Password berhasil direset',
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, error.name, error.message);
  }
};
