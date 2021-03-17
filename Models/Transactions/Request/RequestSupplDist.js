const mongoose = require("mongoose");

const orderSchema = require("./orderSchema");

const requestSchema = mongoose.Schema(
  {
    reqestor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GP_Supplier",
      required: true,
    },
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GP_Distributor",
      required: true,
    },
    time: {
      type: mongoose.Schema.Types.Date,
      required: true,
    },
    order: {
      type: [{ type: orderSchema, unique: true }],
      required: true,
    },
  },
  { _id: false }
);

const reqSupplDistSchema = mongoose.Schema({
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

const RequestSupplDist = mongoose.model(
  "Request_Suppl_Dist",
  reqSupplDistSchema
);

module.exports = { RequestSupplDist, requestSchema };
