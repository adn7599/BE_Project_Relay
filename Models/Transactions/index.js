const mongoose = require("mongoose");

const { getRequestSchema, refs } = require("./requestSchema");
const paymentSchema = require("./paymentSchema");
const confirmSchema = require("./confirmSchema");
const cancelSchema = require("./cancelSchema");

const transactionType = {
  CUST_SUPPL: "cust_suppl",
  SUPPL_DIST: "suppl_dist",
};

function getTransactionSchema(type) {
  let reqRef, provRef;
  if (type === transactionType.CUST_SUPPL) {
    reqRef = refs.GP_CUSTOMER;
    provRef = refs.GP_SUPPLIER;
  } else if (type === transactionType.SUPPL_DIST) {
    reqRef = refs.GP_SUPPLIER;
    provRef = refs.GP_DISTRIBUTOR;
  } else {
    return null;
  }

  return (TransactionSchema = mongoose.Schema({
    stageCompleted: {
      type: String,
      required: true,
      enum: ["request", "payment", "confirm", "cancelled"],
    },
    request: {
      type: getRequestSchema(reqRef, provRef),
      required: true,
    },
    request_sign: {
      type: String,
      required: true,
    },
    payment: {
      type: paymentSchema,
      default: null,
    },
    payment_sign: {
      type: String,
      default: null,
    },
    confirm: {
      type: confirmSchema,
      default: null,
    },
    confirm_sign: {
      type: String,
      default: null,
    },
    cancel: {
      type: cancelSchema,
      default: null,
    },
    cancel_sign: {
      type: String,
      default: null,
    },
  }));
}

const TransactionCustSuppl = mongoose.model(
  "Transaction_Cust_Suppl",
  getTransactionSchema(transactionType.CUST_SUPPL)
);

const TransactionSupplDist = mongoose.model(
  "Transaction_Suppl_Dist",
  getTransactionSchema(transactionType.SUPPL_DIST)
);

module.exports = { TransactionCustSuppl, TransactionSupplDist };
