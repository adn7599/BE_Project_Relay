const mongoose = require("mongoose");

function getUserSchema(userRef) {
  const UserSchema = mongoose.Schema({
    _id: {
      //reg_id.
      type: String,
      ref: userRef,
    },
    regDateTime: {
      type: mongoose.Schema.Types.Date,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  });
  return UserSchema;
}

const Customer = mongoose.model("Customer", getUserSchema("GP_Customer"));
const Supplier = mongoose.model("Supplier", getUserSchema("GP_Supplier"));
const Distributor = mongoose.model(
  "Distributor",
  getUserSchema("GP_Distributor")
);

module.exports = { Customer, Supplier, Distributor };
