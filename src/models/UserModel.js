const mongoose = require('mongoose')
const { Schema } = require('mongoose')
// create  object user
const UsersChema = new Schema({
    name: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
    },
    rule: {
        type: Number,
        default: 0
    },
    slug: String,
    password: {
        type: String
        , require: true,
    },
    photoURL: String,
    phoneNumber: String,
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isVerify: {
        type: Boolean,
        default: false,
    },
    verifyCode: String,
},
    { timestamps: true });
const UserModel = mongoose.model('users', UsersChema);//save in collectiion user and get information as UsersChema
module.exports = UserModel