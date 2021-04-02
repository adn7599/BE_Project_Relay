const express = require("express");
const mongoose = require("mongoose");
const CartCust = require("../../../Models/Carts/CartCust");

const CustCart = require("../../../Models/Carts/CartCust");
const { CustomerQuota, Commodity } = require("../../../Models/Commodities");

const orderSchema = require("../../../Models/Carts/orderSchema");
//Constructing temporary orderSchemaModel for validation
const orderModel = mongoose.model("Order", orderSchema);

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;

    //Getting the cart Document
    const cartDoc = await CustCart.findById(reg_id);

    if (cartDoc) {
      //Populating with product details
      await cartDoc.populate("orders.product").execPopulate();

      //Need to also add some quota details
      //Finding the quota Document
      const quotaDoc = await CustomerQuota.findById(reg_id);
      //Converting to easily accessible dict form
      const quotaDocObj = {};
      quotaDoc.commodities.forEach((prod) => {
        quotaDocObj[prod.product] = {
          allotedQuantity: prod.allotedQuantity,
          availableQuantity: prod.availableQuantity,
        };
      });

      const mutCartDoc = cartDoc.toObject();
      let totalCartCost = 0;
      for (let i = 0; i < mutCartDoc.orders.length; i++) {
        const foundQuota = quotaDocObj[mutCartDoc.orders[i].product._id];

        mutCartDoc.orders[i].allotedQuantity = foundQuota.allotedQuantity;
        mutCartDoc.orders[i].availableQuantity = foundQuota.availableQuantity;
        mutCartDoc.orders[i].cartQuantity = mutCartDoc.orders[i].quantity;
        mutCartDoc.orders[i].cartCost =
          mutCartDoc.orders[i].cartQuantity *
          mutCartDoc.orders[i].product.price;
        totalCartCost += mutCartDoc.orders[i].cartCost;
        delete mutCartDoc.orders[i].quantity;
      }

      //Adding totalCartCost field
      mutCartDoc.totalCartCost = totalCartCost;

      res.json(mutCartDoc);
    } else {
      //First access, need to make cart
      const newCartDoc = new CustCart({
        _id: reg_id,
        orders: [],
      });

      //saving the cart
      await newCartDoc.save();
      res.json(newCartDoc);
    }
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        error: "Validation Error",
        response: err.errors,
      });
    } else {
      next(err);
    }
  }
});

router.post("/", async (req, res, next) => {
  //Update or add item to cart
  //Also need to check if the item satisfies quota
  try {
    let reg_id = req.user.reg_id;
    //Validating the request
    const order = new orderModel(req.body);
    await order.validate();

    //Checking if the request satisfies the quota

    //finding the Customer Quota Doc
    const custQuotaDoc = await CustomerQuota.findById(reg_id);
    //finding the commodity in quota list we've got the request for
    const qCommodity = custQuotaDoc.commodities.find(
      (comm) => comm.product === order.product
    );

    if (qCommodity) {
      //If the requested commodity is present in the quota
      //checking for commodity quantity satisfaction
      if (order.quantity <= qCommodity.availableQuantity) {
        //satisfies quantity restriction
        const cartCustDoc = await CartCust.findById(reg_id);

        if (cartCustDoc) {
          //if cart already exists

          const orderIndex = cartCustDoc.orders.findIndex(
            (order) => order.product === req.body.product
          );

          //checking if the order is already present in the cart
          if (orderIndex >= 0) {
            //order present
            //updating already present order if order quantity more than 0
            if (req.body.quantity > 0) {
              cartCustDoc.orders[orderIndex].quantity = req.body.quantity;
            } else {
              //quantity is 0, so removing the order
              cartCustDoc.orders.splice(orderIndex, 1);
            }
            const saveResp = await cartCustDoc.save();
            res.json(saveResp);
          } else {
            //Index -1, order not present
            //Inserting only if quantity more than 0
            if (req.body.quantity > 0) {
              cartCustDoc.orders.push(req.body);
            }
            const saveResp = await cartCustDoc.save();
            res.json(saveResp);
          }
        } else {
          //cart does not exist
          //creating a new cart for the customer
          const newCartCustDoc = new CartCust({
            _id: reg_id,
            orders: [],
          });
          //inserting new order if quantity is more than 0
          if (req.body.quantity > 0) {
            newCartCustDoc.orders.push(req.body);
          }
          //saving the new cart with the new order inserted
          const saveResp = await newCartCustDoc.save();
          res.json(saveResp);
        }
      } else {
        //Doesn't satisfies quantity restriction
        res.status(400).json({ error: "Order quantity out of quota" });
      }
    } else {
      //if the requested commodity is not present in the quota
      res.status(400).json({ error: "Product not present in your Quota" });
    }
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        error: "Validation Error",
        response: err.errors,
      });
    } else {
      next(err);
    }
  }
});

module.exports = router;
