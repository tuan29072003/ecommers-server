const bcrypt = require('bcrypt')
const UserModel = require('../models/UserModel');
const { getAccessToken } = require('../utils/getAccessToken');
const { generatorRandomText } = require('../utils/generatorRandomText');
const { handleSendMail } = require('../utils/handleSendMail');
// function register for user
const register = async (req, res) => {
	const body = req.body;
	try {
		const user = await UserModel.findOne({ email: body.email });
		if (user) {
			throw new Error('User already exists!');
		}
		const code = generatorRandomText(6);
		const salt = await bcrypt.genSalt(10);
		const hashpassword = await bcrypt.hash(body.password, salt);
		body.password = hashpassword;

		const newCustomer = new UserModel({ ...body, verifyCode: code });
		await newCustomer.save();
		delete newCustomer._doc.password;
		delete newCustomer._doc.verifyCode;

		await handleSendMail({
			from: 'Support Krist project',
			to: body.email,
			subject: 'Hello ✔',
			text: 'Hello world?',
			html: `<h1>Mã xác minh ${code}</h1>`,
		});

		console.log(code);

		res.status(200).json({
			message: 'Register successfully!!!',
			data: newCustomer,
		});
	} catch (error) {
		console.log(error);
		res.status(404).json({
			message: error.message,
		});
	}
};
const update = async (req, res) => {
	const { id } = req.query;
	const body = req.body;
	const { password } = body;
	try {
		// Kiểm tra id hợp lệ
		if (!id) {
			return res.status(400).json({ message: "ID is required" });
		}

		// Tìm user trong DB
		const user = await UserModel.findById(id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Nếu có password, kiểm tra xem có cần hash không
		if (password) {
			const isSamePassword = await bcrypt.compare(password, user.password);
			if (!isSamePassword) {
				const salt = await bcrypt.genSalt(10);
				body.password = await bcrypt.hash(password, salt);
			}
		}

		// Cập nhật user và lấy dữ liệu mới
		const updatedUser = await UserModel.findByIdAndUpdate(id, body, { new: true });

		res.status(200).json({
			message: "User updated successfully",
			data: {
				...updatedUser,
				accesstoken: await getAccessToken({
					_id: updatedUser._id,
					email: updatedUser.email,
					rule: updatedUser.rule ?? 1
				})
			},
		});
	} catch (error) {
		res.status(500).json({
			message: "Internal server error",
			error: error.message,
		});
	}
};
const addUser = async (req, res) => {
	const body = req.body;
	const { email, name, password } = body;
	try {
		const user = await UserModel.findOne({ email });

		if (user) {

			return res.status(404).json({
				message: 'Tài khoản đã tồn tại',
			});
		}

		const salt = await bcrypt.genSalt(10);
		const hashpassword = await bcrypt.hash(password, salt);

		body.password = hashpassword;
		const newUser = new UserModel(body);
		console.log(newUser)
		await newUser.save();

		delete newUser.password;

		res.status(200).json({
			message: 'Add success!',
			data: newUser
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const login = async (req, res) => {
	const body = req.body;
	console.log(body)
	const { email, name, password } = body;
	try {
		const user = await UserModel.findOne({ email });

		if (!user) {
			throw new Error(`Tài khoản không tồn tại`);
		}

		const checkpass = await bcrypt.compare(password, user.password);

		if (!checkpass) {
			throw new Error('Đăng nhập thất bại , Tài Khoản / Mật khẩu không đúng')
		}

		delete user.password;

		res.status(200).json({
			message: 'Login',
			data: {
				...user,
				accesstoken: await getAccessToken({
					_id: user._id,
					email: user.email,
					rule: user.rule ?? 1
				})
			},
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const forgotPassWord = async (req, res) => {
	const body = req.body;
	const { email } = body

	try {
		const user = await UserModel.findOne({ email });
		if (!user) {
			throw new Error('User isis not exists!');
		}
		const code = generatorRandomText(6);
		await UserModel.findByIdAndUpdate(user._id, { verifyCode: code });

		const newUser = await UserModel.findById(user._id).select('-password');
		console.log(newUser.verifyCode)
		delete newUser.verifyCode
		await handleSendMail({
			from: 'Support Krist project',
			to: email,
			subject: 'Hello ✔',
			text: 'Hello world?',
			html: `<h1>Mã xác minh ${code}</h1>`,
		});

		console.log(code);

		res.status(200).json({
			message: ' successfully!!!',
			data: newUser,
		});
	} catch (error) {
		console.log(error);
		res.status(404).json({
			message: error.message,
		});
	}
};
const loginWithGoogle = async (req, res) => {
	const body = req.body;
	const { email, name } = body;
	try {
		const user = await UserModel.findOne({ email });

		if (user) {
			await UserModel.findByIdAndUpdate(user._id, body)
			const newUser = await UserModel.findById(user._id)
			delete newUser.password;
			res.status(200).json({
				message: 'Login successfuly!',
				data: {
					...newUser,
					accesstoken: await getAccessToken({
						_id: newUser._id,
						email: newUser.email,
						rule: newUser.rule ?? 1,
					}),
				},
			});
		} else {
			const salt = await bcrypt.genSalt(10);
			const hashpassword = await bcrypt.hash(generatorRandomText(6), salt);
			body.password = hashpassword;

			const newUser = new UserModel(body);
			await newUser.save();

			delete newUser.password;

			res.status(200).json({
				message: 'Register',
				data: {
					...newUser,
					accesstoken: await getAccessToken({
						_id: newUser._id,
						email: newUser.email,
						rule: 1,
					}),
				},
			});
		}

	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const getAll = async (req, res) => {
	try {
		const items = await UserModel.find({});
		const total = await UserModel.countDocuments()

		res.status(200).json({
			message: 'Users!',
			data: { items, total },
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const getProfile = async (req, res) => {
	const { id } = req.query;

	try {
		const user = await UserModel.findById(id).select('-password');
		if (!user) {
			throw new Error('User not found');
		}

		res.status(200).json({
			message: 'Profile',
			data: user,
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const removeUser = async (req, res) => {
	const { id } = req.query;
	try {
		const user = await UserModel.findByIdAndDelete(id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		await UserModel.findByIdAndDelete(id);

		res.status(200).json({
			message: 'User removed',
			data: [],
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const getVerifiCode = async (req, res) => {
	const { id, code } = req.query;
	console.log(id, code)
	try {
		const customer = await UserModel.findById(id)

		if (!customer) {
			throw new Error('User is not found!!');
		}
		const verifyCode = customer.verifyCode;
		if (code !== verifyCode) {
			throw new Error('Code is invalid!!!');
		}

		await UserModel.findByIdAndUpdate(id, {
			isVerify: true,
			verifyCode: '',
			isDeleted: false,
		});

		const accesstoken = await getAccessToken({
			_id: customer._id,
			email: customer.email,
			rule: 0,
		});

		delete customer.password;
		delete customer.verifyCode;

		res.status(200).json({
			message: 'Verify successfully!!!',
			data: {
				...customer,
				accesstoken,
			},
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const resendCode = async (req, res) => {
	const { id, email } = req.query;

	try {
		const code = generatorRandomText(6);

		console.log(code);

		await handleSendMail({
			from: 'Support Kanban project',
			to: email,
			subject: 'Hello ✔',
			text: 'Hello world?',
			html: `<h1>Mã xác minh ${code}</h1>`,
		});

		await UserModel.findByIdAndUpdate(id, { verifyCode: code });

		res.status(200).json({
			message: 'New code',
			data: [],
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const sendmail = async (req, res) => {
	const body = req.body;
	try {
		await handleSendMail({
			from: body.name,
			to: body.email,
			subject: body.subject,
			text: body.message,
			html: `<h3>SDT: ${body.phone}</h3>`,
		});



		res.status(200).json({
			message: 'Register successfully!!!',
			data: [],
		});
	} catch (error) {
		console.log(error);
		res.status(404).json({
			message: error.message,
		});
	}
};
const repass = async (req, res) => {
	const { id } = req.query;
	const { oldpassword, password } = req.body;
	try {
		// Lấy người dùng theo id
		const user = await UserModel.findById(id);
		if (!user) {
			return res.status(404).json({
				message: 'Không tìm thấy người dùng',
			});
		}
		// Kiểm tra mật khẩu cũ có đúng không
		const checkpass = await bcrypt.compare(oldpassword, user.password);
		if (!checkpass) {
			return res.status(404).json({
				message: 'Đổi mật khẩu thất bại/ Mật khẩu cũ không đúng',
			});
		}
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		// Cập nhật mật khẩu cho người dùng
		user.password = hashedPassword;
		await user.save();

		res.status(200).json({
			message: 'Đổi mật khẩu thành công!',
			data: [],
		});
	} catch (error) {
		console.log(error);
		res.status(404).json({
			message: error.message,
		});
	}
};

module.exports = {
	register, login, loginWithGoogle, getAll, removeUser, getProfile, addUser,
	update, getVerifiCode, resendCode, forgotPassWord, sendmail, repass
}