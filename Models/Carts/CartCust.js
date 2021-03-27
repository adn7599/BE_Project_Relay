const mongoose = require("mongoose");

const orderSchema = require("../Transactions/orderSchema");

const cartCustSchema = mongoose.Schema({
  _id: {
    type: String,
    ref: "GP_Customer",
  },
  orders: {
    type: [orderSchema],
    required: true,
  },
});

const CartCust = mongoose.model("Cart_Customer", cartCustSchema);

module.exports = CartCust;
