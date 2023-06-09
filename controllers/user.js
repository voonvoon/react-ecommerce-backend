const Users = require("../models/user");
const Product = require("../models/product");
const Cart = require("../models/cart");
const Coupon = require("../models/coupon");
const Order = require("../models/order");
const uniqid = require('uniqid');

exports.userCart = async (req, res) => {
  // console.log(req.body); // should hv cart item {cart:[]}
  const { cart } = req.body;

  let products = []; // cuz in product model no count...

  // find who is login user
  //cart will saved by tis user
  const user = await Users.findOne({ email: req.user.email }).exec(); // since use Authcheck in route so get email from firebase

  //check if cart with logged in user id already exist
  //if hv, remove then start all over again-cuz each user hv only 1 cart
  let cartExistByThisUser = await Cart.findOne({ orderdBy: user._id }).exec();

  if (cartExistByThisUser) {
    cartExistByThisUser.deleteOne(); // change from remove() to deleteOne works!
    console.log("remove old cart");
  }

  for (let i = 0; i < cart.length; i++) {
    let object = {};

    object.product = cart[i]._id; // add product
    object.count = cart[i].count; // add count
    object.color = cart[i].color; // add color

    // get price for getting total from our db
    //avoid get from front end to avoid ppl change price in localstorage
    let productFromDb = await Product.findById(cart[i]._id)
      .select("price")
      .exec(); //get from db more safe, only select price
    object.price = productFromDb.price;

    products.push(object);
  }

  // console.log('products', products);

  let cartTotal = 0;
  for (let i = 0; i < products.length; i++) {
    cartTotal = cartTotal + products[i].price * products[i].count;
  }

  //console.log('cartTotal', cartTotal);
  let newCart = await new Cart({
    products,
    cartTotal,
    orderdBy: user._id,
  }).save();

  console.log("new cart --->", newCart);
  res.json({ ok: true });
};

exports.getUserCart = async (req, res) => {
  const user = await Users.findOne({ email: req.user.email }).exec(); //find user in firebase by email

  let cart = await Cart.findOne({ orderdBy: user._id })
    .populate("products.product", "_id title price totalAfterDiscount")
    .exec();

  //original code from tutor:
  // destructure in tis way so easier to access in frontend.
  //const { products, cartTotal, totalAfterDiscount } = cart; // by doing that:
  //res.json({ products, cartTotal, totalAfterDiscount }); // so can access in frontend res.data.products
  // instead of res.data.cart.products

  // i change above code to solve a bugs:
  //TypeError: Cannot destructure property 'products' of 'cart' as it is null.
  res.json({ cart }); // so i access in frontend tis way:res.data.cart.products
};

exports.emptyCart = async (req, res) => {
  const user = await Users.findOne({ email: req.user.email }).exec();

  const cart = await Cart.findOneAndRemove({ orderdBy: user._id }).exec();
  res.json(cart);
};

exports.saveAddress = async (req, res) => {
  const userAddress = await Users.findOneAndUpdate(
    { email: req.user.email },
    { address: req.body.address }
  ).exec(); // 1st arg = which to update 2md arr =  what to update

  res.json({ ok: true });
};

exports.applyCouponToUserCart = async (req, res) => {
  const { coupon } = req.body; // user input coupon
  console.log("coupon", coupon);

  // check if coupon valid
  const validCoupon = await Coupon.findOne({ name: coupon }).exec();
  if (validCoupon === null) {
    // if no such coupon
    return res.json({
      err: "Invalid coupon",
    });
  }
  //console.log("Valid coupon", validCoupon);

  //find login user
  const user = await Users.findOne({ email: req.user.email }).exec(); // user get from firebase cuz we use AuthCheck middleware

  // find user cart details , check Cart in db see more
  let { products, cartTotal } = await Cart.findOne({
    orderdBy: user._id,
  })
    .populate("products.product", "_id title price")
    .exec();

  //console.log("cartTotal", cartTotal, "discount%", validCoupon.discount);

  // Calculate Total after discount
  let totalAfterDiscount = (
    cartTotal -
    (cartTotal * validCoupon.discount) / 100
  ).toFixed(2); // 99.9999... will become 99.99

  console.log("------->>>>", totalAfterDiscount);

  // update Cart's totalAfterDiscount field
  Cart.findOneAndUpdate(
    { orderdBy: user._id }, //which cart to update
    { totalAfterDiscount }, //what to update // totalAfterDiscount: totalAfterDiscount
    { new: true }
  ).exec();

  res.json(totalAfterDiscount);
};

exports.createOrder = async (req, res) => {
  // get paymentIntent from frtend to here
  const { paymentIntent } = req.body.stripeResponse; // stripeResponse is obj key sent from frt end
  const user = await Users.findOne({ email: req.user.email }).exec(); // cuz we hv authCheck in route, can access req.user.email in firebase like tis

  // find all products in Cart db for tis user
  let { products } = await Cart.findOne({ orderdBy: user._id }).exec();

  // above we hv paymentIntend, user, products in cart, so we can create order:

  let newOrder = await new Order({
    products,
    paymentIntent,
    orderdBy: user._id,
  }).save();

  // decrement quantity , increment sold
  let bulkOption = products.map((item) => {
    return {
      updateOne: {
        //find which product id to update
        filter: { _id: item.product._id }, // important item.product -can see db for more understand afte got cart
        //The filter field specifies the criteria for selecting the document to be updated.
        //what to update
        update: { $inc: { quantity: -item.count, sold: +item.count } }, //$inc operator to increment or decrement the values
      },
    };
  });

  //console.log("bulkOption -->", bulkOption);

  let updated = await Product.bulkWrite(bulkOption, {}); // bulkWrite method is used to perform multiple write operations in a single request.
  //console.log("Product quantity -- And Sold++", updated);

  //console.log("NEW ORDER SAVED", newOrder);
  res.json({ ok: true });
};


exports.createCashOrder = async (req, res) => {
  const { cod, couponApplied } = req.body; 

  if (!cod) return res.status(400).send("create cash order failed!")

  //create own paymentIntent for cod in the same pattern the info needed in history to avoid crash.
  
  //if cod is true, create order with status of Cash On Delivery

  const user = await Users.findOne({ email: req.user.email }).exec(); // cuz we hv authCheck in route, can access req.user.email in firebase like tis

  // find all products in Cart db for tis user
  let userCart = await Cart.findOne({ orderdBy: user._id }).exec();
 
  //if coupon applied , cal amount:
  let finalAmount = 0;

  if(couponApplied && userCart.totalAfterDiscount) {
    finalAmount = userCart.totalAfterDiscount * 100;
  } else {
    finalAmount = userCart.cartTotal * 100;
  }

  // create order:
  
  
  let newOrder = await new Order({
    products: userCart.products,
    paymentIntent: {   // create own payment intent here manually
      //id: uniqueid('cod'),
      id:uniqid(),
      amount: finalAmount,
      currency: "usd",
      status: "Cash On Delivery",
      created: Date.now() / 1000,  //covert mil sec to sec-> divide 1000 here cuz in frt end <ShowPaymentInfo/> * 1000 from stripe date(sec).
      payment_method_types: ['cash'],

    },
    orderdBy: user._id,
    orderStatus:"Cash On Delivery"
  }).save();

  // decrement quantity , increment sold
  let bulkOption = userCart.products.map((item) => {
    return {
      updateOne: {
        //find which product id to update
        filter: { _id: item.product._id }, // important item.product -can see db for more understand afte got cart
        //The filter field specifies the criteria for selecting the document to be updated.
        //what to update
        update: { $inc: { quantity: -item.count, sold: +item.count } }, //$inc operator to increment or decrement the values
      },
    };
  });

  //console.log("bulkOption -->", bulkOption);

  let updated = await Product.bulkWrite(bulkOption, {}); // bulkWrite method is used to perform multiple write operations in a single request.
  //console.log("Product quantity -- And Sold++", updated);

  //console.log("NEW ORDER SAVED", newOrder);
  res.json({ ok: true });
};

exports.order = async (req, res) => {
  let user = await Users.findOne({ email: req.user.email }).exec(); // cuz we hv authCheck middleware so can find user tis way

  let userOrders = await Order.find({ orderdBy: user._id })
    .populate(
      "products.product" // check db for more understanding
    )
    .exec();

  res.json(userOrders);
};

//addToWishlist
exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;

  const user = await Users.findOneAndUpdate(
    { email: req.user.email },
    { $addToSet: { wishlist: productId } }, //$addToSet is mongo method ensure no duplicate

  ).exec();

  // after updated no need res anything
  res.json({ ok: true });
};

//get all wishlist
exports.wishlist = async (req, res) => {
  const list = await Users.findOne({ email: req.user.email })
    .select("wishlist")
    .populate("wishlist")
    .exec();

  res.json(list);
};

//removeFromWishlist
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await Users.findOneAndUpdate(
    { email: req.user.email },
    { $pull: { wishlist: productId } }  //$pull is mongo method to pull out from db.
  ).exec();

  res.json({ ok:true });
};
