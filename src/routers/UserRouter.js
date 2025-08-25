
const express = require("express")
const { register, login, loginWithGoogle, getAll, removeUser, addUser, update,
    getVerifiCode, resendCode, forgotPassWord, getProfile, sendmail, repass } = require("../controllers/UserController")


const router = express.Router()
router.get('/profile', getProfile);
router.get('/', getAll)
router.put('/verify', getVerifiCode);
router.get('/resend-verify', resendCode);
router.post('/register', register)
router.post('/add', addUser)
router.put('/login', login)
router.put('/update', update)
router.post('/google-login', loginWithGoogle)
router.delete('/delete', removeUser)
router.put('/forgot-password', forgotPassWord);
router.post('/send-mail', sendmail);
router.post('/repass', repass);
module.exports = router 