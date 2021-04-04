const mongoose = require("mongoose");

const locationSchema = require("./Util/locationSchema");

const gpCustomerSchema = mongoose.Schema({
  _id: {
    //Ration no.
    type: String,
    minLength: 10,
    maxLength: 10,
  },
  fName: {
    type: String,
    required: true,
  },
  mName: {
    type: String,
    required: true,
  },
  lName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  mobNo: {
    type: String,
    required: true,
    minLength: 10,
    maxLength: 10,
    unique: true,
  },
  email: {
    type: String,
    required: false,
    match: /\S+@\S+\.\S+/,
    unique: true,
  },
  aadharNo: {
    type: String,
    required: true,
    minLength: 12,
    maxLength: 12,
    unique: true,
  },
});

const GpCustomer = mongoose.model("GP_Customer", gpCustomerSchema);

module.exports = GpCustomer;
