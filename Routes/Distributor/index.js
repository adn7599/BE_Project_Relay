const express = require("express");

const { verifyUser } = require("../../Authentication");
const verifyDistributor = require("./verifyDistributor");

const orders = require("./orders");
const stock = require("./stock");
const confirm = require("./confirm");

const router = express.Router();

//Authentication middleware
router.use(verifyUser);
router.use(verifyDistributor);

//Adding Routes
router.use("/orders", orders);
router.use("/stock", stock);
router.use("/confirm", confirm);

module.exports = router;
