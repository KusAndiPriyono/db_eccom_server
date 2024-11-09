const { Schema, model } = require('mongoose');

const categorySchema = new Schema({
  name: { type: String, required: true },
  colour: { type: String, default: '#000000' },
  image: { type: String, required: true },
  markedForDeletion: { type: Boolean, default: false },
});

categorySchema.set('toObject', { virtuals: true });
categorySchema.set('toJSON', { virtuals: true });

exports.Category = model('Category', categorySchema);

/* markedForDeletion: Menyimpan status apakah kategori ini ditandai untuk dihapus.
Bertipe Boolean dengan nilai default false, artinya secara default kategori ini tidak ditandai untuk dihapus */
