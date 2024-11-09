const { Schema, model } = require('mongoose');

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0.0 },
  colours: [{ type: String }],
  image: { type: String, required: true },
  images: [{ type: String }],
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  numberOfReviews: { type: Number, default: 0 },
  sizes: [{ type: String }],
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  genderAgeCategory: { type: String, enum: ['men', 'women', 'unisex', 'kids'] },
  countInStock: { type: Number, required: true, min: 0, max: 255 },
  dateAdded: { type: Date, default: Date.now },
});

// pre save hook
productSchema.pre('save', async function (next) {
  if (this.reviews.length > 0) {
    await this.populate('reviews');

    const totalRating = this.reviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );

    this.rating = totalRating / this.reviews.length;
    this.rating = parseFloat((totalRating / this.reviews.length).toFixed(1));
    this.numberOfReviews = this.reviews.length;
  }

  next();
});

productSchema.index({ name: 'text', description: 'text' });

productSchema.virtual('productInitials').get(() => {
  return this.firstBit + this.secondBit;
});

productSchema.set('toObject', { virtuals: true });
productSchema.set('toJSON', { virtuals: true });

exports.Product = model('Product', productSchema);

/* 
name: Menyimpan nama produk, bertipe String dan wajib (required: true).
description: Deskripsi produk, juga bertipe String dan wajib.
price: Menyimpan harga produk, bertipe Number dan wajib.
rating: Menyimpan rating produk, bertipe Number dengan nilai default 0.0.
colours: Menyimpan berbagai warna produk dalam array string ([String]).
image: URL atau path gambar utama produk, wajib diisi.
images: Array berisi URL atau path gambar tambahan produk ([String]).
reviews: Array referensi ke dokumen Review di MongoDB menggunakan tipe Schema.Types.ObjectId dan ref ke koleksi Review. Ini memungkinkan hubungan antar koleksi di MongoDB.
numberOfReviews: Menyimpan jumlah review produk dengan nilai default 0.
sizes: Array string yang menyimpan ukuran produk (misalnya, S, M, L).
category: Menyimpan referensi ke kategori produk dengan tipe Schema.Types.ObjectId dan ref ke Category, menjadikan field ini wajib (required: true).
genderAgeCategory: Mengelompokkan produk berdasarkan kategori gender atau usia (misalnya, men, women, unisex, kids). Menggunakan enum untuk membatasi nilai hanya ke pilihan yang tersedia.
countInStock: Menyimpan jumlah stok produk, bertipe Number, wajib diisi dengan batas minimal 0 dan maksimal 255.
dateAdded: Menyimpan tanggal produk ditambahkan, bertipe Date dengan nilai default Date.now.
*/
