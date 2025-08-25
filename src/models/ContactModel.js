const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const ContactInfoSchema = new Schema(
    {
        email: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        address: {
            type: String,
            required: true,
        }, province: {
            type: String,
            required: true,
        }, district: {
            type: String,
            required: true,
        }, ward: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);
const ContactModel = mongoose.model("contactInfo", ContactInfoSchema);
module.exports = ContactModel;
