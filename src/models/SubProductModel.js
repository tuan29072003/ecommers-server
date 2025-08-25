const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheme = new Schema(
  {
    size: String,
    price: {
      type: Number,
      required: true,
    },
    costPrice: {
      type: Number,
      required: true,
    },
    qty: {
      type: Number,
      default: 0,
      required: true,
    },
    discount: {
      type: Number,
    },
    productId: {
      type: String,
      required: true,
      ref: 'products'
    },
    images: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const SubProductModel = mongoose.model('subproducts', scheme);

module.exports = SubProductModel;
