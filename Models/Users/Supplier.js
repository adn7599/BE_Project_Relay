const mongoose = require("mongoose");

const supplierSchema = mongoose.Schema({
  _id: {
    //Reg_no.
    type: mongoose.Schema.Types.ObjectId,
    ref: "GP_Supplier",
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

const Supplier = mongoose.model("Supplier", supplierSchema);

module.exports = Supplier;
