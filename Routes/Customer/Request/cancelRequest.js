const express = require("express");
const mongoose = require("mongoose");

const cancelSchema = require("../../../Models/Transactions/cancelSchema");
const { CustomerQuota, SupplierStock } = require("../../../Models/Commodities");
const { TransactionCustSuppl } = require("../../../Models/Transactions");
const { sign } = require("jsonwebtoken");

//creating a temp cancelled model for validation
const cancelModel = mongoose.model("cancelModel", cancelSchema);

//delete HTTP Method. Router present in ./request.js
async function cancelRequest(req, res, next) {
  try {
    if (req.body.cancel && req.body.cancel_sign) {
      const reg_id = req.user.reg_id;
      const cancel = req.body.cancel;
      const cancel_sign = req.body.cancel_sign;

      await cancelModel.validate(cancel);

      if (typeof cancel_sign !== "string") {
        res.status(400).json({ error: "Field cancel_sign must be a string" });
        return;
      }
      //Finding if the transaction exists and belongs to the requestor
      const transactionDoc = await TransactionCustSuppl.findOne({
        $and: [
          { _id: cancel.transaction_id },
          { "request.requester_id": reg_id },
        ],
      });

      if (transactionDoc) {
        //transaction exists and belongs to the requester

        //Need to check if stageCompleted is 'request'
        //If not the transaction can't be cancelled
        if (transactionDoc.stageCompleted == "request") {
          //Transaction belongs to the requestor
          //Updating the transaction
          transactionDoc.stageCompleted = "cancelled";
          transactionDoc.cancel = cancel;
          transactionDoc.cancel_sign = cancel_sign;

          //Adding cancelled items to the customer's quota and supplier's stock back
          //finding customer quota and supplier stock
          const custQuotaDoc = await CustomerQuota.findById(reg_id);
          const supplStockDoc = await SupplierStock.findById(
            transactionDoc.request.provider_id
          );

          transactionDoc.request.orders.forEach((order) => {
            const quotaOrd = custQuotaDoc.commodities.find(
              (crtOrd) => crtOrd.product == order.product
            );
            const stockOrd = supplStockDoc.commodities.find(
              (stkOrd) => order.product == stkOrd.product
            );

            if (
              quotaOrd.availableQuantity + order.quantity <=
              quotaOrd.allotedQuantity
            ) {
              //within alloted quantity
              quotaOrd.availableQuantity += order.quantity;
            } else {
              //surpasses limit. So setting the max amount
              quotaOrd.availableQuantity = quotaOrd.allotedQuantity;
            }

            stockOrd.availableQuantity += order.quantity;
          });

          //saving updated quota and stock
          await Promise.all([custQuotaDoc.save(), supplStockDoc.save()]);
          //saving updated transaction
          const saveResp = await transactionDoc.save();

          res.json(saveResp);
        } else {
          //transaction cannot be cancelled
          if (transactionDoc.stageCompleted == "cancelled") {
            res.status(400).json({
              error: "Transaction already cancelled",
            });
          } else {
            res.status(400).json({
              error: "Transaction cannot be cancelled. Payment already made",
            });
          }
        }
      } else {
        res.status(400).json({
          error: "Transaction ID does not exists or belongs to the customer",
        });
      }
    } else {
      res
        .status(400)
        .json({ error: "Fields cancel and cancel_sign are required" });
    }
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: "Validation Error", msg: err.errors });
    } else {
      next(errj);
    }
  }
}

module.exports = cancelRequest;
