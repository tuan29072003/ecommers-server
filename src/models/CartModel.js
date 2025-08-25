const mongoose = require('mongoose');
const { Schema } = mongoose;
const scheme = new Schema({
	createdBy: {
		type: String,
		required: true,
	},
	count: {
		type: Number,
	},
	subProductId: {
		type: String,
		required: true,
	},
	image: String,
	size: String,
	price: Number,
	costPrice: Number,
	qty: Number,
	productId: String,
	title: String,
});

const CartModel = mongoose.model('carts', scheme);
module.exports = CartModel
