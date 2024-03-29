const mongoose = require("mongoose");
//This schema is used for cust_cart or supplier_cart
const orderDetailSchema = mongoose.Schema(
  {
    product: {
      type: Number,
      ref: "Commodity",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Order quantity must be >= 0"],
    },
  },
  { _id: false }
);

module.exports = orderDetailSchema;
