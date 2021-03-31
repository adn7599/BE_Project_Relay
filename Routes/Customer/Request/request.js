const express = require("express");
const mongoose = require("mongoose");

const {
  SupplierStock,
  Commodity,
  CustomerQuota,
} = require("../../../Models/Commodities");
const CustCart = require("../../../Models/Carts/CartCust");
const {
  getRequestSchema,
  refs,
} = require("../../../Models/Transactions/requestSchema");
const { TransactionCustSuppl } = require("../../../Models/Transactions");

const router = express.Router();

/*
 * Input Json
 * {
 *    request: {
 *      "requester_id": "1111111111"
 *      "supplier_id": "SP111111111",
 *      "time": "time",
 *      "orders": [1001, 1002, 1003,..] //list of orders already placed in the cart
 *    }
 *    request_sign: "signature"
 *
 * }
 */

//creating a temp requestModel for validation
const requestModel = mongoose.model(
  "RequestCustSuppl",
  getRequestSchema(refs.GP_CUSTOMER, refs.GP_SUPPLIER)
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
      if (request.orders == 0) {
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
      const supplierStockDoc = await SupplierStock.findById(
        request.provider_id
      );

      if (supplierStockDoc) {
        //Supplier is valid

        //Checking if the orders are valid and present in the customer's cart
        const custCartDoc = await CustCart.findById(reg_id);
        let validOrders = true;
        let errOrderMsg = ""; //message to be sent in case of an error

        for (let order of request.orders) {
          //looking for the order in customer's cart
          const cartOrder = custCartDoc.orders.find(
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
          //Now checking if the orders satisfy supplier's cart
          let satisfiesStock = true;
          let errStockMsg = "";

          for (let order of request.orders) {
            //finding the product in supplier's stock
            const stockComm = supplierStockDoc.commodities.find(
              (comm) => comm.id == order.product
            );
            if (stockComm) {
              //order is present in supplier's stock
              //checking if the stock quantity is suffiecient
              if (!(stockComm.availableQuantity >= order.quantity)) {
                //order's quantity is more than present in stock
                satisfiesStock = false;
                errStockMsg = `Product ${order.product}'s quantity surpasses the available quantity in supplier's stock`;
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
            //orders satisfy supplier's stock, continuing
            //Need to save the request and request sign in transaction collection
            //before updating the stock and customer's cart and quota

            const transaction = new TransactionCustSuppl({
              stageCompleted: "request",
              request: request,
              request_sign: request_sign,
            });

            //fetching customer quota for updation
            const custQuotaDoc = await CustomerQuota.findById(reg_id);

            //updating supplier's cart
            //updating customer's quota
            //updating supplier's stock
            request.orders.forEach((order) => {
              const cartOrderLoc = custCartDoc.orders.findIndex(
                (cartOrd) => cartOrd.product == order.product
              );
              const quotaOrder = custQuotaDoc.commodities.find(
                (quotaOrd) => quotaOrd.product == order.product
              );
              const stockProd = supplierStockDoc.commodities.find(
                (stkPrd) => stkPrd.id == order.product
              );
              //Deleting the cart item
              custCartDoc.orders.splice(cartOrderLoc, 1);
              //Now updating the quantity values
              quotaOrder.availableQuantity -= order.quantity;
              stockProd.availableQuantity -= order.quantity;
            });
            await custCartDoc.save();
            await custQuotaDoc.save();
            await supplierStockDoc.save();
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
        //Supplier_id invalid i.e. not found
        res.status(400).json({ error: "Supplier not found" });
      }
    } else {
      res.status(400).json({ error: "Fields request and orders request_sign" });
    }
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.errors });
    } else {
      next(err);
    }
  }
});

module.exports = router;
