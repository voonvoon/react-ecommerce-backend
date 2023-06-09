const express = require('express')

const router = express.Router() // router method from express

//middleware
const { authCheck, adminCheck } = require("../middlewares/auth");
//controller
const { create, remove, list } = require("../controllers/coupon");

// routes
router.post("/coupon", authCheck, adminCheck, create);
router.get("/coupons", list ); // this is public no need middleware check auth
router.delete("/coupon/:couponId", authCheck, adminCheck, remove);


  module.exports = router;