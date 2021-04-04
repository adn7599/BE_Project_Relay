//Requiring to register the model
const RegionModel = require("./Util/Region");

const { Customer, Supplier, Distributor } = require("./User");

module.exports = {
  GpCustomer: require("./GpCustomer"),
  GpSupplier: require("./GpSupplier"),
  GpDistributor: require("./GpDistributor"),

  Customer,
  Supplier,
  Distributor,
};