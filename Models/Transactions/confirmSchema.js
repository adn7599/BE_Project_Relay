const mongoose = require("mongoose");

const confirmSchema = mongoose.Schema(
  {
    transaction_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    time: {
      type: mongoose.Schema.Types.Date,
      required: true,
    },
    requester_token: {
      type: String,
      required: true,
    },
    provider_token: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

module.exports = confirmSchema;
