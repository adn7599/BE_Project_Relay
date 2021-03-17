const mongoose = require("mongoose");

const { requestSchema } = require("../Request/RequestSupplDist");

const paymentSchema = require("./paymentSchema");

const paymentSupplDistSchema = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  request: {
    type: requestSchema,
    required: true,
  },
  request_sign: {
    type: String,
    required: true,
  },
  payment: {
    type: paymentSchema,
    required: true,
  },
  payment_sign: {
    type: String,
    required: true,
  },
});

const PaymentSupplDist = mongoose.model(
  "Payment_Suppl_Dist",
  paymentSupplDistSchema
);

module.exports = PaymentSupplDist;
