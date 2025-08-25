const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const supplierScheme = new Schema({
	name: {
		type: String,
		required: true,
	},
	slug: String,
	contact: String,
	email: String,
	address: String,
	photoURL: String,
	createdAt: {
		type: Date,
		default: Date.now(),
	},
	updatedAt: {
		type: Date,
		default: Date.now(),
	},
	isDeleted: {
		type: Boolean,
		default: false
	}
});

const SupplierModel = mongoose.model('suppliers', supplierScheme);
module.exports = SupplierModel