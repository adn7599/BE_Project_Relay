const mongoose = require("mongoose");

const customerSchema = mongoose.Schema({
  _id: {
    //Ration no.
    type: String,
    ref: 'GP_Customer'
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

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
