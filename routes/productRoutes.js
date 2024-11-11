const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productController');
const reviewsController = require('../controllers/reviewController');

router.get('/', productsController.getProducts);
router.get('/search', productsController.searchProducts);
router.get('/:id', productsController.getProductById);

router.post('/:id/reviews', reviewsController.createProductReview);
router.get('/:id/reviews', reviewsController.getProductReviews);

module.exports = router;
