const express = require("express")
const { addNew, getPromotions, update, remove, checkDisCountCode } = require("../controllers/PromotionControl")
const { verifyToken, checkRole } = require('../middleware/verifyToken');

const router = express.Router();

router.get('/', getPromotions);

router.use(verifyToken);
router.post('/add-new', addNew);

router.get('/check', checkDisCountCode);
router.use(checkRole)
router.delete('/remove', remove);
router.put('/update', update);

module.exports = router