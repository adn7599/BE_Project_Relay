const express = require("express");
const mongoose = require("mongoose");

const { GpSupplier, Supplier } = require("../../../Models/Users");
const CustCart = require("../../../Models/Carts/CartCust");
const { SupplierStock } = require("../../../Models/Commodities");

const router = express.Router();

//input
/*
{
  currentLocation: [long,lat], //-180 <=long <= 180 -90 <= lat <= 90
  orders: [1001,1002,...] //selected orders in cart
  maxRange: 1000  //distance from location in meters
}
*/
router.post("/", async (req, res, next) => {
  if (req.body.currentLocation && req.body.orders && req.body.maxRange) {
    try {
      const reg_id = req.user.reg_id;

      const currentLocation = req.body.currentLocation;
      const maxRange = req.body.maxRange;
      const orders = req.body.orders;

      //checking if location is valid
      if (
        !(
          currentLocation instanceof Array &&
          currentLocation.length == 2 &&
          currentLocation.every((l) => typeof l === "number")
        )
      ) {
        res.status(400).json({
          error: "Invalid location",
          msg: "location: [long,lat] where long & lat are numbers",
        });
        return;
      }

      const isValidLong =
        currentLocation[0] >= -180 && currentLocation[0] <= 180;
      const isValidLat = currentLocation[1] >= -90 && currentLocation[1] <= 90;

      if (!(isValidLong && isValidLat)) {
        res.status(400).json({
          error: "Invalid location",
          msg: "location: [long,lat] where -180 <=long <= 180 -90 <= lat <= 90",
        });
        return;
      }

      if (!(Number.isInteger(maxRange) && maxRange > 0)) {
        res.status(400).json({
          error: "Invalid maxRange",
          msg: "maxRange: 1000 i.e. distance number in meters and maxRange > 0",
        });
        return;
      }

      //checking if orders are of valid type
      if (
        !(
          orders instanceof Array &&
          orders.every((order) => {
            return Number.isInteger(order);
          })
        )
      ) {
        res.status(400).json({
          error: "Invalid orders",
          msg: "orders: [1001,1002,1003, ...] i.e. array of integers",
        });
        return;
      }
      //checking if orders sent are present in cart
      const cartDoc = await CustCart.findById(reg_id);
      //making a list of product_ids in cart
      const cartOrderIds = [];
      cartDoc.orders.forEach((order) => {
        cartOrderIds.push(order.product);
      });

      let validOrders = true;

      for (let order of orders) {
        if (!cartOrderIds.includes(order)) {
          console.log(order);
          validOrders = false;
          break;
        }
      }

      if (validOrders) {
        //orders are valid. Continuing

        //getting ids of registered suppliers
        const supplierDocs = await Supplier.find({}).select({ _id: true });
        const regSupplIds = supplierDocs.map((supp) => supp._id);

        //finding gp_suppliers who are already registered
        //and who are near the customer
        const validSupplierDocs = await GpSupplier.aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: currentLocation },
              distanceField: "dist.calculated",
              maxDistance: maxRange,
              query: { _id: { $in: regSupplIds } },
              includeLocs: "dist.location",
              spherical: true,
            },
          },
        ]);

        //Need to check for order satisfaction

        const validSupplierIds = validSupplierDocs.map((supp) => supp._id);

        const supplStockDocs = await SupplierStock.find({
          _id: { $in: validSupplierIds },
        });
        
        const respSupplierDocs = validSupplierDocs

        for(let i=0;i<respSupplierDocs.length;i++){

        }
        res.json(supplStockDocs);
      } else {
        //orders invalid. Sending error
        res.status(400).json({
          error: "Invalid orders or some orders not present in the cart",
          orders,
          cartOrderIds,
          validOrders,
        });
      }
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        console.log(err);
      } else {
        next(err);
      }
    }
  } else {
    res.status(400).json({
      error: "Parameters currentLocation,orders and maxRange required",
    });
  }
});

module.exports = router;
