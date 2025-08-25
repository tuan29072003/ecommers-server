const express = require("express")
const { addProduct, remove, get } = require("../controllers/WishlistController")


const router = express.Router()

router.post('/add', addProduct)
router.delete('/delete', remove)
router.get('/', get)
module.exports = router 