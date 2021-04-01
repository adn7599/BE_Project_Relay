const express = require("express");
const mongoose = require("mongoose");

const { TransactionCustSuppl } = require("../../Models/Transactions");

const router = express.Router();

//Input Json
/*
 {
    transaction_id: "",
    payment: { paymentSchema },
    payment_sign: ""
 } 
 */
router.post("/", async (req, res, next) => {
  try {
    if (req.body.transaction_id && req.body.payment && req.body.payment_sign) {
      const reg_id = req.user.reg_id;
      const transaction_id = req.body.transaction_id;
      const payment = req.body.payment;
      const payment_sign = req.body.payment_sign;

      //checking if the transaction_id is valid and also the reg_id matches while fetching the transaction
      const transactionDoc = await TransactionCustSuppl.find({
        $and: [{ _id: transaction_id }, { "request.requester_id": reg_id }],
      });

      if (transactionDoc.length > 0) {
        //transaction_id is valid and belongs to the user
        //Updating the transaction
        transactionDoc.request

        res.json(transactionDoc);
      } else {
        //transaction id doesn't exist
        res.status(400).json({ error: "transaction does not exist" });
      }
    } else {
      res
        .status(400)
        .json({ error: "Fields transaction_id, payment and payment_sign" });
    }
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: "Validation Error", msg: err.errors });
    } else if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({ error: "Invalid transaction_id" });
    } else {
      next(err);
    }
  }
});

module.exports = router;
