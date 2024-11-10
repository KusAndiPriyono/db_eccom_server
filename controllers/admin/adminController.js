const mongoose = require('mongoose');
const { User } = require('../../models/userModel');
const { Order } = require('../../models/orderModel');
const { OrderItem } = require('../../models/order_item');
const { CartProduct } = require('../../models/cartProduct');
const { Token } = require('../../models/token');

exports.getUserCount = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    if (!userCount) {
      return res
        .status(500)
        .json({ message: 'Tidak dapat menghitung jumlah user' });
    }
    return res.json(userCount);
  } catch (error) {
    console.log(error);
    res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.id;
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const orders = await Order.find({ user: userId }).session(session);
    const orderItemIds = orders.flatMap((order) => order.orderItems);

    // Hapus order, order items, cart, token terkait user secara atomik
    await Order.deleteMany({ user: userId }).session(session);
    await OrderItem.deleteMany({ _id: { $in: orderItemIds } }).session(session);
    await CartProduct.deleteMany({ _id: { $in: user.cart } }).session(session);
    await Token.deleteOne({ userId }).session(session);
    await User.findByIdAndDelete(userId).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(204).end();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getProductsCount = async (req, res) => {};
exports.addProduct = async (req, res) => {};
exports.editProduct = async (req, res) => {};
exports.deleteProduct = async (req, res) => {};
exports.deleteProductImages = async (req, res) => {};
