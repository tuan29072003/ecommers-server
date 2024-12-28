const mongoose = require('mongoose')
const {Schema} = require('mongoose')
// create  object user
const UsersChema = new Schema ({
    name: {
        type:String,
        require:true,},
    email: {
        type:String,
        require:true,},
    rule:{
        type:Number,
        default:1
    },
    slug:String,
    password: {
        type:String
        ,require:true,},
    photoURL:String,
    createAt:{
        type:Date,
        default:Date.now()},
    updateAt:{
        type:Date,
        default:Date.now()},
});
const UserModel = mongoose.model('users',UsersChema);//save in collectiion user and get information as UsersChema
module.exports = UserModel