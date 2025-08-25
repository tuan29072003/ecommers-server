const WishlistModel = require("../models/WishlistModel");


const addProduct = async (req, res) => {
    const { userId, productId } = req.body;

    console.log(userId, productId)
    try {
        if (userId && productId) {
            let wishlist = await WishlistModel.findOne({ userId });

            if (!wishlist) {
                wishlist = new WishlistModel({ userId, products: [] });
            }

            // Kiểm tra xem sản phẩm đã tồn tại chưa
            const productExists = wishlist.products.some(p => p.productId.equals(productId));
            if (!productExists) {
                wishlist.products.push({ productId });
            }

            await wishlist.save();

            res.json({
                data: [],
                message: 'Đã thêm vào danh sách yêu thích'
            });
        }

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
};
const remove = async (req, res) => {
    const { userId, productId } = req.body;
    try {
        if (userId && productId) {
            let wishlist = await WishlistModel.findOne({ userId });
            if (!wishlist) return res.status(404).json({ message: 'Danh sách không tồn tại' });

            wishlist.products = wishlist.products.filter(p => !p.productId.equals(productId));

            await wishlist.save();
            res.json({ message: 'Đã xóa sản phẩm khỏi danh sách yêu thích', wishlist });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
};
const get = async (req, res) => {
    const { userId } = req.query;

    try {
        const wishlist = await WishlistModel.findOne({ userId }).populate('products.productId');
        if (!wishlist)
            return res.status(404).json({ message: 'Không có danh sách yêu thích' });

        res.status(200).json({
            message: 'List',
            data: wishlist,
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
};
module.exports = { addProduct, remove, get };
