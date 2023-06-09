const Users = require("../models/user");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Coupon = require("../models/coupon");
const stripe = require("stripe")(process.env.STRIPE_SECRET); // invoke stipe wit secret code also

exports.createPaymentIntent = async (req, res) => {
  //console.log(req.body);
  const {couponApplied} = req.body

  // later apply coupon

  // later cal price

  // 1. find user
  const user = await Users.findOne({ email: req.user.email }).exec();
  // 2. get user cart total
  const { cartTotal, totalAfterDiscount } = await Cart.findOne({
    orderdBy: user._id,
  }).exec();

  console.log(
    "CART TOTAL CHARGED",
    cartTotal,
    "After Dis%",
    totalAfterDiscount
  );


  let finalAmount = 0;

  if(couponApplied && totalAfterDiscount) {
    finalAmount = totalAfterDiscount * 100;
  } else {
    finalAmount = cartTotal * 100;
  }


  // create payment intent with order amount and currency

  //use stripe module, tat giv us paymentintents method
  // from above method also giv us create method -need amount & currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: finalAmount,
    currency: "usd",
  });

  // then send to client to process payment
  res.send({
    clientSecret: paymentIntent.client_secret,
    cartTotal,
    totalAfterDiscount,
    payable: finalAmount,
  });
};
