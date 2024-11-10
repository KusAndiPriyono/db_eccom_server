const { OrderItem } = require('../../models/order_item');
const { Order } = require('../../models/orderModel');
const { Product } = require('../../models/productModel');

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .select('-statusHistory')
      .populate('user', 'name email')
      .sort({ dateOrdered: -1 })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          select: 'name',
          populate: { path: 'category', select: 'name' },
        },
      });

    if (!orders) {
      return res.status(404).json({ message: 'Orders tidak ditemukan' });
    }
    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getOrdersCount = async (req, res) => {
  try {
    const count = await Order.countDocuments();
    if (!count) {
      return res
        .status(500)
        .json({ message: 'tidak dapat menghitung jumlah order' });
    }
    return res.json(count);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.changeOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }
    if (!order.statusHistory.includes(order.status)) {
      order.statusHistory.push(order.status);
    }

    order.status = newStatus;
    order = await order.save();
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    for (const orderItemId of order.orderItems) {
      await OrderItem.findByIdAndDelete(orderItemId);
    }
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
