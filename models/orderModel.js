const { Schema, model } = require('mongoose');

const orderSchema = new Schema({
  orderItems: [
    {
      type: Schema.Types.ObjectId,
      ref: 'OrderItem',
      required: true,
    },
  ],
  shippingAddress: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  postalCode: String,
  country: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  paymentId: String,
  status: {
    type: String,
    reuired: true,
    default: 'pending',
    enum: [
      'pending',
      'processed',
      'shipped',
      'out-for-delivery',
      'delivered',
      'cancelled',
      'on-hold',
      'expired',
    ],
  },
  statusHistory: {
    type: [String],
    enum: [
      'pending',
      'processed',
      'shipped',
      'out-for-delivery',
      'delivered',
      'cancelled',
      'on-hold',
      'expired',
    ],
    required: true,
    default: ['pending'],
  },
  totalPrice: Number,
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  dateOrdered: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.set('toObject', { virtuals: true });
orderSchema.set('toJSON', { virtuals: true });

exports.Order = model('Order', orderSchema);

/*
orderItems: Array yang menyimpan referensi ke dokumen OrderItem menggunakan Schema.Types.ObjectId dan ref ke koleksi OrderItem. Ini adalah array dari produk yang termasuk dalam pesanan, dan wajib diisi.
shippingAddress: Menyimpan alamat pengiriman pesanan sebagai String, wajib diisi.
city: Nama kota pengiriman, bertipe String dan wajib diisi.
postalCode: Kode pos pengiriman, opsional (String).
country: Negara tujuan pengiriman, bertipe String dan wajib.
phone: Nomor telepon penerima, bertipe String dan wajib.
paymentId: Menyimpan ID pembayaran sebagai String, digunakan untuk melacak pembayaran, dan opsional.
status: Status pesanan, bertipe String dan wajib. Nilai defaultnya adalah 'pending'. Menggunakan enum untuk membatasi status ke nilai tertentu:
'pending': Menunggu pemrosesan.
'processed': Telah diproses.
'shipped': Dalam proses pengiriman.
'out-for-delivery': Dalam perjalanan ke alamat pengiriman.
'delivered': Telah sampai pada penerima.
'cancelled': Pesanan dibatalkan.
'on-hold': Dalam status ditahan.
'expired': Masa berlaku pesanan telah habis.
statusHistory: Array untuk menyimpan riwayat perubahan status, berisi tipe String. Nilai defaultnya ['pending'], dan setiap nilai dalam array harus mengikuti enum status.
totalPrice: Menyimpan total harga pesanan, bertipe Number.
user: Menyimpan referensi ke pengguna yang membuat pesanan (User). Tipe Schema.Types.ObjectId dengan ref ke koleksi User, wajib diisi.
dateOrdered: Menyimpan tanggal pesanan dibuat, bertipe Date dengan nilai default Date.now.
*/
