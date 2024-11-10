const cron = require('node-cron');
const { Category } = require('../models/categoryModel');
const { Product } = require('../models/productModel');

cron.schedule('15 08 * * *', async () => {
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
