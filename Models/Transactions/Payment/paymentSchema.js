const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    time: {
      type: mongoose.Schema.Types.Date,
      required: true,
    },
    mode: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

module.exports = paymentSchema;
