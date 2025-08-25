const BlogModel = require("../models/BlogModel");
const UserModel = require("../models/UserModel");


const add = async (req, res) => {
    const body = req.body
    console.log(body)
    try {
        const blog = new BlogModel(body)
        blog.save()

        res.status(200).json({
            message: '',
            data: blog,
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
const getAll = async (req, res) => {
    const { page, limit, tag } = req.query;
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 6;

    try {
        let filter = {};
        if (tag) {
            filter.tag = { $in: tag.split(',') }; // Cho phép lọc nhiều tag, cách nhau bằng dấu phẩy
        }
        const blogs = await BlogModel.find(filter)
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 })
            .populate('author', 'name email photoURL'); // Chỉ lấy trường name và email của tác giả
        res.status(200).json({
            message: '',
            data: {
                blogs,
                total: await BlogModel.countDocuments()
            },
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
const getById = async (req, res) => {
    const { id } = req.query
    try {

        const blogs = await BlogModel.findById(id)
            .populate('author', 'name email photoURL'); // Chỉ lấy trường name và email của tác giả

        res.status(200).json({
            message: '',
            data: blogs,
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
const update = async (req, res) => {
    const { id } = req.query;
    const body = req.body;
    console.log(id, body)

    try {
        await BlogModel.findByIdAndUpdate(id, body);


        res.status(200).json({
            message: 'Updated',
        });
    } catch (error) {
        res.status(404).json({
            message: error.message,
        });
    }
};
module.exports = {
    add,
    getAll,
    getById,
    update
}