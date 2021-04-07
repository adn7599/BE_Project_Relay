const mongoose = require("mongoose");

const commodityDetailSchema = mongoose.Schema(
  {
    product: {
      type: Number,
      ref: "Commodity",
    },
    maxQuantity: {
      type: Number,
      required: true,
    },
    availableQuantity: {
      type: Number,
      required: true,
    },
    orderedQuantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const supplierStockSchema = mongoose.Schema({
  _id: {
    //Ration No.
    type: String,
    ref: "GP_Supplier",
  },
  commodities: [commodityDetailSchema],
});

const SupplierStock = mongoose.model("Supplier_Stock", supplierStockSchema);

module.exports = SupplierStock;
