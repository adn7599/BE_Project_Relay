const mongoose = require("mongoose");

const orderSchema = require('./orderSchema');

const requestSchema = mongoose.Schema(
  {
    reqestor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GP_Customer",
      required: true,
    },
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GP_Supplier",
      required: true,
    },
    time: {
      type: mongoose.Schema.Types.Date,
      required: true,
    },
    order: {
      type: [{type: orderSchema , unique: true}],
      required: true,
    },
  },
  { _id: false }
);

const reqCustSuppl = mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  request: {
    type: requestSchema,
    required: true,
  },
  sign: {
    type: String,
    required: true,
  },
});

const RequestCustSuppl = mongoose.model("Request_Cust_Suppl", reqCustSuppl);

module.exports = {RequestCustSuppl, requestSchema};
