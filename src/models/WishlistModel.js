const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const wishlistSchema = Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers', // Tham chiếu đến bảng User
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products', // Tham chiếu đến bảng Product
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now // Ngày thêm vào danh sách
        }
    }]
});
const WishlistModel = mongoose.model('wishlist', wishlistSchema);//save in collectiion user and get information as UsersChema
module.exports = WishlistModel
