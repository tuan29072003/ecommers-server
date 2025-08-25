/** @format */
const mongoose = require('mongoose')
const {Schema} = require('mongoose')

const scheme = new Schema(
	{
		name: String,
		phoneNumber: String,
		address: {
			type: String,
			required: true,
		},province: {
			type: String,
			required: true,
		},district: {
			type: String,
			required: true,
		},ward: {
			type: String,
			required: true,
		},
		createdBy: {
			type: String,
			required: true,
		},
		isDefault: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

const AddressModel = mongoose.model('address', scheme);
module.exports= AddressModel;