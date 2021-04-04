const mongoose = require("mongoose");

const locationSchema = require("./Util/locationSchema");

const gpDistributorSchema = mongoose.Schema({
  _id: {
    //Reg_no.
    type: String,
    minLength: 12,
    maxLength: 12,
    match: /^DA\d+/,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    ref: "Region",
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
    unique: true,
  },
});

const GpDistributor = mongoose.model("GP_Distributor", gpDistributorSchema);

module.exports = GpDistributor;
