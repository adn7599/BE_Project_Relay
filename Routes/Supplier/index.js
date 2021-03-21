const express = require("express");

const { verifyUser } = require("../../Authentication");
const verifySupplier = require("./verifySupplier");

const requester = require("./Requester");
const provider = require("./Provider");

const router = express.Router();

//Authentication middleware
router.use(verifyUser);
router.use(verifySupplier);

router.use("/requester", requester);
router.use("/provider", provider);

module.exports = router;
