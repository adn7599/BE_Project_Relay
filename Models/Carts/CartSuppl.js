const mongoose = require("mongoose");

const orderSchema = require("../Transactions/orderSchema");

const cartSupplSchema = mongoose.Schema({
  _id: {
    type: String,
    ref: "GP_Supplier",
  },
  orders: {
    type: [orderSchema],
    required: true,
  },
});

const CartSuppl = mongoose.model("Cart_Supplier", cartSupplSchema);

module.exports = CartSuppl;
