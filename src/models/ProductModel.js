const mongoose = require('mongoose')
const {Schema} = require('mongoose')
// create  object user
const ProductChema = new Schema ({
	title: {
		type: String,
		required: true,
	},
	slug: String,
	description: String,
	categories: [String],
	supplier: {
		require: true,
		type: String,
	},
	content: String,
	expiryDate: {
		type: Date,
	},
	images: {
		type: [String],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
	isDeleted: {
		type: Boolean,
		default: false,
	},
});
const ProductModel = mongoose.model('products',ProductChema);
module.exports = ProductModel