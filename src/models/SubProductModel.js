const mongoose = require('mongoose')
const { Schema } = require('mongoose')
// create  object user
const SubProductsChema = new Schema({
    size: String,
    color: String,
    price: {
        type: Number,
        require: true
    },
    qty: {
        type: Number,
        default: 0,
        require: true
    },
    productId: {
        type: String,
        require: true
    },
    images: [String],
    isDeleted:{
        type:Boolean,
        default:false
    }
}, {
    timestamps: true
}
);
const SubProductModel = mongoose.model('subproducts', SubProductsChema);//save in collectiion user and get information as UsersChema
module.exports = SubProductModel