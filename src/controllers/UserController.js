const bcrypt = require('bcrypt')
const  UserModel = require('../models/UserModel');
const { getAccessToken } = require('../utils/getAccessToken');
const { generatorRandomText } = require('../utils/generatorRandomText');
// function register for user
const register = async (req, res) => {
	const body = req.body;
	const { email, name, password } = body;
	try {
		const user = await UserModel.findOne({ email });

		if (user) {
			throw new Error(`Tài khoản đã tồn tại`);
		}

		const salt = await bcrypt.genSalt(10);
		const hashpassword = await bcrypt.hash(password, salt);

		body.password = hashpassword;
		const newUser = new UserModel(body);

		await newUser.save();

		delete newUser.password;

		res.status(200).json({
			message: 'Register',
			data: {
				...newUser,
				token:{
					_id:user._id,
					email:user.email,
					rule:1
				}
			},
				
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const update = async (req, res) => {
	const body = req.body;
	const { id } = req.query;
	const {password}=body
	try {
		const user = await UserModel.findById(id)
		const checkPass = password===user.password
		if(!checkPass){
			const salt = await bcrypt.genSalt(10);
			const hashpassword = await bcrypt.hash(password,salt);
			body.password = hashpassword;
		}
		await UserModel.findByIdAndUpdate(id, {...body,
			updateAt:Date.now()
		});
		res.status(200).json({
			message: 'User updated',
			data: [],
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const addUser = async (req, res) => {
	const body = req.body;
	const { email, name, password } = body;
	try {
		const user = await UserModel.findOne({ email });

		if (user) {
			throw new Error(`Tài khoản đã tồn tại`);
		}

		const salt = await bcrypt.genSalt(10);
		const hashpassword = await bcrypt.hash(password, salt);

		body.password = hashpassword;
		const newUser = new UserModel(body);

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
	const { email, name, password } = body;
	try {
		const user = await UserModel.findOne({ email });

		if (!user) {
			throw new Error(`Tài khoản không tồn tại`);
		}

		const checkpass = await bcrypt.compare(password, user.password);

		if(!checkpass){
			throw new Error('Đăng nhập thất bại , Tài Khoản / Mật khẩu không đúng')
		}

		delete user.password;

		res.status(200).json({
			message: 'Login',
			data: {
				...user,
				token:await getAccessToken({
					_id:user._id,
					email:user.email,
					rule:user.rule??1
				})
			},
		});
	} catch (error) {
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
		await UserModel.findByIdAndUpdate(user._id,body)
		const newUser = await UserModel.findById(user._id)
			delete newUser.password;
			res.status(200).json({
				message: 'Login successfuly!',
				data: {
					...newUser,
					token: await getAccessToken({
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
					token: await getAccessToken({
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
				data: {items,total},
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
module.exports = {register,login,loginWithGoogle,getAll,removeUser,addUser,update}