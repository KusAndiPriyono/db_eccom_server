const { User } = require('../models/userModel');
const { CartProduct } = require('../models/cartProduct');
const { Product } = require('../models/productModel');
const { default: mongoose } = require('mongoose');

exports.getUserCart = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const cartProducts = await CartProduct.find({ _id: { $in: user.cart } });
    if (!cartProducts) {
      return res.status(404).json({ message: 'Keranjang belanja kosong' });
    }

    const cart = [];
    for (const cartProduct of cartProducts) {
      const product = await Product.findById(cartProduct.product);
      if (!product) {
        cart.push({
          ...cartProduct._doc,
          productExists: false,
          productOutOfStock: false,
        });
      } else {
        cartProduct.productName = product.name;
        cartProduct.productImage = product.image;
        cartProduct.productPrice = product.price;
        if (product.countInStock < cartProduct.quantity) {
          cart.push({
            ...cartProduct._doc,
            productExists: true,
            productOutOfStock: true,
          });
        } else {
          cart.push({
            ...cartProduct._doc,
            productExists: true,
            productOutOfStock: false,
          });
        }
      }
    }

    return res.json(cart);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getUserCartCount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json(user.cart.length);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getCartProductId = async (req, res) => {
  try {
    const cartProduct = await CartProduct.findById(req.params.id);
    if (!cartProduct) {
      return res
        .status(404)
        .json({ message: 'Produk di keranjang belanja tidak ditemukan' });
    }

    const product = await Product.findById(cartProduct.product);
    if (!product) {
      cart.push({
        ...cartProduct._doc,
        productExists: false,
        productOutOfStock: false,
      });
    } else {
      cartProduct.productName = product.name;
      cartProduct.productImage = product.image;
      cartProduct.productPrice = product.price;
      if (product.countInStock < cartProduct.quantity) {
        cart.push({
          ...cartProduct._doc,
          productExists: true,
          productOutOfStock: true,
        });
      } else {
        cart.push({
          ...cartProduct._doc,
          productExists: true,
          productOutOfStock: false,
        });
      }
    }

    return res.json(cartProduct);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.addProductToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const userCartProduct = await CartProduct.find({
      _id: { $in: user.cart },
    });
    const existingCartItem = userCartProduct.find(
      (item) =>
        item.product.equals(new mongoose.Schema.Types.ObjectId(productId)) &&
        item.selectedSize === req.body.selectedSize &&
        item.selectedColour === req.body.selectedColour
    );

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    if (existingCartItem) {
      let condition = product.countInStock >= existingCartItem.quantity + 1;
      if (existingCartItem.reserved) {
        condition = product.countInStock >= 1;
      }
      if (condition) {
        await existingCartItem.save({ session });
        await Product.findByIdAndUpdate({
          _id: productId,
          $inc: { countInStock: -1 },
        }).session(session);
        await session.commitTransaction();
        return res.status(201).end();
      }
      await session.abortTransaction();
      return res.status(400).json({ message: 'Stok produk habis' });
    }

    const { quantity, selectedSize, selectedColour } = req.body;
    const cartProduct = await new CartProduct({
      quantity,
      selectedSize,
      selectedColour,
      product: productId,
      productName: product.name,
      productImage: product.image,
      productPrice: product.price,
    }).save({ session });

    if (!cartProduct) {
      await session.abortTransaction();
      return res
        .status(500)
        .json({ message: 'Gagal menambahkan produk ke keranjang belanja' });
    }

    user.cart.push(cartProduct.id);
    await user.save({ session });

    const updateProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        countInStock: { $gte: cartProduct.quantity },
      },
      { $inc: { countInStock: -cartProduct.quantity } },
      { new: true, session }
    );

    if (!updateProduct) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Stok produk habis' });
    }

    await session.commitTransaction();
    return res.status(201).json(cartProduct);
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    return res.status(500).json({ type: error.name, message: error.message });
  } finally {
    await session.endSession();
  }
};

exports.updateProductQuantity = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const { quantity } = req.body;

    let cartProduct = await CartProduct.findById(req.params.cartProductId);
    if (!cartProduct) {
      return res
        .status(404)
        .json({ message: 'Produk di keranjang belanja tidak ditemukan' });
    }

    const actualProduct = await Product.findById(cartProduct.product);
    if (!actualProduct) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    if (quantity > actualProduct.countInStock) {
      return res.status(400).json({ message: 'Stok produk habis' });
    }

    cartProduct = await CartProduct.findByIdAndUpdate(
      req.params.cartProductId,
      quantity,
      { new: true }
    );

    if (!cartProduct) {
      return res.status(400).json({
        message: 'Gagal mengubah jumlah produk di keranjang belanja',
      });
    }

    return res.json(cartProduct);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.removeProductFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (!user.cart.includes(req.params.cartProductId)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: 'Produk di keranjang belanja tidak ditemukan' });
    }

    const cartItemRemove = await CartProduct.findById(req.params.cartProductId);

    if (!cartItemRemove) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    if (cartItemRemove.reserved) {
      const updateProduct = await Product.findOneAndUpdate(
        { _id: cartItemRemove.product },
        { $inc: { countInStock: cartItemRemove.quantity } },
        { new: true, session }
      );

      if (!updateProduct) {
        await session.abortTransaction();
        return res.status(500).json({ message: 'Internal server error' });
      }
    }

    user.cart.pull(cartItemRemove.id);
    await user.save({ session });

    const cartProduct = await CartProduct.findByIdAndDelete(
      cartItemRemove.id
    ).session(session);

    if (!cartProduct) {
      await session.abortTransaction();
      return res.status(500).json({ message: 'Internal server error' });
    }
    await session.commitTransaction();
    return res.status(204).end();
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    return res.status(500).json({ type: error.name, message: error.message });
  } finally {
    await session.endSession();
  }
};
