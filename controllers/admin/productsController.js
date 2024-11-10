const { Product } = require('../../models/productModel');
const { Review } = require('../../models/review');
const media_helper = require('../../helpers/media_helper');
const util = require('util');
const { Category } = require('../../models/categoryModel');
const multer = require('multer');
const { default: mongoose } = require('mongoose');

exports.getProducts = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const pageSize = 10;

    const products = await Product.find()
      .select('-reviews -rating')
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    if (!products) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    return res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getProductsCount = async (req, res) => {
  try {
    const productsCount = await Product.countDocuments();
    if (!productsCount) {
      return res
        .status(500)
        .json({ message: 'Tidak dapat menghitung jumlah produk' });
    }
    return res.json(productsCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const imageUpload = util.promisify(
      media_helper.upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ])
    );
    try {
      await imageUpload(req, res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        type: error.code,
        message: `${error.message}{${error.fields}}`,
        storageErrors: error.storageErrors,
      });
    }

    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    if (category.markedForDeletion) {
      return res.status(404).json({ message: 'Kategori ini telah dihapus' });
    }

    const image = req.files['image'][0];
    if (!image) return res.status(404).json({ message: 'tidak ada file' });

    req.body['image'] = `${req.protocol}://${req.get('host')}/${image.path}`;

    const gallery = req.files['images'];
    const imagePaths = [];
    if (gallery) {
      for (const image of gallery) {
        const imagePath = `${req.protocol}://${req.get('host')}/${image.path}`;
        imagePaths.push(imagePath);
      }
    }

    if (imagePaths.length > 0) {
      req.body['images'] = imagePaths;
    }

    const product = new Product(req.body).save();
    if (!product) {
      return res.status(500).json({ message: 'Gagal menambahkan produk' });
    }

    return res.status(201).json(product);
  } catch (error) {
    console.error(error);
    if (err instanceof multer.MulterError) {
      return res.status(err.code).json({ message: err.message });
    }
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.editProduct = async (req, res) => {
  try {
    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !(await Product.findById(req.params.id))
    ) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(404).json({ message: 'Kategori tidak ditemukan' });
      }
      if (category.markedForDeletion) {
        return res.status(404).json({ message: 'Kategori ini telah dihapus' });
      }

      const product = await Product.findById(req.params.id);

      if (req.body.images) {
        const limit = 10 - product.images.length;
        const galleryUpload = util.promisify(
          media_helper.upload.fields([{ name: 'images', maxCount: limit }])
        );
        try {
          await galleryUpload(req, res);
        } catch (error) {
          console.error(error);
          return res.status(500).json({
            type: error.code,
            message: `${error.message}{${error.fields}}`,
            storageErrors: error.storageErrors,
          });
        }

        const imageFiles = req.files['images'];
        const galleryUpdate = imageFiles && imageFiles.length > 0;
        if (galleryUpdate) {
          const imagePaths = [];
          for (const image of imageFiles) {
            const imagePath = `${req.protocol}://${req.get('host')}/${
              image.path
            }`;
            imagePaths.push(imagePath);
          }
          req.body['images'] = [...product.images, ...imagePaths];
        }
      }

      if (req.body.image) {
        const imageUpload = util.promisify(
          media_helper.upload.fields([{ name: 'image', maxCount: 1 }])
        );
        try {
          await imageUpload(req, res);
        } catch (error) {
          console.error(error);
          return res.status(500).json({
            type: error.code,
            message: `${error.message}{${error.fields}}`,
            storageErrors: error.storageErrors,
          });
        }

        const image = req.files['image'][0];
        if (!image)
          return res.status(400).json({ message: 'Gambar tidak ditemukan' });

        req.body['image'] = `${req.protocol}://${req.get('host')}/${
          image.path
        }`;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Gagal mengupdate produk' });
    }

    return res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    if (err instanceof multer.MulterError) {
      return res.status(err.code).json({ message: err.message });
    }
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({ message: 'Invalid Product' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    await media_helper.deleteImages(
      [...product.images, product.image],
      'ENOENT'
    );

    await Review.deleteMany({ _id: { $in: product.reviews } });

    await Product.findByIdAndDelete(productId);

    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const { deletedImageUrls } = req.body;

    if (
      !mongoose.isValidObjectId(productId) ||
      !Array.isArray(deletedImageUrls)
    ) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    await media_helper.deleteImages(deletedImageUrls);
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    product.images = product.images.filter(
      (image) => !deletedImageUrls.includes(image)
    );

    await product.save();

    return res.status(204).end();
  } catch (error) {
    console.error(`Error deleting product images: ${error.message}`);
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Gambar tidak ditemukan' });
    }
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
