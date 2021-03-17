const mongoose = require("mongoose");

const { requestSchema } = require("../Request/RequestCustSupp");

const paymentSchema = require("./paymentSchema");

const paymentCustSupplSchema = mongoose.Schema({
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

const PaymentCustSuppl = mongoose.model(
  "Payment_Cust_Suppl",
  paymentCustSupplSchema
);

module.exports = PaymentCustSuppl;
