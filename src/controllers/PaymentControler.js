const UserModel = require("../models/UserModel");
const BillModel = require("../models/BillModel");
const NotificationModel = require("../models/NotificationModel");
const SubProductModel = require("../models/SubProductModel");
const ProductModel = require("../models/ProductModel");
const SupplierModel = require("../models/SupplierModel");
const OrderModel = require("../models/OrderModel");
const AddressModel = require("../models/AddressModel");
const WalletModel = require("../models/WalletModel");
const TransactionModel = require("../models/TransactionModel");
const config = require('config');
const qs = require('qs');
const crypto = require('crypto');
const requestIp = require('request-ip');
// Giả sử đây là wrapper VNPay (bạn có thể dùng package có sẵn hoặc tự viết)
const { VNPay } = require('vnpay');;
// Nếu bạn chưa có logger riêng, có thể định nghĩa một hàm logger rỗng:
const ignoreLogger = () => { };

// Định nghĩa hằng số (có thể tùy chỉnh theo nhu cầu)
const VnpLocale = { VN: 'vn', EN: 'en' };
const ProductCode = { Other: 'other' };
const { handleSendMail } = require('../utils/handleSendMail')

const addBill = async (req, res) => {
	const body = req.body;
	const { uid, products, paymentMethod } = req.body;

	try {
		body.customer_id = uid;
		const customer = await UserModel.findById(uid);
		if (!customer) {
			return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
		}
		if (paymentMethod === 'wallet') {
			const wallet = await WalletModel.findOne({ userId: uid });
			if (!wallet) {
				return res.status(404).json({ message: 'Không tìm thấy ví của khách hàng.' });
			}
			if (wallet.balance < body.total) {
				return res.status(400).json({ message: 'Số dư trong ví không đủ để thanh toán.' });
			}
			wallet.balance -= body.total;
			// Tạo giao dịch hoàn tiền
			const data = {
				walletId: wallet._id,
				transactionType: 'payment',
				amount: body.total,
				status: 'success',
				method: 'wallet',
				description: `Thanh toán đơn hàng`,
			}
			await wallet.save();
			const transaction = new TransactionModel(data)
			await transaction.save();

		}
		// Kiểm tra và cập nhật số lượng sản phẩm
		const updatePromises = products.map(async (item) => {
			const subProduct = await SubProductModel.findById(item.subProductId);
			if (!subProduct) {
				throw new Error(`Sản phẩm với ID ${item.subProductId} không tồn tại.`);
			}
			if (subProduct.qty < item.count) {
				throw new Error(`Sản phẩm "${item.title}" không đủ hàng. Còn lại: ${subProduct.qty}.`);
			}

			// Trừ số lượng còn lại
			subProduct.qty -= item.count;
			await subProduct.save();
		});

		// Đợi tất cả sản phẩm được cập nhật số lượng
		await Promise.all(updatePromises);

		// Lưu hóa đơn vào database
		const newBill = new BillModel(body);
		await newBill.save();

		// Gửi email xác nhận đơn hàng
		// await handleSendMail({
		// 	from: 'Me',
		// 	to: customer.email,
		// 	html: `
		// 		<h1>Đơn hàng mới đã được đặt</h1>
		// 		<p>Mã đơn hàng: ${newBill._id}</p>
		// 	`,
		// 	subject: 'Đơn hàng mới',
		// });

		// Lưu thông báo đơn hàng mới cho admin
		const notification = new NotificationModel({
			title: 'New order',
			body: `Một đơn hàng mới đã được tạo bởi ${customer.name}.`,
			to: customer.name,
			from: 'admin',
			user_Id: uid,
			order_id: newBill._id,
		});
		await notification.save();

		// Trả về phản hồi thành công
		res.status(200).json({
			message: 'Đặt hàng thành công!',
			data: newBill,
		});
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
};

const getStatistics = async (_req, res) => {
	const filter = {
		isDeleted: false,
	};

	try {
		const sales = await BillModel.find({});
		const orders = await OrderModel.find({});
		const subProduct = await SubProductModel.find(filter);

		res.status(200).json({
			message: 'Success',
			data: {
				sales,
				suppliers: await SupplierModel.find({}).countDocuments(),
				products: await ProductModel.find(filter).countDocuments(),
				orders: orders.length,
				ordersItems: orders,
				totalOrder: orders.reduce((a, b) => a + b.total, 0),
				subProduct: subProduct.length,
				totalSubProduct: subProduct.reduce(
					(a, b) => a + b.price * (b.cost ?? 0),
					0
				),
			},
		});
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
};
const getBillDetail = async (req, res) => {
	const { id } = req.query;
	try {
		const bill = await BillModel.findById(id
		).populate('shippingAddress', 'phoneNumber address name')
		const customer = await UserModel.findById(bill.customer_id)
		const data = { ...bill._doc, customer };

		res.status(200).json({
			message: 'Success',
			data
		});
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
};
const getBills = async (req, res) => {
	const { page, limit, searchKey, start, end } = req.query;
	const pageNumber = parseInt(page) || 1;
	const limitNumber = parseInt(limit) || 20;
	const skip = (pageNumber - 1) * limitNumber;
	const startDate = start ? new Date(start) : undefined;
	const endDate = end ? new Date(end) : undefined;

	try {
		let customerIds = [];
		if (searchKey) {
			const [customers, addresses] = await Promise.all([
				UserModel.find({
					name: { $regex: searchKey, $options: 'i' }
				}).select('_id').lean(),

				AddressModel.find({
					address: { $regex: searchKey, $options: 'i' }
				}).select('createdBy').lean()
			]);

			customerIds = [...new Set([
				...customers.map(c => c._id.toString()),
				...addresses.map(a => a.createdBy.toString())
			])];
		}

		const filter = {};
		if (customerIds.length > 0 && searchKey) {
			filter.customer_id = { $in: customerIds };
		}
		if (startDate && endDate) {
			filter.createdAt = { $gte: startDate, $lte: endDate };
		}

		const items = await BillModel.find(filter)
			.populate('customer_id', 'name email') // Lấy thông tin khách hàng
			.populate('shippingAddress', 'name phoneNumber address') // Lấy thông tin địa chỉ giao hàng
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNumber)
			.lean(); // Giảm tải hiệu suất khi xử lý dữ liệu

		const total = await BillModel.countDocuments(filter);

		res.status(200).json({
			message: 'Success',
			data: {
				items,
				total,
			},
		});
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
};

const getBillsById = async (req, res) => {
	const { page, limit, id } = req.query;
	const limitNumber = parseInt(limit) || 20;
	const pageNumber = parseInt(page) || 1;

	const skip = (pageNumber - 1) * limitNumber;
	console.log(id)
	try {
		const filter = {}
		if (id) {
			filter.customer_id = id
		}
		const items = await BillModel.find(filter)
			.populate('shippingAddress', 'address')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNumber);
		const promiss = items.map(async (item) => {
			const customer = await UserModel.findById(item.customer_id).select('name email');

			console.log(customer)
			return {
				...item._doc,
				customer,
			};
		});
		const data = await Promise.all(promiss);
		res.status(200).json({
			message: 'Success',
			data: {
				items: data,
				total: await BillModel.countDocuments(),
			},
		});
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
};
const updateBill = async (req, res) => {
	const { id } = req.query;
	const { status } = req.body;
	const body = req.body;

	try {
		const bill = await BillModel.findById(id);
		if (!bill) {
			throw new Error('Bill not found');
		}
		const customer = await UserModel.findById(bill.customer_id);
		if (!customer) {
			throw new Error('Customer not found');
		}

		// Cập nhật hóa đơn
		const updatedBill = await BillModel.findByIdAndUpdate(id, body, { new: true });

		// Tạo thông báo cho khách hàng
		const notificationData = {
			title: 'New notification',
			body: `Đơn hàng ${bill._id} đã được cập nhật trạng thái.`,
			to: customer.name,
			from: 'admin',
			user_Id: customer._id,
			order_id: bill._id,
		};
		const notification = new NotificationModel(notificationData);
		await notification.save();

		// Nếu status là 3 thì cập nhật ví và tạo giao dịch
		if (status === 3) {
			// Tìm ví của người dùng (giả sử WalletModel có trường userId)
			let wallet = await WalletModel.findOne({ userId: customer._id });
			const billAmount = bill.total; // Số tiền từ hóa đơn

			// Nếu ví không tồn tại thì tạo mới ví với balance mặc định là 0
			if (!wallet) {
				wallet = new WalletModel({
					userId: customer._id,
					balance: 0,
					// Có thể thêm các trường khác nếu cần
				});
			}

			// Cộng số tiền từ hóa đơn vào balance của ví
			wallet.balance = (wallet.balance || 0) + billAmount;
			await wallet.save();

			// Tạo một giao dịch mới
			const transactionData = {
				walletId: wallet._id,
				billId: bill._id,
				amount: billAmount,
				transactionType: 'refund', // ví dụ: refund, credit, debit
				description: `Hoàn tiền cho đơn hàng ${bill._id}`,
				status: 'success',
				method: 'wallet',
			};
			const transaction = new TransactionModel(transactionData);
			await transaction.save();
		}

		res.status(200).json({
			message: 'Success',
			data: updatedBill,
		});
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
};
;





/**
 * Tạo URL thanh toán VNPay và lưu hóa đơn (bill)
 * Sử dụng _id của bill làm mã giao dịch (vnp_TxnRef)
 */
const createPayment = async (req, res) => {
	// Khởi tạo đối tượng VNPay với cấu hình từ VNPay
	const { default: dateFormat } = await import('dateformat');
	const vnpay = new VNPay({
		tmnCode: 'M4CZ8E16',
		secureSecret: "BTS4G8PKGGZRMWIUICRM9M9DGNV236MJ",
		vnpayHost: 'https://sandbox.vnpayment.vn',
		testMode: true,
		hashAlgorithm: 'SHA512',
		loggerFn: ignoreLogger
	});

	try {
		// Lấy thông tin đơn hàng từ client
		// Ví dụ: { total: 300000, databill: { uid, products, ... } }
		const { amount, databill } = req.body;
		if (!amount || !databill) {
			return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
		}

		// Lưu bill vào cơ sở dữ liệu
		const newBill = new BillModel(databill);
		// Giả sử trong databill có trường products chứa mảng sản phẩm
		await newBill.save();

		// Sử dụng _id của bill làm mã giao dịch duy nhất
		const txnRef = newBill._id.toString();

		// Tính ngày hết hạn giao dịch (ví dụ: 1 ngày sau)
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		// Gọi hàm buildPaymentUrl của VNPay để tạo URL thanh toán
		const vnpayResponse = await vnpay.buildPaymentUrl({
			vnp_Amount: amount, // Số tiền VNĐ
			vnp_IpAddr: '127.0.0.1', // Có thể thay bằng request IP nếu cần
			vnp_TxnRef: txnRef,
			vnp_OrderInfo: `Thanh toán đơn hàng ${txnRef}`,
			vnp_OrderType: ProductCode.Other,
			vnp_ReturnUrl: 'http://localhost:3002/payments/payment_return',
			vnp_Locale: VnpLocale.VN,
			vnp_CreateDate: dateFormat(new Date(), "yyyymmddHHMMss"),
			vnp_ExpireDate: dateFormat(tomorrow, "yyyymmddHHMMss")
		});

		// Trả về URL thanh toán cho client
		return res.status(200).json({ data: vnpayResponse, message: 'Success', billId: txnRef });
	} catch (error) {
		console.error('Error creating VNPay payment URL:', error);
		return res.status(500).json({ message: 'Lỗi hệ thống khi tạo URL thanh toán' });
	}
};

/**
 * Callback thanh toán từ VNPay.
 * - Nếu giao dịch thành công: cập nhật số lượng sản phẩm theo bill, cập nhật trạng thái thanh toán bill
 * - Nếu thất bại: xóa bill đã lưu
 */
const processOrderBill = async (bill) => {
	if (!bill.products || !Array.isArray(bill.products)) {
		throw new Error('Không có thông tin sản phẩm trong đơn hàng.');
	}
	const updatePromises = bill.products.map(async (item) => {
		const subProduct = await SubProductModel.findById(item.subProductId);
		if (!subProduct) {
			throw new Error(`Sản phẩm với ID ${item.subProductId} không tồn tại.`);
		}
		if (subProduct.qty < item.count) {
			throw new Error(`Sản phẩm "${item.title}" không đủ hàng. Còn lại: ${subProduct.qty}.`);
		}
		subProduct.qty -= item.count;
		return subProduct.save();
	});
	await Promise.all(updatePromises);
};

const paymentReturn = async (req, res) => {
	try {
		console.log('Bắt đầu xử lý phản hồi thanh toán từ VNPay...');
		console.log('Dữ liệu nhận được từ VNPay:', req.query);

		// Khởi tạo VNPay instance với cấu hình của bạn
		const vnpay = new VNPay({
			tmnCode: 'M4CZ8E16',
			secureSecret: "BTS4G8PKGGZRMWIUICRM9M9DGNV236MJ",
			vnpayHost: 'https://sandbox.vnpayment.vn',
			testMode: true,
			hashAlgorithm: 'SHA512',
			loggerFn: ignoreLogger
		});

		// Sử dụng hàm verifyReturnUrl của thư viện để kiểm tra dữ liệu callback
		const result = await vnpay.verifyReturnUrl(req.query);
		console.log('Kết quả kiểm tra chữ ký:', result);

		// Kiểm tra nếu result không tồn tại hoặc isSuccess là false
		if (!result || !result.isSuccess) {
			console.error('Xác thực chữ ký không thành công hoặc không có kết quả.');
			console.log('Thông báo từ VNPay:', result?.message || 'Không có thông báo');
			return res.redirect('http://localhost:3000/shop/checkout?payment=fail');
		}

		// Lấy mã giao dịch từ kết quả callback sử dụng vnp_TxnRef
		const txnRef = result.vnp_TxnRef;
		console.log('Mã giao dịch (vnp_TxnRef):', txnRef);
		console.log('Mã phản hồi từ VNPay (vnp_ResponseCode):', result.vnp_ResponseCode);

		if (result.vnp_ResponseCode === '00') {
			console.log('Giao dịch thành công.');
			const bill = await BillModel.findById(txnRef);
			const user = await UserModel.findById(bill.customer_id);

			if (bill) {
				console.log('Tìm thấy hóa đơn:', bill);
				// Trừ số lượng sản phẩm dựa trên thông tin trong bill
				await processOrderBill(bill);
				console.log('Đã xử lý đơn hàng.');

				// Cập nhật trạng thái thanh toán cho bill
				bill.paymentStatus = 1;
				await bill.save();
				const notification = new NotificationModel({
					title: 'New order',
					body: `Một đơn hàng mới đã được tạo bởi ${user.name}.`,
					to: user.name,
					from: 'admin',
					user_Id: user._id,
					order_id: bill._id,
				});
				await notification.save();
				console.log('Đã cập nhật trạng thái thanh toán thành công.');
			} else {
				console.warn('Không tìm thấy hóa đơn với mã:', txnRef);
			}

			return res.redirect('http://localhost:3000/shop/checkout?payment=success');
		} else {
			console.log('Giao dịch thất bại với mã phản hồi:', result.vnp_ResponseCode);
			console.log('Xóa hóa đơn với mã:', txnRef);
			await BillModel.findByIdAndDelete(txnRef);
			return res.redirect('http://localhost:3000/shop/checkout?payment=fail');
		}
	} catch (error) {
		console.error('Error in paymentReturn:', error);
		return res.status(500).json({ message: 'Lỗi hệ thống trong quá trình phản hồi thanh toán' });
	}
};






module.exports = { addBill, getStatistics, updateBill, getBills, getBillDetail, getBillsById, createPayment, paymentReturn };