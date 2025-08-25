/** @format */
const MessageModel = require('../models/MessageModel')
const UserModel = require('../models/UserModel')
const getPrivateMessages = async (req, res) => {
    try {
        const { sender, receiver } = req.body; // Lấy ID từ query

        if (!sender || !receiver) {
            return res.status(400).json({ message: "Missing sender or receiver ID" });
        }

        // Tìm tin nhắn giữa hai người
        const messages = await MessageModel.find({
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ createdAt: 1 });
        return res.status(200).json({ data: messages });
    } catch (error) {
        console.error("Error fetching private messages:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getlistUserForCustomer = async (req, res) => {
    try {
        const list = await UserModel.find({ rule: { $in: [1, 2] } });
        res.status(200).json({
            data: list
        });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
}
const getforAdmin = async (req, res) => {
    try {
        const list = await UserModel.find({ rule: 0 });
        res.status(200).json({
            data: list
        });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
}
const update = async (req, res) => {
    const body = req.body; // Lấy ID từ query params
    console.log(body)
    try {
        const updatedMessage = await MessageModel.findByIdAndUpdate(
            body.id, // Tìm tin nhắn theo ID
            { $set: { isDelete: true } }, // Cập nhật trạng thái
            { new: true } // Trả về dữ liệu sau khi cập nhật
        );

        if (!updatedMessage) {
            return res.status(404).json({ message: "Không tìm thấy tin nhắn!" });
        }

        res.status(200).json({
            message: "Cập nhật thành công!",
            data: updatedMessage,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getPrivateMessages, getlistUserForCustomer, getforAdmin, update };