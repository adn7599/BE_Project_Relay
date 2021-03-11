const mongoose = require("mongoose");

const locationSchema = require("./locationSchema");

const gpSupplierSchema = mongoose.Schema({
  _id: {
    //Reg_no.
    type: String,
    minLength: 12,
    maxLength: 12,
    match: /^SP\d+/
  },
  name:{
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    type: locationSchema,
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
  panNo: {
    type: String,
    required: true,
    minLength: 10,
    maxLength: 10,
    unique: true
  }
});

const GpSupplier = mongoose.model("GP_Supplier", gpSupplierSchema);

module.exports = GpSupplier;
