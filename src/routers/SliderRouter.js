const express = require("express");
const { addSlider,getAll,remove,update } = require("../controllers/SliderController");

const router = express.Router()


router.post('/add-new', addSlider);
router.get('/',getAll );
router.delete('/remove',remove );
router.put('/update',update );

module.exports = router;