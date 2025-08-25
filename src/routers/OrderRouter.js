
const express = require("express");
const { addOrder, getOrders, orderDetail } = require("../controllers/OrderController");

const router = express.Router()

router.post('/add', addOrder);
router.get('/detail', orderDetail);
router.get('/', getOrders);

module.exports = router 