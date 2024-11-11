const cron = require('node-cron');
const { Category } = require('../models/categoryModel');
const { Product } = require('../models/productModel');
const { default: mongoose } = require('mongoose');
const { CartProduct } = require('../models/cartProduct');

cron.schedule('0 0 * * *', async () => {
  try {
    const categoriesToBeDeleted = await Category.find({
      markedForDeletion: true,
    });
    for (const category of categoriesToBeDeleted) {
      const categoryProductsCount = await Product.countDocuments({
        category: category.id,
      });
      if (categoryProductsCount < 1) await category.deleteOne();
    }
    console.log('Cron job completed', new Date());
  } catch (error) {
    console.log('Error cron job', error);
  }
});

cron.schedule('*/30 * * * *', async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Reservation release CRON job started', new Date());

    const expiredReservations = await CartProduct.find({
      reserved: true,
      reservationExpiry: { $lte: new Date() },
    }).session(session);

    for (const cartProduct of expiredReservations) {
      const product = await Product.findById(cartProduct.product).session(
        session
      );

      if (product) {
        const updateProduct = await Product.findByIdAndUpdate(
          product._id,
          {
            $inc: { countInStock: cartProduct.quantity },
          },
          { new: true, runValidators: true, session }
        );

        if (!updateProduct) {
          console.error('Failed to release product stock');
          await session.abortTransaction();
          return;
        }
      }
      await CartProduct.findByIdAndUpdate(
        cartProduct._id,
        { reserved: false },
        { session }
      );
    }

    await session.commitTransaction();
    console.log('Reservation release CRON job completed', new Date());
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    return res.status(500).json({ type: error.name, message: error.message });
  } finally {
    session.endSession();
  }
});
