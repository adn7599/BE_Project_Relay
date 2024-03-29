const mongoose = require("mongoose");

//This schema is used for transaction.payment.order
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
    totalCost: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

module.exports = orderDetailSchema;