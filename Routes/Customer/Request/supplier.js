const express = require("express");
const mongoose = require("mongoose");

const { GpSupplier, Supplier } = require("../../../Models/Users");
const CustCart = require("../../../Models/Carts/CartCust");
const { SupplierStock, Commodity } = require("../../../Models/Commodities");

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
          orders.length > 0 &&
          orders.every((order) => {
            return Number.isInteger(order);
          })
        )
      ) {
        res.status(400).json({
          error: "Invalid orders",
          msg:
            "orders: [1001,1002,1003, ...] i.e. array of integers, must not be empty",
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
        //Getting a list of valid supplier ids in a list for $in query for their carts
        const validSupplierIds = validSupplierDocs.map((supp) => supp._id);
        //Getting the cart of the valid suppliers
        const supplStockDocs = await SupplierStock.find({
          _id: { $in: validSupplierIds },
        });
        //Turning the returned array of docs into
        /*{
            supplier_id: {
              prodId1: availquantity1,
              prodId2: availquantity2,
              prodId3: availquantity3,
            },
            ....
          }
        */
        //for easy access with dict type architecture
        const supplierStockDict = {};

        supplStockDocs.forEach((supp) => {
          supplierStockDict[supp._id] = {};
          supp.commodities.forEach((comm) => {
            supplierStockDict[supp._id][comm.id] = comm.availableQuantity;
          });
        });

        //converting the customer cart the same way for only received orders
        const cartOrdersDict = {};

        for (let order of orders) {
          const loc = cartDoc.orders.findIndex((ord) => ord.product == order);
          cartOrdersDict[order] = cartDoc.orders[loc].quantity;
        }

        const supplierResp = [];

        validSupplierDocs.forEach((supp) => {
          const respSupp = { ...supp };
          const suppId = supp._id;
          let satisfiedOrders = [];
          let satisfiesNum = 0;
          orders.forEach((order) => {
            const orderResp = {};
            orderResp.product = order;
            if (typeof supplierStockDict[suppId][order] !== "undefined") {
              if (supplierStockDict[suppId][order] >= cartOrdersDict[order]) {
                orderResp.satisfied = true;
                satisfiesNum += 1;
              } else {
                orderResp.satisfied = false;
                orderResp.availableStock = supplierStockDict[suppId][order];
              }
              orderResp.keepsInStock = true;
            } else {
              orderResp.keepsInStock = false;
            }
            satisfiedOrders.push(orderResp);
          });
          respSupp.satisfiedOrders = satisfiedOrders;
          respSupp.satisfiesNum = satisfiesNum;
          supplierResp.push(respSupp);
        });
        //Sending extra details for client side processing
        //Getting each cart product

        const commodityDocs = await Commodity.find({ _id: { $in: orders } });

        const cartInfo = {};
        let totalSelectedOrdersCost = 0;
        orders.forEach((order) => {
          const loc = commodityDocs.findIndex((comm) => comm._id == order);
          const info = commodityDocs[loc];
          cartInfo[order] = {
            name: info.name,
            unit: info.unit,
            price: info.price,
            cartQuantity: cartOrdersDict[order],
            cartCost: cartOrdersDict[order] * info.price,
          };
          totalSelectedOrdersCost += cartInfo[order].cartCost;
        });
        //Adding the totalSelectedOrdersCost
        cartInfo.totalSelectedOrdersCost = totalSelectedOrdersCost;
        //Adding total number of items selected in the cart
        cartInfo.numberOfItemsSelected = orders.length;
        res.json({
          suppliersFound: supplierResp,
          cartInfo,
        });
      } else {
        //orders invalid. Sending error
        res.status(400).json({
          error: "Invalid orders or some orders not present in the cart",
        });
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).json({
      error: "Parameters currentLocation,orders and maxRange required",
    });
  }
});

module.exports = router;
