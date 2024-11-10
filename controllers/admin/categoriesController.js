const media_helper = require('../../helpers/media_helper');
const { Category } = require('../../models/categoryModel');
const util = require('util');

exports.addCategory = async (req, res) => {
  try {
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

    req.body['image'] = `${req.protocol}://${req.get('host')}/${image.path}`;
    let category = new Category(req.body);
    category = category.save();

    if (!category) {
      return res.status(500).json({ message: 'Gagal menambahkan kategori' });
    }

    return res.status(201).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    category.markedForDeletion = true;
    await category.save();
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.editCategory = async (req, res) => {
  try {
    const { name, icon, colour } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, icon, colour },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    return res.json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
