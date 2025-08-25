
const express = require("express")
const { getWalletInfo, createWallet, deposit, getAll, paymentReturn, createPayment } = require("../controllers/WalletController")


const router = express.Router()
router.get('/', getWalletInfo); // Lấy thông tin ví theo userId
router.get('/all', getAll); // Lấy thông tin ví theo userId
router.post('/create', createWallet); // Tạo ví mới
router.post('/deposit', deposit); // Tạo ví mới
router.get('/payment_return', paymentReturn);
router.post('/create_payment', createPayment);

module.exports = router 