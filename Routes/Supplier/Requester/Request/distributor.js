const express = require("express");
const mongoose = require("mongoose");

const {
  Distributor,
  GpSupplier,
  GpDistributor,
} = require("../../../../Models/Users");
const SupplCart = require("../../../../Models/Carts/CartSuppl");
const {
  DistributorStock,
  Commodity,
} = require("../../../../Models/Commodities");

const router = express.Router();

//input
/*
{
  orders: [1001,1002,...] //selected orders in cart
}
*/
router.post("/", async (req, res, next) => {
  if (req.body.orders) {
    try {
      const reg_id = req.user.reg_id;

      const orders = req.body.orders;

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
      const cartDoc = await SupplCart.findById(reg_id);

      //making a list of product_ids in cart
      const cartOrderIds = [];

      if (cartDoc) {
        cartDoc.orders.forEach((order) => {
          cartOrderIds.push(order.product);
        });
      }

      let validOrders = true;

      for (let order of orders) {
        if (!cartOrderIds.includes(order)) {
          validOrders = false;
          break;
        }
      }

      if (validOrders) {
        //orders are valid. Continuing

        //Finding supplier's region

        const supplDoc = await GpSupplier.findById(reg_id).select({
          region: true,
        });

        const supplRegion = supplDoc.region;

        //getting ids of registered Distributors
        const DistributorDocs = await Distributor.find({}).select({
          _id: true,
        });
        const regDistIds = DistributorDocs.map((dist) => dist._id);

        //finding gp_Distributors who are already registered
        //and who are in the region of the supplier
        const validDistributorDocs = await GpDistributor.find({
          _id: { $in: regDistIds },
        })
          .find({ region: supplRegion })
          .select({
            _id: 1,
            name: 1,
            address: 1,
            region: 1,
            mobNo: 1,
            email: 1,
          });

        //Need to check for order satisfaction
        //Getting a list of valid Distributor ids in a list for $in query for their carts
        const validDistributorIds = validDistributorDocs.map(
          (dist) => dist._id
        );
        //Getting the stock of the valid Distributors
        const distStockDocs = await DistributorStock.find({
          _id: { $in: validDistributorIds },
        });
        //Turning the returned array of docs into
        /*{
            Distributor_id: {
              prodId1: availquantity1,
              prodId2: availquantity2,
              prodId3: availquantity3,
            },
            ....
          }
        */
        //for easy access with dict type architecture
        const DistributorStockDict = {};

        distStockDocs.forEach((dist) => {
          DistributorStockDict[dist._id] = {};
          dist.commodities.forEach((comm) => {
            DistributorStockDict[dist._id][comm.product] =
              comm.availableQuantity;
          });
        });

        //converting the supplier cart the same way for only received orders
        const cartOrdersDict = {};

        for (let order of orders) {
          const loc = cartDoc.orders.findIndex((ord) => ord.product == order);
          cartOrdersDict[order] = cartDoc.orders[loc].quantity;
        }

        const DistributorResp = [];

        validDistributorDocs.forEach((dist) => {
          const respDist = { ...dist._doc };
          const distId = dist._id;
          let satisfiedOrders = [];
          let satisfiesNum = 0;
          orders.forEach((order) => {
            const orderResp = {};
            orderResp.product = order;
            if (typeof DistributorStockDict[distId][order] !== "undefined") {
              if (
                DistributorStockDict[distId][order] >= cartOrdersDict[order]
              ) {
                orderResp.satisfied = true;
                satisfiesNum += 1;
              } else {
                orderResp.satisfied = false;
                orderResp.availableStock = DistributorStockDict[distId][order];
              }
              orderResp.keepsInStock = true;
            } else {
              orderResp.keepsInStock = false;
            }
            satisfiedOrders.push(orderResp);
          });
          respDist.satisfiedOrders = satisfiedOrders;
          respDist.satisfiesNum = satisfiesNum;
          DistributorResp.push(respDist);
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
          DistributorsFound: DistributorResp,
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
      error: "Field orders required",
    });
  }
});

module.exports = router;
