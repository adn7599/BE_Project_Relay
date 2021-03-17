const mongoose = require("mongoose");

const orderSchema = require("../Transactions/Request/orderSchema");

const cartCustSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GP_Customer",
  },
  orders: {
    type: [{ type: orderSchema, unique: true }],
    required: true,
  },
});

const CartCust = mongoose.model("Cart_Customer", cartCustSchema);

module.exports = CartCust;
