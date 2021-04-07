const express = require("express");

const router = express.Router();

const { DistributorStock } = require("../../Models/Commodities");

router.get("/", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;

    //finding distributor's stock
    const distributorStockDoc = await DistributorStock.findById(reg_id);
    //populating the Doc with products
    await distributorStockDoc.populate("commodities.product").execPopulate();

    res.json(distributorStockDoc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
