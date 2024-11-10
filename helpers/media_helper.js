const { unlink } = require('fs/promises');
const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (_, file, cb) => {
    const filename = file.originalname
      .replace(' ', '-')
      .replace('.png', '')
      .replace('.jpg', '')
      .replace('.jpeg', '');
    const extension = ALLOWED_MIME_TYPES[file.mimetype];
    cb(null, `${filename}-${Date.now()}.${extension}`);
  },
});

exports.upload = multer({
  storage: storage,
  //5mb
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: (_, file, cb) => {
    const isValid = ALLOWED_MIME_TYPES[file.mimetype];
    let uploadError = new Error(
      `Invalid image type\n${file.mimetype} is not allowed`
    );
    if (!isValid) return cb(uploadError);
    return cb(null, true);
  },
});

exports.deleteImages = async (imageUrls, continueOnErrorName) => {
  await Promise.all(
    imageUrls.map(async (url) => {
      const imagePath = path.resolve(
        __dirname,
        '..',
        'public',
        'uploads',
        path.basename(url)
      );

      try {
        await unlink(imagePath);
        console.log(`Deleted image: ${imagePath}`);
      } catch (error) {
        if (continueOnErrorName && error.name !== continueOnErrorName) {
          console.error(
            `Failed to delete image (continuing): ${error.message}`
          );
        } else {
          console.error(`Error deleting image: ${error.message}`);
          throw error;
        }
      }
    })
  );
};
