const express = require('express')

const router = express.Router() // router method from express

//middlewares
const { authCheck } = require("../middlewares/auth");

//controller
const { userCart, getUserCart, emptyCart, saveAddress, applyCouponToUserCart, createOrder, createCashOrder,order, addToWishlist, wishlist, removeFromWishlist } = require("../controllers/user");

router.post("/user/cart", authCheck, userCart); // save cart
router.get("/user/cart", authCheck, getUserCart); // get cart
router.delete("/user/cart", authCheck, emptyCart); //empty the cart
router.post("/user/address", authCheck, saveAddress); // save address

router.post('/user/order', authCheck, createOrder); //stripe
router.post('/user/cash-order', authCheck, createCashOrder); //cod
router.get('/user/orders', authCheck, order);

// coupon
router.post('/user/cart/coupon', authCheck, applyCouponToUserCart)

// wishlist //addToWishlist, wishlist, removeFromWishlist
router.post("/user/wishlist", authCheck, addToWishlist);
router.get("/user/wishlist", authCheck, wishlist);
router.put("/user/wishlist/:productId", authCheck, removeFromWishlist);

// router.get('/user', (req, res) => {
//     res.json({
//         data: "hey you hit user API endpoint...",
//     });
//   });

  module.exports = router;