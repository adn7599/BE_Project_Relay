const mongoose = require("mongoose");

const RegionSchema = mongoose.Schema({
  _id: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
});

const RegionModel = mongoose.model("Region", RegionSchema);

module.exports = RegionModel;
