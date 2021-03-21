const express = require("express");

//Routes
const products = require("./Request/products");
const cart = require("./Request/cart");
const supplier = require("./Request/supplier");
const request = require("./Request/request");

const payment = require("./payment");
const orders = require("./orders");

//Creating Router
const router = express.Router();

//Request Routes
router.use("/products", products);
router.use("/cart", cart);
router.use("/supplier", supplier);
router.use("/request", request);
//Payment Routes
router.use("/payment", payment);
//order Route
router.use("/orders", orders);

module.exports = router;
