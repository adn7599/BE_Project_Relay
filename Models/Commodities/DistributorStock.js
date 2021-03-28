const mongoose = require("mongoose");

const commodityDetailSchema = mongoose.Schema(
  {
    id: {
      type: Number,
      ref: "Commodity",
    },
    availableQuantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const distributorStockSchema = mongoose.Schema({
  _id: {
    //Ration No.
    type: String,
    ref: "GP_Distributor",
  },
  commodities: [commodityDetailSchema],
});

const DistributorStock = mongoose.model("Distributor_Stock", distributorStockSchema);

module.exports = DistributorStock;
