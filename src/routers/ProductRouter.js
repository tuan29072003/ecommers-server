
const express=require("express")
const {updateSubProduct,removeSubProduct,filterProducts,getFilterValues,updateProduct,getProductDetail,removeProduct,addSubProduct,getCategoriesDetail,updateCategories,addProduct,getProduct, addCategory,getCategories,deleteCategories } = require("../controllers/ProductController")


const router = express.Router()
router.post('/add-product',addProduct)
router.get('/',getProduct)
router.post('/add-sub-product',addSubProduct)
router.delete('/delete',removeProduct)
router.get('/detail',getProductDetail)
router.put('/update',updateProduct)
router.post('/filter-products', filterProducts);
router.delete('/remove-sub-product',removeSubProduct)
router.put('/update-sub-product', updateSubProduct);

//categiries
router.post('/add-category',addCategory)
router.get('/get-categories',getCategories)
router.get('/categories/detail',getCategoriesDetail)
router.delete('/delete-categories',deleteCategories)
router.put('/update-categories',updateCategories)
router.get('/get-filter-values', getFilterValues);
module.exports = router 