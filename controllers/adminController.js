const { User } = require('../models/userModel');
const { Order } = require('../models/orderModel');
const { OrderItem } = require('../models/order_item');
const { CartProduct } = require('../models/cartProduct');
const { Token } = require('../models/token');

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
  try {
    const userId = await User.findByIdAndDelete(req.params.id);
    if (!userId) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const orders = await Order.find({ user: userId });
    const orderItemId = orders.flatMap((order) => order.orderItems);

    await Order.deleteMany({ user: userId });
    await OrderItem.deleteMany({ _id: { $in: orderItemId } });

    await CartProduct.deleteMany({ _id: { $in: userId.cart } });

    await User.findByIdAndUpdate(userId, {
      $pull: { cart: { $exists: true } },
    });

    await Token.deleteOne({ userId: userId });

    await User.deleteOne({ _id: userId });

    return res.status(204).end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.addCategory = async (req, res) => {};
exports.editCategory = async (req, res) => {};
exports.deleteCategory = async (req, res) => {};

exports.getProductsCount = async (req, res) => {};
exports.addProduct = async (req, res) => {};
exports.editProduct = async (req, res) => {};
exports.deleteProduct = async (req, res) => {};
exports.deleteProductImages = async (req, res) => {};

exports.getOrders = async (req, res) => {};
exports.getOrdersCount = async (req, res) => {};
exports.changeOrderStatus = async (req, res) => {};
