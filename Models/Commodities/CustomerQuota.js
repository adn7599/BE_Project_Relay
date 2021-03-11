const mongoose = require("mongoose");

const commodityDetailSchema = mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commodity",
    },
    allotedQuantity: {
      type: Number,
      required: true,
    },
    availableQuantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const customerQuotaSchema = mongoose.Schema({
  _id: {
    //Ration No.
    type: mongoose.Schema.Types.ObjectId,
    ref: "GP_Customer",
  },
  commodities: [commodityDetailSchema],
});

const CustomerQuota = mongoose.model("Customer_Quota", customerQuotaSchema);

module.exports = CustomerQuota;
