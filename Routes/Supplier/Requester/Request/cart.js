const express = require("express");
const mongoose = require("mongoose");

const SupplCart = require("../../../../Models/Carts/CartSuppl");
const { SupplierStock, Commodity } = require("../../../../Models/Commodities");

const orderSchema = require("../../../../Models/Carts/orderSchema");
//Constructing temporary orderSchemaModel for validation
const orderModel = mongoose.model("Order", orderSchema);

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;

    //Getting the cart Document
    const cartDoc = await SupplCart.findById(reg_id);

    //Populating with product details
    await cartDoc.populate("orders.product").execPopulate();

    //Need to also add some stock details
    //Finding the stock Document
    const stockDoc = await SupplierStock.findById(reg_id);
    //Converting to easily accessible dict form
    const stockDocObj = {};
    stockDoc.commodities.forEach((prod) => {
      stockDocObj[prod.product] = {
        maxQuantity: prod.maxQuantity,
        availableQuantity: prod.availableQuantity,
        orderedQuantity: prod.orderedQuantity,
      };
    });

    const mutCartDoc = cartDoc.toObject();
    let totalCartCost = 0;
    for (let i = 0; i < mutCartDoc.orders.length; i++) {
      const foundStock = stockDocObj[mutCartDoc.orders[i].product._id];

      mutCartDoc.orders[i].maxQuantity = foundStock.maxQuantity;
      mutCartDoc.orders[i].availableQuantity = foundStock.availableQuantity;
      mutCartDoc.orders[i].orderedQuantity = foundStock.orderedQuantity;
      mutCartDoc.orders[i].cartQuantity = mutCartDoc.orders[i].quantity;
      mutCartDoc.orders[i].cartCost =
        mutCartDoc.orders[i].cartQuantity * mutCartDoc.orders[i].product.price;
      totalCartCost += mutCartDoc.orders[i].cartCost;
      delete mutCartDoc.orders[i].quantity;
    }

    //Adding totalCartCost field
    mutCartDoc.totalCartCost = totalCartCost;

    res.json(mutCartDoc);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        error: "Validation Error",
        message: err.errors,
      });
    } else {
      next(err);
    }
  }
});

router.post("/", async (req, res, next) => {
  //Update or add item to cart
  //Also need to check if the item satisfies stock
  try {
    let reg_id = req.user.reg_id;
    //Validating the request
    const order = new orderModel(req.body);
    await order.validate();

    //Checking if the request satisfies the quota

    //finding the supplier stock Doc
    const supplStockDoc = await SupplierStock.findById(reg_id);
    //finding the commodity in stock list we've got the request for
    const sCommodity = supplStockDoc.commodities.find(
      (comm) => comm.product === order.product
    );

    if (sCommodity) {
      //If the requested commodity is present in the stock
      //checking for commodity quantity satisfaction
      if (
        order.quantity +
          sCommodity.availableQuantity +
          sCommodity.orderedQuantity <=
        sCommodity.maxQuantity
      ) {
        //satisfies quantity restriction
        const supplCartDoc = await SupplCart.findById(reg_id);

        const orderIndex = supplCartDoc.orders.findIndex(
          (order) => order.product === req.body.product
        );

        //checking if the order is already present in the cart
        if (orderIndex >= 0) {
          //order present
          //updating already present order if order quantity more than 0
          if (req.body.quantity > 0) {
            supplCartDoc.orders[orderIndex].quantity = req.body.quantity;
          } else {
            //quantity is 0, so removing the order
            supplCartDoc.orders.splice(orderIndex, 1);
          }
          const saveResp = await supplCartDoc.save();
          res.json(saveResp);
        } else {
          //Index -1, order not present
          //Inserting only if quantity more than 0
          if (req.body.quantity > 0) {
            supplCartDoc.orders.push(req.body);
          }
          const saveResp = await supplCartDoc.save();
          res.json(saveResp);
        }
      } else {
        //Doesn't satisfies quantity restriction
        res
          .status(400)
          .json({ error: "Order quantity surpasses maximum limitation" });
      }
    } else {
      //if the requested commodity is not present in the quota
      res.status(400).json({ error: "Product not present in your stock list" });
    }
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        error: "Validation Error",
        message: err.errors,
      });
    } else {
      next(err);
    }
  }
});

module.exports = router;
