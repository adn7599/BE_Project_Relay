const mongoose = require("mongoose");

const orderSchema = require("./orderSchema");

const refs = {
  GP_CUSTOMER: "GP_Customer",
  GP_SUPPLIER: "GP_Supplier",
  GP_DISTRIBUTOR: "GP_Distributor",
};

function getRequestSchema(reqRef, provRef) {
  const requestSchema = mongoose.Schema(
    {
      requester_id: {
        type: String,
        ref: reqRef,
        required: true,
      },
      provider_id: {
        type: String,
        ref: provRef,
        required: true,
      },
      time: {
        type: mongoose.Schema.Types.Date,
        required: true,
      },
      orders: {
        type: [orderSchema],
        required: true,
      },
    },
    { _id: false }
  );

  return requestSchema;
}

module.exports = { getRequestSchema, refs };
