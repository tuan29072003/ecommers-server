/** @format */

const OrderModel = require("../models/OrderModel");
const ProductModel = require("../models/ProductModel");
const SubProductModel = require("../models/SubProductModel");
const UserModel = require("../models/UserModel");

const addOrder = async (req, res) => {
	const body = req.body;
	try {
		const item = new OrderModel(body);
		await item.save();

		res.status(201).send({ message: 'Order created', data: item });
	} catch (error) {
		res.status(404).send({ message: error.message });
	}
};
const orderDetail = async (req, res) => {
	try {
		const { id } = req.query;

		// Lấy đơn hàng theo ID
		const item = await OrderModel.findById(id);
		if (!item) {
			return res.status(404).send({ message: "Order not found" });
		}

		// Lấy thông tin sản phẩm và subProduct song song
		const productPromises = item.items.map(async (item) => {
			const product = await ProductModel.findById(item.product_id);
			const subproduct = await SubProductModel.findById(item.subProduct_id);
			return {
				...item._doc, // Lấy thông tin đơn hàng
				product: product ? product._doc : null,
				subproduct: subproduct ? subproduct._doc : null,
			};
		});

		// Chờ tất cả sản phẩm được lấy xong
		const products = await Promise.all(productPromises);

		// Lấy thông tin user
		const user = await UserModel.findById(item.user_id);

		// Kết hợp dữ liệu vào object `data`
		const data = {
			...item._doc,
			user: user ? user._doc : null,
			items: products, // Danh sách sản phẩm đã lấy đầy đủ thông tin
		};

		res.status(200).send({ message: "Order retrieved successfully", data });
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
};

const getOrders = async (req, res) => {
	const { page, limit, start, end } = req.query;

	const pageNumber = page ? parseInt(page) : 1;
	const limitNumber = limit ? parseInt(limit) : 20;

	const filter = {};

	if (start && end) {
		filter.createdAt = {
			$gte: new Date(start),
			$lte: new Date(end),
		};
	}

	try {
		const items = await OrderModel.find(filter)
			.limit(limitNumber)
			.skip((pageNumber - 1) * limitNumber)
			.sort({ createdAt: -1 });

		// Object để nhóm đơn hàng theo order_id
		const orderMap = {};
		for (const order of items) {
			const orderId = order._id.toString();

			if (!orderMap[orderId]) {
				orderMap[orderId] = {
					order_id: orderId,
					user_id: order.user_id,
					createdAt: order.createdAt,
					items: [],
					total: order.total,
					status: order.status,
					user: await UserModel.findById(order.user_id)
				};
			}

			// Thêm từng sản phẩm vào danh sách items của đơn hàng
			for (const item of order.items) {
				const product = await ProductModel.findById(item.product_id);
				const subProduct = await SubProductModel.findById(item.subProduct_id);

				orderMap[orderId].items.push({
					...item._doc,
					product: product ? product._doc : null,
					subProduct: subProduct ? subProduct._doc : null,
				});
			}
		}

		// Chuyển đổi Object thành Array
		const orders = Object.values(orderMap);

		res.status(200).json({
			message: 'Orders fetched',
			data: orders,
			total: await OrderModel.countDocuments({}),
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = { addOrder, getOrders, orderDetail };