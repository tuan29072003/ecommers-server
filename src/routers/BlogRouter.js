const express = require("express")
const { add, getAll, getById, update } = require("../controllers/BlogController")

const router = express.Router()
router.post('/add', add)
router.get('/', getAll)
router.get('/getbyid', getById)
router.put('/update', update)
module.exports = router 