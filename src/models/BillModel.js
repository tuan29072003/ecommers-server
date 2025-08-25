const mongoose = require('mongoose')
const { Schema } = require('mongoose')
// create  object user
const schema = new Schema({
	products: [],
	total: {
		required: true,
		type: Number,
	},
	status: {
		type: Number,
		default: 0, // 0: pending, 1: shipping, 2: success, 3: cancel
		enum: [0, 1, 2, 3],
	},
	customer_id: {
		type: String,
		required: true,
		ref: 'users'
	},
	shippingAddress: { type: Schema.Types.ObjectId, ref: 'address', required: true }, // Sử dụng ObjectId tham chiếu đến AddressModel
	paymentStatus: {
		type: Number,
		default: 1, // 0: unpaid, 1: paid
	},
	paymentMethod: {
		type: String,
		default: 'cod',
	},
},
	{ timestamps: true }
);
const BillModel = mongoose.model('bills', schema);
module.exports = BillModel 