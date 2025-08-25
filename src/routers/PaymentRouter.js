/** @format */
const express = require("express")
// const  path = require('path');
// const  readFileSync = require('fs');
const { addBill, getStatistics, updateBill, getBills, getBillDetail,
    getBillsById, createPayment, paymentReturn } = require("../controllers/PaymentControler");


// const htmlFile = path.join(__dirname, '../../mails/paymentdone.html');
// const html = readFileSync(htmlFile, 'utf-8');
const router = express.Router()
router.get('/bills', getBills);
router.get('/billsby-id', getBillsById);
router.get('/detail', getBillDetail);
router.post('/create_payment', createPayment);
router.post('/add-bill', addBill);
router.get('/statistics', getStatistics);
router.put('/put-payment', updateBill);
router.get('/payment_return', paymentReturn);
module.exports = router 
