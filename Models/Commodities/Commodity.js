const mongoose = require("mongoose");

const commoditySchema = mongoose.Schema({
  _id: Number,
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  //image: not required, can name file with id
});

const Commodity = mongoose.model("Commodity", commoditySchema);

module.exports = Commodity;
