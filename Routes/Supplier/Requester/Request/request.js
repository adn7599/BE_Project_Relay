const express = require("express");
const mongoose = require("mongoose");

const cancelRequest = require("./cancelRequest");
const {
  SupplierStock,
  Commodity,
  DistributorStock,
} = require("../../../../Models/Commodities");
const SupplCart = require("../../../../Models/Carts/CartSuppl");
const {
  getRequestSchema,
  refs,
} = require("../../../../Models/Transactions/requestSchema");
const { TransactionSupplDist } = require("../../../../Models/Transactions");

const router = express.Router();

/*
 * Input Json
 * {
 *    request: {
 *      "requester_id": "SP1111111111"
 *      "provider_id": "DA111111111",
 *      "time": "time",
 *      "orders": [{product: 1001, quantity: 2, totalCost: 100}, ...] //list of orders already placed in the cart
 *      "payment_amount": 1001
 *    }
 *    request_sign: "signature"
 *
 * }
 */

//creating a temp requestModel for validation
const requestModel = mongoose.model(
  "RequestSupplDist",
  getRequestSchema(refs.GP_SUPPLIER, refs.GP_DISTRIBUTOR)
);

router.post("/", async (req, res, next) => {
  try {
    if (req.body.request && req.body.request_sign) {
      const reg_id = req.user.reg_id;

      const request = req.body.request;
      const request_sign = req.body.request_sign;

      //Checking if the request schema is valid
      await requestModel.validate(request);

      //checking if array of orders has unique elements
      if (request.orders.length == 0) {
        res.status(400).json({ error: "request.orders array empty" });
        return;
      }
      const tempArray = [];
      tempArray.push(request.orders[0]);
      let duplicateOrder = false;
      for (let i = 1; i < request.orders.length; i++) {
        //checking if order is already present
        const loc = tempArray.findIndex(
          (tord) => tord.product == request.orders[i].product
        );
        if (loc != -1) {
          //order is already present
          duplicateOrder = true;
          break;
        } else {
          //order not present
          tempArray.push(request.orders[i]);
        }
      }

      if (duplicateOrder) {
        res.status(400).json({ error: "request.orders contains duplicates" });
        return;
      }

      if (!(typeof request_sign === "string")) {
        res.status(400).json({ error: "request_sign must be a string" });
        return;
      }

      if (request.requester_id !== reg_id) {
        res
          .status(400)
          .json({ error: "requester_id sent doesn't belong to you" });
        return;
      }

      //checking if the supplier is valid while getting its stock
      const distributorStockDoc = await DistributorStock.findById(
        request.provider_id
      );

      if (distributorStockDoc) {
        //distributor is valid

        //Checking if the orders are valid and present in the supplier's cart
        const supplCartDoc = await SupplCart.findById(reg_id);
        let validOrders = true;
        let errOrderMsg = ""; //message to be sent in case of an error

        for (let order of request.orders) {
          //looking for the order in customer's cart
          const cartOrder = supplCartDoc.orders.find(
            (cartOrd) => cartOrd.product == order.product
          );

          if (cartOrder) {
            //order found in the cart

            //Now we need to check if the order's quantity is same as the order in cart
            if (cartOrder.quantity != order.quantity) {
              //Quantity does not match
              validOrders = false;
              errOrderMsg = `Product ${order.product}'s quantity does not match with its cart quantity`;
              break;
            }
          } else {
            //order not present in the customer's cart
            //It could also be an invalid order
            validOrders = false;
            errOrderMsg = `Product ${order.product} not present in customer's cart or is an invalid order `;
            break;
          }
        }

        if (validOrders) {
          //Orders sent are valid

          //checking if the payment_amount sent is valid(both individual and aggregate)
          let calcCost = 0;
          //Fetching the commodity details
          //creating order list for using $in clause
          const ordersList = request.orders.map((order) => order.product);
          const commodityDocs = await Commodity.find({
            _id: { $in: ordersList },
          });
          let isIndividualCostCorrect = true;
          let individualCostErrorMsg = "";

          for (let order of request.orders) {
            const price = commodityDocs.find((ord) => {
              return ord._id == order.product;
            }).price;
            const calcOrderPrice = order.quantity * price;
            //checking if individual total cost sent is corrent
            if (order.totalCost !== calcOrderPrice) {
              isIndividualCostCorrect = false;
              individualCostErrorMsg = `Product ${order.product}'s cost is incorrent. Must be ${calcOrderPrice}`;
              break;
            }
            calcCost += calcOrderPrice;
          }

          if (!isIndividualCostCorrect) {
            res.status(400).json({ error: individualCostErrorMsg });
            return;
          }

          //checking if the payment_amount is valid
          if (request.payment_amount != calcCost) {
            res.status(400).json({
              error: `payment_amount is incorrect, must be ${calcCost}`,
            });
            return;
          }

          //Now checking if the orders satisfy distributor's stock
          let satisfiesStock = true;
          let errStockMsg = "";

          for (let order of request.orders) {
            //finding the product in distributor's stock
            const stockComm = distributorStockDoc.commodities.find(
              (comm) => comm.product == order.product
            );
            if (stockComm) {
              //order is present in supplier's stock
              //checking if the stock quantity is suffiecient
              if (!(stockComm.availableQuantity >= order.quantity)) {
                //order's quantity is more than present in stock
                satisfiesStock = false;
                errStockMsg = `Product ${order.product}'s quantity surpasses the available quantity in distributor's stock`;
                break;
              }
            } else {
              //order isn't present in supplier's stock
              satisfiesStock = false;
              errStockMsg = `Product ${order.product} is not kept in supplier's stock`;
              break;
            }
          }
          if (satisfiesStock) {
            //orders satisfy distributor's stock, continuing
            //Need to save the request and request sign in transaction collection
            //Before that updating the distributor's stock and supplier's cart and stock

            const transaction = new TransactionSupplDist({
              stageCompleted: "request",
              request: request,
              request_sign: request_sign,
            });

            //fetching supplier's stock for updation
            const supplStockDoc = await SupplierStock.findById(reg_id);

            //updating supplier's cart
            //updating supplier's stock
            //updating distributor's stock
            request.orders.forEach((order) => {
              const cartOrderLoc = supplCartDoc.orders.findIndex(
                (cartOrd) => cartOrd.product == order.product
              );
              const supplStockOrder = supplStockDoc.commodities.find(
                (stkOrd) => stkOrd.product == order.product
              );
              const distStockProd = distributorStockDoc.commodities.find(
                (stkPrd) => stkPrd.product == order.product
              );
              //Deleting the cart item
              supplCartDoc.orders.splice(cartOrderLoc, 1);
              //Now updating the quantity values
              supplStockOrder.orderedQuantity += order.quantity;
              distStockProd.availableQuantity -= order.quantity;
            });
            //saving all the changes in cart,quota,stock
            await Promise.all([
              supplCartDoc.save(),
              supplStockDoc.save(),
              distributorStockDoc.save(),
            ]);
            //finally, saving the transaction
            const transSaveResp = await transaction.save();
            res.json(transSaveResp);
          } else {
            //orders do not satisfy supplier's stock
            res.status(400).json({
              error: "Orders do not satisfy supplier's stock",
              msg: errStockMsg,
            });
          }
        } else {
          //orders are invalid or not present in your cart or quantity does not match
          res.status(400).json({
            error: "Invalid order or orders sent",
            msg: errOrderMsg,
          });
        }
      } else {
        //distributor_id invalid i.e. not found
        res.status(400).json({ error: "Distributor not found" });
      }
    } else {
      res.status(400).json({ error: "Fields request and orders request_sign" });
    }
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: "Validation Error", message: err.errors });
    } else {
      next(err);
    }
  }
});

//Adding delete(cancel) router
router.delete("/", cancelRequest);

module.exports = router;
