
const express = require("express")

const { getOrderAndPurchase, getTopSellingAndLowQuantity, getTopCategories, getTotalProfit,
    getCustomer, addInfo, getInfo, exportTimeReport

} = require('../controllers/AdminController');
const router = express.Router()


router.get('/order-purchase', getOrderAndPurchase);
router.get('/top-selling', getTopSellingAndLowQuantity);
router.get('/total-profit', getTotalProfit);
router.get('/top-categories', getTopCategories);
router.get('/customer', getCustomer);
router.post('/add-info', addInfo);
router.get('/get-info', getInfo);
router.post('/export-data', exportTimeReport);
module.exports = router 