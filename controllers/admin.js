const Users = require("../models/user");
const Order = require("../models/order");


// fetch all the order
exports.orders = async (req, res) => {
  let allOrders = await Order
  .find({})
  .sort('-createdAt')
  .populate("products.product")
  .exec();

  res.json(allOrders);
};

// update order status
exports.orderStatus = async (req, res) => {
    const { orderId, orderStatus } = req.body;

    let updated = await Order
        .findByIdAndUpdate(orderId, {orderStatus}, {new:true})
        .exec();

        res.json(updated);
}