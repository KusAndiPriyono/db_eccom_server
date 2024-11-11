const mongoose = require('mongoose');
const { User } = require('../models/userModel');
const { Product } = require('../models/productModel');
const { Review } = require('../models/review');
// const jwt = require('jsonwebtoken');

exports.createProductReview = async (req, res) => {
  try {
    const user = await User.findById(req.user.user);
    if (!user) return res.status(404).json({ message: 'Invalid user' });
    const review = await new Review({
      ...req.body,
      userName: user.name,
    }).save();

    if (!review) {
      return res.status(400).json({ message: 'Review tidak dapat dibuat' });
    }

    let product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: 'Product tidak ditemukan' });
    product.reviews.push(review.id);
    product = await product.save();

    if (!product)
      return res.status(500).json({ message: 'Internal server error' });

    return res.status(201).json({ product, review });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ typ: error.name, message: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Product tidak ditemukan' });
    }
    const page = req.query.page || 1;
    const pageSize = 10;

    // const accessToken = req
    //   .header('Authorization')
    //   .replace('Bearer ', '')
    //   .trim();

    // const tokenData = jwt.decode(accessToken);

    const reviews = await Review.find({
      _id: { $in: product.reviews },
    })
      .sort({ date: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const processReviews = [];

    for (const review of reviews) {
      const user = await User.findById(review.user);
      if (!user) {
        processReviews.push(review);
        constinue;
      }
      let newReview;
      if (review.userName !== user.name) {
        review.userName = user.name;
        newReview = await review.save({ session });
      }
      processReviews.push(newReview ?? review);
    }
    await session.commitTransaction();
    return res.json(processReviews);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ typ: error.name, message: error.message });
  } finally {
    session.endSession();
  }
};
