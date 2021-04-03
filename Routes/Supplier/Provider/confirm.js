const express = require("express");
const mongoose = require("mongoose");

const { TransactionCustSuppl } = require("../../../Models/Transactions");
const confirmSchema = require("../../../Models/Transactions/confirmSchema");

const router = express.Router();

//creating a temporary confirm model for preliminary validation
const confirmModel = mongoose.model("confirmModel", confirmSchema);

//Input Json
/*
 {
    confirm: { confirmSchema },
    confirm_sign: ""
 } 
 */
router.post("/", async (req, res, next) => {
  try {
    if (req.body.confirm && req.body.confirm_sign) {
      const reg_id = req.user.reg_id;
      const confirm = req.body.confirm;
      const confirm_sign = req.body.confirm_sign;

      //validating the confirm schema before proceeding further
      await confirmModel.validate(confirm);

      //validating confirm_sign type
      if (typeof confirm_sign != "string") {
        res.status(400).json({ error: "confirm_sign must be a string" });
      }

      //checking if the transaction_id is valid and also the reg_id matches while fetching the transaction
      const transactionDoc = await TransactionCustSuppl.findOne({
        $and: [
          { _id: confirm.transaction_id },
          { "request.provider_id": reg_id },
        ],
      });

      if (transactionDoc) {
        //transaction_id is valid and belongs to the user
        //checking if the payment has been made
        //completedStage must be payment for confirm
        if (transactionDoc.stageCompleted == "payment") {
          //completedPhase is payment, can continue

          //updating stageCompleted and saving confirm and confirm_sign
          transactionDoc.stageCompleted = "confirm";
          transactionDoc.confirm = confirm;
          transactionDoc.confirm_sign = confirm_sign;

          //Need to check if requester_token and provider_token match
          //requester_token = requester_sign(sha256(transaction_id.payment_id))
          //provider_token = provider_sign(sha256(requester_sign(sha256(transaction_id.payment_id))))

          //const respConfirm = await transactionDoc.save();
          //res.json(respConfirm);
        } else {
          //payment not made or is already confirmed or cancelled
          if (transactionDoc.stageCompleted == "cancelled") {
            //Transaction cancelled
            res.status(400).json({ error: "Transaction was cancelled" });
          } else if (transactionDoc.stageCompleted == "confirm") {
            //Transaction was already confirmed
            res.status(400).json({ error: "Transaction already confirmed" });
          } else {
            //Payment not made, stageCompleted = request
            res.status(400).json({ error: "Payment yet to be made" });
          }
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
