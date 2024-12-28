const mongoose = require('mongoose')
const {Schema} = require('mongoose')
const supplierScheme = new Schema({
	name: {
		type: String,
		required: true,
	},
	slug: String,
	product: String,
	categories: {
		type: [String],
	},
	price: Number,
	contact: String,
	status: {
		type: Number,
		default: 0,
		enum: [0, 1],
	},
	email:String,
	address:String,
	photoURL: String,
	createdAt: {
		type: Date,
		default: Date.now(),
	},
	updatedAt: {
		type: Date,
		default: Date.now(),
	}
});

const SupplierModel = mongoose.model('suppliers', supplierScheme);
module.exports = SupplierModel