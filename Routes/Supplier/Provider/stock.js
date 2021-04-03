const express = require("express");

const router = express.Router();

const { SupplierStock } = require("../../../Models/Commodities");

router.get("/", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;

    //finding supplier's stock
    const supplierStockDoc = await SupplierStock.findById(reg_id);
    //populating the Doc with products
    await supplierStockDoc.populate("commodities.product").execPopulate();

    res.json(supplierStockDoc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
