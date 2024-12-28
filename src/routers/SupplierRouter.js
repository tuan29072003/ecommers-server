
const express=require("express")
const { getSuppliers,addNew, update,removeSupplier, getExportData} = require("../controllers/SupplierController")


const router = express.Router()

router.get('/',getSuppliers)
router.post('/get-export-data',getExportData)
router.post('/add',addNew)
router.put('/update',update)
router.delete('/delete',removeSupplier)
module.exports = router 