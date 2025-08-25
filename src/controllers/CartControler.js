const CartModel = require("../models/CartModel");
const AddressModel = require("../models/AddressModel");

const addProduct = async (req, res) => {
	const { id } = req.query;

	const body = req.body;

	try {
		if (id) {
			await CartModel.findByIdAndUpdate(id, body);

			res.status(200).json({
				data: [],
				message: 'Update cart to DB!!!',
			});
		} else {
			const item = new CartModel(body);
			await item.save();
			res.status(200).json({
				data: item,
				message: 'Update cart to DB!!!',
			});
		}
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

const updateProductInCart = async (req, res) => {
	const { id } = req.query;

	const body = req.body;

	try {
		await CartModel.findByIdAndUpdate(id, body);

		res.status(200).json({ message: 'Done', data: [] });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
const getCartItems = async (req, res) => {
	const uid = req.query;
	const createdBy = uid.uid
	try {
		const items = await CartModel.find({ createdBy });
		res.status(200).json({ data: items });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
const removeCartItem = async (req, res) => {
	const { id } = req.query;
	try {
		await CartModel.findByIdAndDelete(id);

		res.status(200).json({ message: '', data: [] });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
const clearCardByUser = async (req, res) => {
	const { id } = req.query;

	try {
		const cartItems = await CartModel.find({ createdBy: id });

		cartItems.forEach(
			async (item) => await CartModel.findByIdAndDelete(item._id)
		);

		res.status(200).json({
			message: 'Đã xóa đơn hàng',
			data: [],
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const addNewAddress = async (req, res) => {
	try {
		const { isDefault, createdBy, ...addressData } = req.body;
		// Kiểm tra nếu không có ID người dùng
		if (!createdBy) {
			return res.status(400).json({ message: 'User ID is required.' });
		}

		// Nếu isDefault = true -> Đặt tất cả địa chỉ khác của người dùng này thành false
		if (isDefault) {
			await AddressModel.updateMany(
				{ createdBy },
				{ $set: { isDefault: false } }
			);
		}

		// Tạo địa chỉ mới
		const newAddress = new AddressModel({ ...addressData, createdBy, isDefault });
		await newAddress.save();

		return res.status(201).json({
			message: 'Address added successfully!',
			data: newAddress,
		});
	} catch (error) {
		console.error('Error adding address:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
};



const getAddressByUser = async (req, res) => {
	const id = req.query.uid;
	try {
		const items = await AddressModel.find({ createdBy: id });
		res.status(200).json({ message: 'fafa', data: items });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

const deleteAddress = async (req, res) => {
	const { id } = req.query;
	try {
		await AddressModel.findByIdAndDelete(id);
		res.status(200).json({ message: 'Deleted' });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

const updateAddress = async (req, res) => {
	const body = req.body;
	const { id } = req.query;
	try {
		await AddressModel.findByIdAndUpdate(id, body);

		const item = await AddressModel.findById(id);

		res.status(200).json({ message: 'Updated Success!', data: item });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
module.exports = {
	addProduct,
	updateProductInCart,
	getCartItems,
	removeCartItem,
	updateAddress,
	deleteAddress,
	clearCardByUser,
	addNewAddress,
	getAddressByUser
}