const { getAll, addnew, getData,remove,update } = require("../controllers/ReviewController");
const { verifyToken } = require("../middleware/verifyToken");
const express = require("express")

const router = express.Router();

router.get('/', getAll);

router.use(verifyToken);
router.post('/add-new', addnew);
router.put('/update', update);
router.get('/get-start-count', getData);
router.delete('/delete',remove );

module.exports= router;