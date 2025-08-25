const SliderModel = require("../models/SliderModel");

const addSlider = async (req, res) => {
	const body = req.body;
	try {
		const item = new SliderModel(body);
		await item.save();
		res.status(200).json({
			data: item,
			message: 'create Slider Success!!!',
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
const getAll = async (req, res) => {
try{
			const item =await SliderModel.find()

			res.status(200).json({
				data: item,
				message: 'create Slider Success!!!',
			});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
const remove = async (req, res) => {
	const id = req.query
	try{
				 const item =await SliderModel.findByIdAndDelete(id.id)
				res.status(200).json({
					data: item,
					message: ' Success!!!',
				});
		} catch (error) {
			res.status(404).json({ message: error.message });
		}
	};
const update = async (req, res) => {
		const id = req.query
		const body = req.body
		try{
					 const item =await SliderModel.findByIdAndUpdate(id.id,body)
					res.status(200).json({
						data: item,
						message: 'Update Success!!!',
					});
			} catch (error) {
				res.status(404).json({ message: error.message });
			}
		};
module.exports = { addSlider ,getAll,remove,update}
