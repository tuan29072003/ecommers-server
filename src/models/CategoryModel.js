const mongoose = require('mongoose')
const {Schema} = require('mongoose')
// create  object user
const CategoryChema = new Schema ({
    title: {
        type:String,
        require:true,
    },
    parentId:String
    ,
    slug:{
        type:String
    },
    description:String,
    createdAt:{
        type:Date,
        default:Date.now()},
    isDeleted:{
        type:Boolean,
        default:false
    },
    updatedAt:{
        type:Date,
        default:Date.now()},
});
const CategoryModel = mongoose.model('categories',CategoryChema);
module.exports = CategoryModel