const express = require("express");
const router = express.Router();
const { getlistUserForCustomer, getPrivateMessages, getforAdmin, update } = require('../controllers/ChatController')
router.get('/', getlistUserForCustomer);
router.get('/admin', getforAdmin);
router.put('/update', update);
router.post("/private", getPrivateMessages); // Lấy tin nhắn riêng tư

module.exports = router;