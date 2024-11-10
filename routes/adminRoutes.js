const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const categoriesController = require('../controllers/admin/categoriesController');
const ordersController = require('../controllers/admin/ordersController');

// User model
router.get('/users/count', adminController.getUserCount);
router.delete('/users/:id', adminController.deleteUser);

// Category model
router.post('/categories', categoriesController.addCategory);
router.put('/categories/:id', categoriesController.editCategory);
router.delete('/categories/:id', categoriesController.deleteCategory);

// Product model
router.get('/products/count', adminController.getProductsCount);
router.post('/products', adminController.addProduct);
router.put('/products/:id', adminController.editProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.delete('/products/:id/images', adminController.deleteProductImages);

// Order model
router.get('/orders', ordersController.getOrders);
router.get('/orders/count', ordersController.getOrdersCount);
router.put('/orders/:id', ordersController.changeOrderStatus);
router.delete('/orders/:id', ordersController.deleteOrder);

module.exports = router;
