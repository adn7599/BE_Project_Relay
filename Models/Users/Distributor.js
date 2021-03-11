const mongoose = require("mongoose");

const distributorSchema = mongoose.Schema({
  _id: {
    //Reg_no.
    type: mongoose.Schema.Types.ObjectId,
    ref: "GP_Distributor",
  },
  regDateTime: {
    type: mongoose.Schema.Types.Date,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 64, //SHA256 hash
    maxLength: 64,
  },
});

const Distributor = mongoose.model("Distributor", distributorSchema);

module.exports = Distributor;
