
const express = require("express")
const {addProduct, updateProductInCart, getCartItems,removeCartItem, addNewAddress, deleteAddress, updateAddress, clearCardByUser, getAddressByUser} = require("../controllers/CartControler")

const router = express.Router()
router.post('/add-new', addProduct);
router.put('/update', updateProductInCart);
router.get('/', getCartItems);
router.delete('/remove', removeCartItem);
router.post('/add-new-address', addNewAddress);
router.get('/get-address', getAddressByUser);
router.delete('/remove-address', deleteAddress);
router.put('/update-address', updateAddress);
router.delete('/clear-carts', clearCardByUser);
module.exports = router 