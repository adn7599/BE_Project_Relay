const mongoose = require("mongoose");

const { requestSchema } = require("../Request/RequestSupplDist");
const paymentSchema = require("../Payment/paymentSchema");

const confirmSchema = require("./confirmSchema");

const confirmSupplDistSchema = mongoose.Schema({
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
  confirm: {
    type: confirmSchema,
    required: true,
  },
  confirm_sign: {
    type: String,
    required: true,
  },
});

const ConfirmSupplDist = mongoose.model(
  "Confirm_Suppl_Dist",
  confirmSupplDistSchema
);

module.exports = ConfirmSupplDist;
