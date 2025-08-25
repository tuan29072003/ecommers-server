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

		const fragrances = [];
		const sizes = [];
		const prices = [];

		if (datas.length > 0) {
			datas.forEach((item) => {
				item.fragrance && !fragrances.includes(item.fragrance) && colors.push(item.fragrance);
				item.size && sizes.push({ label: item.size, value: item.size });
				prices.push(item.price);
			});
		}


		res.status(200).json({
			message: 'get',
			data: {
				fragrances,
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
	try {
		const { page = 1, pageSize = 10, title, catIds, price, search } = req.query;

		const filter = { isDeleted: false };

		// Lọc theo title hoặc search
		if (title || search) {
			const searchRegex = new RegExp(title || search, "i");
			filter.slug = searchRegex;
		}

		// Lọc theo danh mục (catIds)
		if (catIds) {
			const categoryIdsArray = catIds.split(',').map(id => id.trim());
			filter.categories = { $in: categoryIdsArray };
		}

		// Nếu có lọc theo giá, tìm tất cả SubProducts trước
		let subProductFilter = { isDeleted: false };

		if (price) {
			const prices = price.split(',').map(Number);
			if (prices.length === 2) {
				subProductFilter.price = { $gte: prices[0], $lte: prices[1] };
			}
		}

		const subProducts = await SubProductModel.find(subProductFilter);
		const subProductIds = subProducts.map(sub => sub.productId.toString());

		// Nếu có lọc theo giá, chỉ lấy sản phẩm có subProduct thỏa mãn giá
		if (price) {
			filter._id = { $in: subProductIds };
		}

		// Lấy danh sách sản phẩm theo bộ lọc
		const allProducts = await ProductModel.find(filter)
			.skip((page - 1) * pageSize)
			.limit(Number(pageSize));

		// Kết hợp sản phẩm với subItems
		const items = allProducts.map(product => {
			const subItems = subProducts.filter(sub => sub.productId.toString() === product._id.toString());
			return { ...product._doc, subItems };
		});

		// Tính tổng số sản phẩm sau khi lọc
		const totalItems = await ProductModel.countDocuments(filter);
		const pageCount = Math.ceil(totalItems / pageSize);

		return res.status(200).json({
			message: 'Products',
			data: {
				items,
				totalItems,
				pageCount,
			},
		});
	} catch (error) {
		console.error("Error fetching products:", error);
		res.status(500).json({
			message: "Internal Server Error",
		});
	}
};




const getAllSubProducts = async (_req, res) => {
	try {
		const item = await SubProductModel.find()
		if (item.length > 0) {
			const promises = item.map(async (i) => {
				const price = i.price
				const costPrice = Math.floor(price * 0.7)
				await SubProductModel.findByIdAndUpdate(i._id, {
					costPrice
				})
			})
			await Promise.all(promises)
		}
		res.status(200).json({
			data: item,
			message: 'Update all OK',
		});
	} catch (error) {
		res.status(404).json({
			error: error.message,
		});
	}
};


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
const removeSubProduct = async (req, res) => {
	const { id, isSoftDelete } = req.query
	try {
		if (isSoftDelete) {
			await SubProductModel.findByIdAndUpdate(id, { isDeleted: true })
		} else {
			await SubProductModel.findByIdAndDelete(id)

		}
		res.status(200).json({
			message: 'Deleted !!!'
		})
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
}

const addSubProduct = async (req, res) => {
	const body = req.body;
	const { productId, size, qty, costPrice, price } = body;

	try {
		// Kiểm tra xem sub-product đã tồn tại chưa
		const existingSubProduct = await SubProductModel.findOne({
			productId,
			size,
			isDeleted: false, // Đảm bảo không tính những sản phẩm đã bị xóa
		});

		if (existingSubProduct) {
			// Nếu đã tồn tại, cập nhật số lượng và giá
			existingSubProduct.qty += qty;
			existingSubProduct.costPrice = costPrice; // cập nhật giá nhập mới
			existingSubProduct.price = price;         // cập nhật giá bán mới

			await existingSubProduct.save();

			return res.status(200).json({
				message: 'Updated existing sub-product successfully!',
				data: existingSubProduct,
			});
		}

		// Tạo mới nếu không tồn tại
		const subProduct = new SubProductModel(body);
		await subProduct.save();

		res.status(200).json({
			message: 'Add sub-product successfully!',
			data: subProduct,
		});
	} catch (error) {
		res.status(500).json({
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
	const { size, price, categories } = req.body;
	console.log(size, price, categories);

	// Xây dựng bộ lọc cho SubProduct
	let subProductFilter = { isDeleted: false };
	if (size) {
		subProductFilter.size = size;
	}
	if (price && price.length === 2) {
		subProductFilter.price = { $gte: price[0], $lte: price[1] };
	}

	try {
		// Tìm tất cả SubProduct thỏa mãn bộ lọc size và price
		const subProducts = await SubProductModel.find(subProductFilter);

		// Lấy danh sách productId từ subProducts
		const subProductIds = subProducts.map((item) => item.productId);

		// Xây dựng bộ lọc cho Product:
		// - Sản phẩm phải có _id nằm trong subProductIds (có SubProduct thỏa mãn)
		// - Nếu có categories thì lọc theo danh mục
		let productFilter = {
			isDeleted: false,
			_id: { $in: subProductIds }
		};
		if (categories && categories.length > 0) {
			productFilter.categories = { $in: categories };
		}

		// Tìm các Product thỏa mãn bộ lọc trên
		const products = await ProductModel.find(productFilter);

		// Tạo danh sách kết quả với subItems kèm theo
		const result = products.map((product) => {
			const subItems = subProducts.filter(
				(sub) => sub.productId.toString() === product._id.toString()
			);
			return { ...product._doc, subItems };
		});

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
	const { productId, size } = body;
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
const getMinMaxPrice = async (id) => {
	const subItems = await SubProductModel.find({ productId: id });

	const nums = subItems.map((item) => item.price);

	return [Math.min(...nums), Math.max(...nums)];
};
const getMaxPrice = async (_req, res) => {
	try {
		const items = await SubProductModel.find().sort({ price: -1 }).limit(1);
		res.status(200).json({
			message: '',
			data: items
		})
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const getBestSellers = async (req, res) => {
	try {

		const items = await ProductModel.find().limit(8);
		const data = [];

		items.forEach(async (item) => {
			data.push({ ...item._doc, price: await getMinMaxPrice(item._id) });

			data.length === items.length && res.status(200).json({ data });
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const getRandomSubProducts = async (req, res) => {
	try {
		const categories = await CategoryModel.find({ parentId: "" });

		const result = [];
		const usedProductIds = new Set(); // Lưu trữ các sản phẩm đã chọn để tránh trùng lặp

		for (const category of categories) {
			// Lấy 1 sản phẩm từ ProductModel có categories khớp và chưa được chọn
			const product = await ProductModel.aggregate([
				{
					$match: {
						categories: category._id.toString(), // Lọc theo category
						_id: { $nin: Array.from(usedProductIds) } // Loại trừ các sản phẩm đã chọn
					}
				},
				{ $sample: { size: 1 } } // Lấy ngẫu nhiên 1 sản phẩm
			]);

			if (product.length > 0) {
				usedProductIds.add(product[0]._id); // Thêm sản phẩm đã chọn vào danh sách
			}

			// Thêm category và product vào kết quả
			result.push({
				...category.toObject(),
				product: product.length > 0 ? product[0] : null, // Nếu không có sản phẩm, để null
			});

			// Nếu số lượng sản phẩm đạt 8 thì dừng
			if (result.length === 8) break;
		}

		res.status(200).json({
			message: 'Các subproducts ngẫu nhiên',
			data: result // Chuyển đổi Set thành mảng và lấy 8 phần tử
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({
			message: error.message,
		});
	}
};
const getRelatedProducts = async (req, res) => {
	const { id } = req.query;
	try {
		const product = await ProductModel.findById(id);

		if (!product) {
			throw new Error('Product not found');
		}

		const categoryId =
			product.categories && product.categories.length > 0
				? product.categories[0]
				: undefined;

		if (!categoryId) {
			throw new Error('Categories not found!');
		}

		const items = await ProductModel.find({ categories: { $in: categoryId } });

		const datas = items.length > 4 ? items.splice(0, 4) : items;

		const products = [];

		datas.forEach(async (item) => {
			products.push({ ...item._doc, price: await getMinMaxPrice(item._id) });

			products.length === datas.length &&
				res.status(200).json({ data: products });
		});
		// res.status(200).json({ data: products });
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const getProductOptions = async (_req, res) => {
	try {
		const items = await ProductModel.find({
			isDeleted: false,
		});

		const data = items.map((item) => ({
			value: item._id,
			label: item.title,
		}));

		res.status(200).json({
			data,
			message: 'OK',
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};




module.exports = {
	getRandomSubProducts,
	getRelatedProducts,
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
	getCategories, getFilterValues, getBestSellers, getMaxPrice,
	getAllSubProducts,
	getProductOptions
}