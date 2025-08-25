/** @format */
const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const scheme = new Schema(
	{
		title: String,
		body: String,
		order_id: String,
		isAdminRead: { type: Boolean, default: false },
		isUserRead: { type: Boolean, default: false },
		user_Id: { type: String, requred: true },
		from: String,
		to: String,
	},
	{ timestamps: true }
);

const NotificationModel = mongoose.model('notifications', scheme);

module.exports = NotificationModel;