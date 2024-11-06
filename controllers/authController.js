const { validationResult } = require('express-validator');
const { User } = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    return res.status(400).json({ errors: errorMessages });
  }

  try {
    let user = new User({
      ...req.body,
      passwordHash: bcrypt.hashSync(req.body.password, 8),
    });

    user = await user.save();
    if (!user) {
      return res.status(500).json({
        type: 'Internal Server Error',
        message: 'User cannot be created',
      });
    }
    return res.status(201).json(user);
  } catch (error) {
    if (error.message.includes('duplicate key error collection')) {
      return res
        .status(409)
        .json({ type: 'AuthError', message: 'User with email already exists' });
    }
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
exports.login = async (req, res) => {};
exports.forgotPassword = async () => {};
exports.verifyOTP = async () => {};
exports.resetPassword = async () => {};
