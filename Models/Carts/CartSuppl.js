const mongoose = require("mongoose");

const orderSchema = require("../Transactions/Request/orderSchema");

const cartSupplSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GP_Supplier",
  },
  orders: {
    type: [{ type: orderSchema, unique: true }],
    required: true,
  },
});

const CartSuppl = mongoose.model("Cart_Supplier", cartSupplSchema);

module.exports = CartSuppl;
