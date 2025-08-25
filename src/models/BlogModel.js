const mongoose = require('mongoose');
const { Schema } = mongoose;
const BlogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true }, // Tiêu đề bài viết
        slug: { type: String, unique: true, lowercase: true, index: true }, // Định danh URL
        content: { type: String }, // Nội dung bài viết
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true }, // Người viết bài
        tag: {
            type: [String],
            default: [],
        }, // Danh mục bài viết
        coverImage: { type: String }, // Ảnh đại diện bài viết
        likes: {
            type: [String],
            default: [],
        }, // Người dùng thích bài viết
        dislikes: {
            type: [String],
            default: [],
        }, //
    },
    { timestamps: true }
);


const BlogModel = mongoose.model('blogs', BlogSchema);
module.exports = BlogModel