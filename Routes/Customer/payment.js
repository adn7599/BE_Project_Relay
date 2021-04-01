const express = require("express");
const mongoose = require("mongoose");

const { TransactionCustSuppl } = require("../../Models/Transactions");
const paymentSchema = require("../../Models/Transactions/paymentSchema");

const router = express.Router();

//creating a temporary payment model for preliminary validation
const paymentModel = mongoose.model("paymentModel", paymentSchema);

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
    if (req.body.payment && req.body.payment_sign) {
      const reg_id = req.user.reg_id;
      const payment = req.body.payment;
      const payment_sign = req.body.payment_sign;

      //validating the payment schema before proceeding further
      await paymentModel.validate(payment);

      //validating payment_sign type
      if (typeof payment_sign != "string") {
        res.status(400).json({ error: "payment_sign must be a string" });
      }

      //checking if the transaction_id is valid and also the reg_id matches while fetching the transaction
      const transactionDoc = await TransactionCustSuppl.findOne({
        $and: [
          { _id: payment.transaction_id },
          { "request.requester_id": reg_id },
        ],
      });

      if (transactionDoc) {
        //transaction_id is valid and belongs to the user
        //checking if the payment has already been done
        //completedStage must be request for payment
        if (transactionDoc.stageCompleted == "request") {
          //completedPhase is request, can continue

          //Checking if the request.payment_amount == payment.amount
          if (transactionDoc.request.payment_amount == payment.amount) {
            //payment amounts matched

            //need to save payment and payment_amount and update the stage
            transactionDoc.stageCompleted = "payment";
            transactionDoc.payment = payment;
            transactionDoc.payment_sign = payment_sign;

            const respPayment = await transactionDoc.save();
            res.json(respPayment);
          } else {
            //payment amount does not match
            res.status(400).json({
              error: "Payment amount doesn't match with the stored amount",
            });
          }
        } else {
          //payment already made
          res.status(400).json({ error: "Payment already done" });
        }
      } else {
        //transaction id doesn't exist
        res.status(400).json({ error: "transaction does not exist" });
      }
    } else {
      res
        .status(400)
        .json({ error: "Fields payment and payment_sign required" });
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
