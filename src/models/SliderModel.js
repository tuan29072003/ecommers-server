const mongoose = require('mongoose')
const {Schema} = require('mongoose')
// create  object user
const shema = new Schema ({
    title: {
        type:String,
        require:true,},
    description:String,
    photoURL:String,
    createAt:{
        type:Date,
        default:Date.now()},
    updateAt:{
        type:Date,
        default:Date.now()},
});
const SliderModel = mongoose.model('slider',shema);//save in collectiion user and get information as UsersChema
module.exports = SliderModel