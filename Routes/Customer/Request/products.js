const express = require("express");
const { Commodity, CustomerQuota } = require("../../../Models/Commodities");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;

    qDoc = await CustomerQuota.findById(reg_id);
    await qDoc.populate('commodities.product').execPopulate()
    
    res.json(qDoc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
