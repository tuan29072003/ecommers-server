
const express = require("express")
const { updateSubProduct, removeSubProduct, filterProducts, getFilterValues, updateProduct, getProductDetail, removeProduct, addSubProduct, getCategoriesDetail
    , updateCategories, addProduct, getProduct, addCategory, getCategories, deleteCategories, getBestSellers, getRandomSubProducts,
    getRelatedProducts, getMaxPrice, getAllSubProducts, getProductOptions
} = require("../controllers/ProductController")
const { checkRole } = require("../middleware/verifyToken")


const router = express.Router()
router.post('/add-product', addProduct)
router.get('/', getProduct)
router.post('/add-sub-product', addSubProduct)
router.get('/sub-products', getAllSubProducts);
router.get('/detail', getProductDetail)
router.post('/filter-products', filterProducts);
router.get('/get-best-seller', getBestSellers);
router.get('/get-random-subproduct', getRandomSubProducts);
router.get('/get-related-products', getRelatedProducts);
router.get('/get-max-price', getMaxPrice);
router.get('/get-product-options', getProductOptions);

//categiries
router.post('/add-category', addCategory)
router.get('/get-categories', getCategories)
router.get('/categories/detail', getCategoriesDetail)
router.get('/get-filter-values', getFilterValues);

router.use(checkRole);
router.put('/update', updateProduct)
router.delete('/remove-sub-product', removeSubProduct)
router.put('/update-sub-product', updateSubProduct);
router.delete('/delete-categories', deleteCategories)
router.put('/update-categories', updateCategories)
router.delete('/delete', removeProduct)

module.exports = router 