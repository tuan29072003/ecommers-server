const ProductModel = require('../models/ProductModel');
const CategoryModel = require('../models/CategoryModel');
const SubProductModel = require('../models/SubProductModel');


const addCategory = async (req, res) => {
	const body = req.body;
	const { parentId, title, description, slug } = body;

	try {
		const category = await CategoryModel.find({
			$and: [{ parentId: { $eq: parentId } }, { slug: { $eq: slug } }],
		});

		if (category.length > 0) {
			throw Error('Category is existing!!!!');
		}

		const newCate = new CategoryModel(body);

		await newCate.save();

		res.status(200).json({
			message: 'Create Category success!!',
			data: newCate,
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const getCategories = async (req, res) => {
	const { page, pageSize } = req.query

	try {
		const skip = (page - 1) * pageSize

		const categories = await CategoryModel.find({ $or: [{ isDeleted: false }] }).skip(skip).limit(pageSize);
		res.status(200).json({
			message: 'Add new category successfully!!!',
			data: categories,
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const getCategoriesDetail = async (req, res) => {
	const { id } = req.query

	try {
		const item = await CategoryModel.findById(id)
		res.status(200).json({
			message: 'Add new category successfully!!!',
			data: item,
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const findAndRemoveCategoryInProducts = async (id) => {
	const items = await CategoryModel.find({ parentId: id });

	if (items.length > 0) {
		items.forEach(
			async (item) => await findAndRemoveCategoryInProducts(item._id)
		);
	}

	await handleRemoveCategoryInProducts(id);
};

const handleRemoveCategoryInProducts = async (id) => {
	await CategoryModel.findByIdAndDelete(id);
	const products = await ProductModel.find({ categories: { $all: id } });

	if (products && products.length > 0) {
		products.forEach(async (item) => {
			const cats = item._doc.categories;

			const index = cats.findIndex((element) => element === id);

			if (index !== -1) {
				cats.splice(index, 1);
			}

			await ProductModel.findByIdAndUpdate(item._id, {
				categories: cats,
			});
		});
	}
};

const deleteCategories = async (req, res) => {
	const { id, isDeleted } = req.query;

	try {
		await findAndRemoveCategoryInProducts(id);

		if (isDeleted) {
			await CategoryModel.findByIdAndDelete(id);
		} else {
			await CategoryModel.findByIdAndUpdate(id, {
				isDeleted: true,
			});
		}
		await res.status(200).json({
			message: 'Category deleted!!!',
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const updateCategories = async (req, res) => {
	const { id } = req.query
	const body = req.body
	try {
		await CategoryModel.findByIdAndUpdate(id, body)
		const item = await CategoryModel.findById(id)
		res.status(200).json({
			message: 'category deleted !!!',
			data: item,
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const getFilterValues = async (req, res) => {
	try {
		const datas = await SubProductModel.find();

		const colors = [];
		const sizes = [];
		const prices = [];

		if (datas.length > 0) {
			datas.forEach((item) => {
				item.color && !colors.includes(item.color) && colors.push(item.color);
				item.size && sizes.push({ label: item.size, value: item.size });
				prices.push(item.price);
			});
		}


		res.status(200).json({
			message: 'get',
			data: {
				colors,
				prices,
				sizes,
			},
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
//product
const getProduct = async (req, res) => {
	const { page, pageSize, title, catIds } = req.query;

	const filter = {};

	filter.isDeleted = false;

	if (title) {
		filter.slug = { $regex: title };
	}

	if (catIds) {
		const categoriesIds = catIds.includes(',') ? catIds.split(',') : [catIds];
		filter.categories = { $in: categoriesIds };
	}

	try {
		const skip = (page - 1) * pageSize;

		const products = await ProductModel.find(filter).skip(skip).limit(pageSize);
		const count = await ProductModel.find(filter);

		const total = await ProductModel.find({
			isDeleted: false,
		});

		const items = [];
		const pageCount = Math.ceil(count.length / pageSize);

		if (products.length > 0) {
			products.forEach(async (item) => {
				const children = await SubProductModel.find({
					productId: item._id,
					isDeleted: false,
				});

				items.push({
					...item._doc,
					subItems: children ?? [],
				});

				items.length === products.length &&
					res.status(200).json({
						message: 'Products',
						data: {
							items,
							totalItems: total.length,
							pageCount,
						},
					});
			});
		} else {
			res.status(200).json({
				message: 'Products',
				data: [],
			});
		}
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
}
const addProduct = async (req, res) => {
	const body = req.body;

	try {

		const newProduct = new ProductModel(body);
		await newProduct.save();

		res.status(200).json({
			message: 'Products',
			data: newProduct
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const getProductDetail = async (req, res) => {
	const { id } = req.query;
	try {
		const item = await ProductModel.findById(id);
		const subProducts = await SubProductModel.find({
			productId: id,
			isDeleted: false,
		});

		res.status(200).json({
			message: 'Products',
			data: {
				product: item,
				subProducts,
			},
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const removeSubProduct= async(req, res)=>{
const {id,isSoftDelete} = req.query
try {
	if(isSoftDelete){
		await SubProductModel.findByIdAndUpdate(id,{isDeleted:true})
	}else{
		await SubProductModel.findByIdAndDelete(id)
		
	}
	res.status.json({
		message:'Deleted !!!'
	})
} catch (error) {
	res.status(404).json({
		message: error.message,
	});
}
}

const addSubProduct = async (req, res) => {
	const body = req.body
	try {
		const subProduct = new SubProductModel(body)

		subProduct.save()

		res.status(200).json({
			message: 'Add sub product successfully!!!',
			data: subProduct
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const updateProduct = async (req, res) => {
	const body = req.body
	const { id } = req.query
	try {
		await ProductModel.findByIdAndUpdate(id, body)

		res.status(200).json({
			message: 'Product updated!!!',
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const handleRemoveSubProduct = async (items) => {
	items.forEach(async (item) => {
		await SubProductModel.findByIdAndUpdate(item._id, {
			isDeleted: true,
		});
	});
};

const removeProduct = async (req, res) => {
	const { id } = req.query;
	try {
		const subItems = await SubProductModel.find({ productId: id });

		if (subItems.length > 0) {
			await handleRemoveSubProduct(subItems);
		}

		await ProductModel.findByIdAndUpdate(id, {
			isDeleted: true,
		});

		res.status(200).json({
			message: 'Product removed!!',
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const filterProducts = async (req, res) => {
	const { colors, size, price, categories } = req.body;
  
	let subProductFilter = {};
	if (colors && colors.length > 0) {
	  subProductFilter.color = { $all: colors };
	}
	if (size) {
	  subProductFilter.size = size;
	}
	subProductFilter.isDeleted = false;
  
	if (price && price.length === 2) {
	  subProductFilter.price = { $gte: price[0], $lte: price[1] };
	}
  
	try {
	  // Tìm tất cả SubProduct dựa trên bộ lọc (ngoại trừ categories)
	  const subProducts = await SubProductModel.find(subProductFilter);
  
	  // Lấy danh sách productId từ subProducts
	  const subProductIds = subProducts.map((item) => item.productId);
  
	  // Xây dựng bộ lọc cho Product
	  let productFilter = { isDeleted: false };
	  if (categories && categories.length > 0) {
		productFilter.categories = { $in: categories };
	  }
  
	  // Tìm các Product thỏa mãn bộ lọc và đảm bảo bao gồm productId từ subProducts
	  const products = await ProductModel.find({
		$or: [
		  { _id: { $in: subProductIds } }, // Products có SubProducts thỏa mãn
		  productFilter,                  // Products thỏa mãn categories
		],
	  });
  
	  // Tạo danh sách kết quả (kèm subItems)
	  const result = products.map((product) => {
		const subItems = subProducts.filter(
		  (sub) => sub.productId.toString() === product._id.toString()
		);
		return { ...product._doc, subItems };
	  });
  
	  // Trả kết quả
	  res.status(200).json({
		data: {
		  items: result,
		  totalItems: result.length,
		},
	  });
	} catch (error) {
	  res.status(500).json({
		message: error.message,
	  });
	}
  };
  const updateSubProduct = async (req, res) => {
	const { id } = req.query;
	const body = req.body;
	try {
		await SubProductModel.findByIdAndUpdate(id, body);

		res.status(200).json({
			message: 'Updated!!!',
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
  
module.exports = {
	updateSubProduct,
	removeSubProduct,
	filterProducts,
	updateProduct,
	getProductDetail,
	removeProduct
	, addSubProduct,
	getCategoriesDetail,
	addProduct,
	updateCategories,
	deleteCategories,
	getProduct,
	addCategory,
	getCategories, getFilterValues
}