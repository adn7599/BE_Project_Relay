const mongoose = require("mongoose");

const cancelSchema = mongoose.Schema(
  {
    transaction_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    time: {
      type: mongoose.Schema.Types.Date,
      required: true,
    },
  },
  { _id: false }
);

module.exports = cancelSchema;
