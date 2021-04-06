const express = require("express");

const { Commodity, SupplierStock } = require("../../../../Models/Commodities");
const SupplCart = require("../../../../Models/Carts/CartSuppl");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;
    //getting supplier's stock doc
    let sDoc = await SupplierStock.findById(reg_id);
    //populating the commodity ids
    await sDoc.populate("commodities.product").execPopulate();

    //Original is immutable. To add extra info, creating a copy
    sDoc = sDoc.toObject();
    //Also adding addedtoCart? property
    //For that fetching supplier's cart
    const supplCart = await SupplCart.findById(reg_id);

    if (supplCart) {
      //cart found
      //adding cart details to products present in cart

      //converting to easily accessible object dict
      const cartOrdersObj = {};
      supplCart.orders.forEach((ord) => {
        cartOrdersObj[ord.product] = ord.quantity;
      });

      for (let i = 0; i < sDoc.commodities.length; i++) {
        const cartQuantity = cartOrdersObj[sDoc.commodities[i].product._id];
        if (cartQuantity) {
          //product present in cart
          sDoc.commodities[i].addedToCart = true;
          sDoc.commodities[i].cartQuantity = cartQuantity;
        } else {
          //product not present in cart
          sDoc.commodities[i].addedToCart = false;
        }
      }
    } else {
      //Cart not created yet
      for (let i = 0; i < sDoc.commodities.length; i++) {
        sDoc.commodities[i].addedToCart = false;
      }
    }
    res.json(sDoc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
