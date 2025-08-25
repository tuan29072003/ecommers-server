/** @format */

const NotificationModel = require('../models/NotificationModel');

const getAllNotifications = async (req, res) => {
	const { id, page, limit } = req.query;

	try {
		// Kiểm tra tham số và log ra để debug
		console.log("Request query:", { id, page, limit });
		const parsedPage = parseInt(page);
		const parsedLimit = parseInt(limit);
		if (isNaN(parsedPage) || isNaN(parsedLimit)) {
			return res.status(400).json({
				message: 'Tham số page hoặc limit không hợp lệ',
			});
		}

		// Tính số bản ghi bỏ qua
		const skip = (parsedPage - 1) * parsedLimit;
		console.log("Calculated skip:", skip);

		// Điều kiện lọc thông báo
		const query = id
			? { $or: [{ to: 'all' }, { user_Id: id }] }
			: { from: 'admin' };

		console.log("Query for notifications:", query);

		// Lấy dữ liệu thông báo theo phân trang
		const items = await NotificationModel.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parsedLimit);
		console.log("Items fetched:", items.length);

		// Tính tổng số bản ghi thỏa mãn query
		const totalCount = await NotificationModel.countDocuments(query);
		console.log("Total count for query:", totalCount);

		// Tính flag có còn dữ liệu hay không
		const hasMore = skip + items.length < totalCount;
		console.log("Has more:", hasMore);

		// Tạo điều kiện lọc cho các thông báo chưa đọc dựa theo người dùng hay admin
		const unreadFilter = id
			? { ...query, isUserRead: false }
			: { ...query, isAdminRead: false };

		console.log("Unread filter:", unreadFilter);

		const totalNoRead = await NotificationModel.countDocuments(unreadFilter);
		console.log("Total unread count:", totalNoRead);

		// Trả kết quả về cho front end
		res.status(200).json({
			message: '',
			data: items,
			totalCount: totalNoRead, // Số thông báo chưa đọc
			hasMore,
			total: await NotificationModel.countDocuments({})
		});
	} catch (error) {
		console.error("Error in getAllNotifications:", error);
		res.status(500).json({
			message: 'Lỗi máy chủ',
			error: error.message,
		});
	}
};



const getDetail = async (req, res) => {
	const id = req.query.id
	console.log(id)

	try {
		const notification = await NotificationModel.findById(id);
		console.log(notification)
		if (!notification) {
			return res.status(404).json({ message: "Thông báo không tồn tại!" });
		}
		res.status(200).json({
			message: '',
			data: notification,
		});
	} catch (error) {
		res.status(500).json({ message: "Lỗi server", error });
	}
};


const update = async (req, res) => {
	const { id } = req.query;
	const body = req.body;

	try {
		await NotificationModel.findByIdAndUpdate(id, body);

		res.status(200).json({
			message: 'Updated!!',
			data: [],
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const add = async (req, res) => {
	const body = req.body;
	console.log(body)

	try {
		const res = new NotificationModel(body);
		res.save()

		res.status(200).json({
			message: 'Ok!!',
			data: res,
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
module.exports = { getAllNotifications, update, getDetail, add };