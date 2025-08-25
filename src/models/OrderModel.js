/** @format */

/** @format */
const mongoose = require('mongoose')
const OrderSchema = new mongoose.Schema(
    {
        user_id: { type: String, required: true, ref: 'users' },
        items: [
            {
                product_id: { type: String, required: true, ref: 'products' },
                total: { type: Number, required: true },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true },
                subProduct_id: { type: String, required: true, ref: 'subproducts' },
                costPrice: { type: Number, required: true },
            },
        ],
        total: { type: Number, default: 0 },
        status: { type: String, required: true },
    },
    { timestamps: true }
);

const OrderModel = mongoose.model('order', OrderSchema);
module.exports = OrderModel;
