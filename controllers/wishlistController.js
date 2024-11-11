const { User } = require('../models/userModel');
const { Product } = require('../models/productModel');
const { default: mongoose } = require('mongoose');

exports.getUserWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    const wishlist = [];
    for (const wishlistProduct of user.wishlist) {
      const product = await Product.findById(wishlistProduct.productId);
      if (!product) {
        wishlist.push({
          ...wishlistProduct,
          productExists: false,
          productOutOfStock: false,
        });
      } else if (product.countInStock < 1) {
        wishlist.push({
          ...wishlistProduct,
          productExists: true,
          productOutOfStock: true,
        });
      } else {
        wishlist.push({
          productId: product._id,
          productImage: product.image,
          productName: product.name,
          productPrice: product.price,
          productExists: true,
          productOutOfStock: false,
        });
      }
    }
    return res.json(wishlist);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.addProductToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    const product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product tidak ditemukan' });
    }

    const productAlreadyExists = user.wishlist.find((item) =>
      item.productId.equals(
        new mongoose.Schema.Types.ObjectId(req.body.productId)
      )
    );
    if (productAlreadyExists) {
      return res.status(409).json({ message: 'Product sudah ada di wishlist' });
    }

    user.wishlist.push({
      productId: req.body.productId,
      productImage: product.image,
      productName: product.name,
      productPrice: product.price,
    });

    await user.save();

    return res.status(200).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.removeProductFromWishlist = async (req, res) => {
  try {
    const userId = req.params.id;
    const productId = req.params.productId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const index = user.wishlist.findIndex((item) =>
      item.productId.equals(new mongoose.Schema.Types.ObjectId(productId))
    );

    if (index === -1) {
      return res.status(404).json({ message: 'Product tidak ditemukan' });
    }

    user.wishlist.splice(index, 1);

    await user.save();

    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
