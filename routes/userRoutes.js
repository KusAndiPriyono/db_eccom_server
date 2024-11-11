const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const whishlistController = require('../controllers/wishlistController');
const cartController = require('../controllers/cartController');

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

router.get('/:id/wishlist', whishlistController.getUserWishlist);
router.post('/:id/wishlist', whishlistController.addProductToWishlist);
router.delete(
  '/:id/wishlist/:productId',
  whishlistController.removeProductFromWishlist
);

router.get('/:id/cart', cartController.getUserCart);
router.get('/:id/cart/count', cartController.getUserCartCount);
router.get('/:id/cart/cartProductId', cartController.getCartProductId);
router.post('/:id/cart', cartController.addProductToCart);
router.put('/:id/cart/:cartProductId', cartController.updateProductQuantity);
router.delete('/:id/cart/:cartProductId', cartController.removeProductFromCart);

module.exports = router;
