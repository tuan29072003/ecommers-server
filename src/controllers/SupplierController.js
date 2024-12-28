const  SupplierModel = require('../models/SupplierModel');


const getSuppliers = async (req, res) => {
	try {
		const items = await SupplierModel.find({})
		const total = await SupplierModel.countDocuments();
		res.status(200).json({
			message: 'Suppliers',
			data: { total, items }
		})
	} catch (error) {
		res.status(400).json({
			message: error.message
		})
	}
}
const addNew = async (req, res) => {
	const body = req.body;
	try {
		const newSupplier = new SupplierModel(body);
		newSupplier.save();

		res.status(200).json({
			message: 'Add new supplier successfully!!!',
			data: newSupplier,
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
	try {
		await SupplierModel.findByIdAndUpdate(id, {
			...body,updatedAt:Date.now()
		});

		res.status(200).json({
			message: 'Supplier updated',
			data: [],
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const removeSupplier = async (req, res) => {
	const { id } = req.query;
	try {
		await SupplierModel.findByIdAndDelete(id);

		res.status(200).json({
			message: 'Supplier removed',
			data: [],
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const getExportData = async (req, res) => {
	const body = req.body
	const {start,end} = req.query
	const filter = {}
	if(start && end){
		filter.createdAt={
			$lte:end,
			$gte:start
		}
	}
	try {
		const items = await SupplierModel.find(filter)
		const data = []
		if(items.length>0){
			items.forEach(item=>{
				const value = {}
				body.forEach(key => {
					value[`${key}`] = `${item[`${key}`]??''}`
				})
				data.push(value)
			})
		}
		res.status(200).json({
			message: 'Export successfully!!!',
			data: data
		})
	} catch (error) {
		res.status(400).json({
			message: error.message
		})
	}
}
module.exports = {getSuppliers,addNew,update,removeSupplier,getExportData}