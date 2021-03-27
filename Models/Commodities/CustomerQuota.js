const mongoose = require("mongoose");

const commodityDetailSchema = mongoose.Schema(
  {
    product : {
      type: Number,
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
    type: String,
    ref: "GP_Customer",
  },
  commodities: [commodityDetailSchema],
});

const CustomerQuota = mongoose.model("Customer_Quota", customerQuotaSchema);

module.exports = CustomerQuota;
