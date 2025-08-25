const PromotionModel = require("../models/PromotionModel");

const addNew = async (req, res) => {
	const body = req.body;

	try {
		const item = new PromotionModel(body);

		await item.save();

		res.status(200).json({
			message: 'Added',
			data: item,
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
const checkDisCountCode = async (req, res) => {
	const { code } = req.query;

	try {
		const item = await PromotionModel.findOne({ code });

		if (!item) {
			throw new Error('Invalid code');
		}

		if (item.numOfAvailable <= 0) {
			throw new Error('Code is unavailable');
		}

		const now = Date.now();

		if (new Date(item.startAt).getTime() > now) {
			throw new Error('code is not start time');
		}

		if (item.endAt && now > new Date(item.endAt).getTime()) {
			throw new Error('code is ended');
		}

		res.status(200).json({
			message: 'Promotion values',
			data: {
				value: item._doc.value,
				type: item._doc.type,
			},
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
const getPromotions = async (req, res) => {
	const { limit } = req.query;

	try {
		const items = await PromotionModel.find({ isDeleted: false }).limit(limit);

		res.status(200).json({
			message: 'Added',
			data: items,
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
const update = async (req, res) => {
	const { id } = req.query;
	const body = req.body;

	try {
		await PromotionModel.findByIdAndUpdate(id, body);

		res.status(200).json({
			message: 'Updated',
			data: [],
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

const remove = async (req, res) => {
	const { id } = req.query;
	try {
		await PromotionModel.findByIdAndDelete(id);

		res.status(200).json({
			message: 'Deleted',
			data: [],
		});
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};
module.exports = {
	addNew,
	getPromotions,
	update,
	remove,
	checkDisCountCode
}