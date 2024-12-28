
const express=require("express")
const { register, login,loginWithGoogle, getAll, removeUser, addUser,update } = require("../controllers/UserController")


const router = express.Router()

router.get('/',getAll)
router.post('/register',register)
router.post('/add',addUser)
router.put('/login',login)
router.put('/update',update)
router.post('/google-login',loginWithGoogle)
router.delete('/delete',removeUser)
module.exports = router 