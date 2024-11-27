const jwt = require('jsonwebtoken');
const midtransClient = require('midtrans-client');

const { User } = require('../models/userModel');
const { Product } = require('../models/productModel');
const orderController = require('./orders');
const emailSender = require('../helpers/email_sender');
const mailBuilder = require('../helpers/order_complete_email_builder');

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

exports.checkout = async (req, res) => {
  const accessToken = req.header('Authorization').replace('Bearer ', '').trim();
  const tokenData = jwt.decode(accessToken);

  const user = await User.findById(tokenData.id);
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }

  const cartItems = req.body.cartItems;
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  for (const cartItem of cartItems) {
    const product = await Product.findById(cartItem.productId);
    if (!product) {
      return res
        .status(404)
        .json({ message: `${cartItem.name} tidak ditemukan` });
    } else if (!cartItem.reserved && product.countInStock < cartItem.quantity) {
      const message = `${product.name}\nPesanan untuk ${cartItem.quantity}, tapi stok hanya ${product.countInStock}`;
      return res.status(400).json({ message });
    }
  }

  //create midtrans transaction
  const transactionParams = {
    transaction_details: {
      order_id: `ORDER-${Date.now()}`,
      gross_amount: cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    },
    customer_details: {
      first_name: user.name,
      email: user.email,
      phone: user.phone,
    },
    item_details: req.body.cartItems.map((item) => ({
      id: item.productId,
      price: item.price,
      quantity: item.quantity,
      name: item.name,
    })),
    credit_card: {
      secure: true,
    },
  };

  try {
    const transaction = await snap.createTransaction(transactionParams);
    return res.status(200).json({ url: transaction.redirect_url });
  } catch (error) {
    console.log('Midtrans transaction error:', error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.webhook = async function (req, res) {
  const signatureKey = req.headers['x-callback-signature'];
  const body = req.body;
  const computedSignature = crypto
    .createHmac('sha512', process.env.MIDTRANS_SERVER_KEY)
    .update(JSON.stringify(body))
    .digest('hex');

  if (signatureKey !== computedSignature) {
    return res.status(403).json({ message: 'Invalid signature' });
  }

  if (
    body.transaction_status === 'capture' ||
    body.transaction_status === 'settlement'
  ) {
    try {
      const order = await orderController.addOrder({
        orderItems: body.item_details,
        totalPrice: body.gross_amount,
        user: body.customer_details.user_id,
        paymentId: body.transaction_id,
      });

      const user = await User.findById(body.customer_details.user_id);
      await emailSender.sendEmail(
        body.customer_details.email,
        'Your Order Confirmation',
        mailBuilder.buildEmail(user.name, order)
      );
      res.status(200).send('Webhook received and processed');
    } catch (error) {
      console.error('Error processing Midtrans webhook:', error.message);
      res.status(500).json({ message: 'Failed to process webhook' });
    }
  } else {
    console.log(`Unhandled transaction status: ${body.transaction_status}`);
    res.status(200).send('Webhook received but ignored');
  }
};
