const express = require("express");

const orders = require("./orders");
const stock = require("./stock");
const confirm = require("./confirm");

const router = express.Router();

//Adding Routes
router.use("/orders", orders);
router.use("/stock", stock);
router.use("/confirm", confirm);

module.exports = router;
