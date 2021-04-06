const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const { TransactionCustSuppl } = require("../../../Models/Transactions");
const confirmSchema = require("../../../Models/Transactions/confirmSchema");
const verifyUserSign = require("../../../Authentication/verifySign");

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
        return;
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

          //Need to check if requester_token and provider_token match
          //requester_token = requester_sign(sha256(transaction_id.payment_id))
          //provider_token = provider_sign(sha256(requester_sign(sha256(transaction_id.payment_id))))
          //if both matches, then saving

          //confirm token created
          const confirmToken = `${transactionDoc._id}.${transactionDoc.payment.id}`;
          //console.log("confirm Token : ", confirmToken);
          //hashing confirmToken
          const hashedToken = crypto
            .createHash("SHA256")
            .update(confirmToken)
            .digest("hex");

          //console.log("confirm Token (hashed): ", hashedToken);
          //verifying the token sent with TTP

          //verifying requester's signed token
          const [err, reqData] = await verifyUserSign(
            "customer",
            transactionDoc.request.requester_id,
            hashedToken,
            confirm.requester_token
          );

          if (!err) {
            if (reqData) {
              //Sign is verified
              //Now need to verify provider's signed token

              //hashing requester's signed token
              const hashedReqConfirmToken = crypto
                .createHash("SHA256")
                .update(confirm.requester_token)
                .digest("hex");

              //console.log("hashedReqConfirmToken: ", hashedReqConfirmToken);

              //now verifying if the signed provider's token matches with the newly hashed requester's confirm token
              const [err, provData] = await verifyUserSign(
                "SP",
                transactionDoc.request.provider_id,
                hashedReqConfirmToken,
                confirm.provider_token
              );
                
              if (!err) {
                //No error while comm with TTP
                if (provData) {
                  //Sign is verified
                  //Now saving the transaction
                  //updating stageCompleted and saving confirm and confirm_sign
                  transactionDoc.stageCompleted = "confirm";
                  transactionDoc.confirm = confirm;
                  transactionDoc.confirm_sign = confirm_sign;

                  const confirmResp = await transactionDoc.save();

                  res.json(confirmResp);
                } else {
                  //Sign not valid.
                  res
                    .status(400)
                    .json({ error: "Invalid provider's confirm token" });
                }
              } else {
                //Error while communicating with TTP
                res
                  .status(err.status)
                  .json({ error: "provider_token: " + err.data });
              }
            } else {
              //Invalid requester signed token
              res
                .status(400)
                .json({ error: "Invalid requester's confirm token" });
            }
          } else {
            //Some error while communicating with ttp
            res
              .status(err.status)
              .json({ error: "requester_token: " + err.data });
          }
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
        .json({ error: "Fields confirm and confirm_sign required" });
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
