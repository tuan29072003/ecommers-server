/** @format */

const express = require("express");
const { getAllNotifications, update, getDetail, add } = require("../controllers/NotificationController");

const router = express.Router()


router.get('/', getAllNotifications);
router.put('/update', update);
router.post('/add', add);
router.get('/detail', getDetail);

module.exports = router;