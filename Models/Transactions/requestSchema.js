const mongoose = require("mongoose");

const orderSchema = require("./orderSchema");

const refs = {
  GP_CUSTOMER : 'GP_Customer',
  GP_SUPPLIER : 'GP_Supplier',
  GP_DISTRIBUTOR : 'GP_Distributor',
}

function getRequestSchema(reqRef, provRef) {
  const requestSchema = mongoose.Schema(
    {
      reqestor_id: {
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
      order: {
        type: [{ type: orderSchema, unique: true }],
        required: true,
      },
    },
    { _id: false }
  );

  return requestSchema;
}

module.exports = { getRequestSchema , refs};
