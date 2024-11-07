const { validationResult } = require('express-validator');
const { User } = require('../models/userModel');
const { Token } = require('../models/token');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  } catch {
    return res.json(false);
  }
};

exports.forgotPassword = async () => {};
exports.verifyOTP = async () => {};
exports.resetPassword = async () => {};
