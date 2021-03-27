const express = require("express");

const { Commodity, CustomerQuota } = require("../../../Models/Commodities");
const CustCart = require("../../../Models/Carts/CartCust");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;

    let qDoc = await CustomerQuota.findById(reg_id);
    await qDoc.populate("commodities.product").execPopulate();
    //
    qDoc = qDoc.toObject()
    //Also adding addedtoCart? property
    const cartDoc = await CustCart.findById(reg_id);

    if (cartDoc) {
      //cart created
      //adding cart details to products present in cart

      const cartOrdersObj = {};
      cartDoc.orders.forEach((ord) => {
        cartOrdersObj[ord.product] = ord.quantity;
      });

      for(let i=0;i<qDoc.commodities.length;i++){
        const cartQuantity = cartOrdersObj[qDoc.commodities[i].product._id];
        if (cartQuantity) {
          //product present in cart
          qDoc.commodities[i].addedToCart = true;
          qDoc.commodities[i].cartQuantity = cartQuantity;
        } else {
          //product not present in cart
          qDoc.commodities[i].addedToCart = false;
        }
      }

    } else {
      //Cart not created yet
      for(let i=0;i<qDoc.commodities.length;i++){
        qDoc.commodities[i].addedToCart = false;
      }
    }
    res.json(qDoc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
