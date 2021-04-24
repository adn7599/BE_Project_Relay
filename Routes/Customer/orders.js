const express = require("express");

const { TransactionCustSuppl } = require("../../Models/Transactions");

const router = express.Router();

const REQUEST_SELECT = { _id: 1, stageCompleted: 1, request: 1 };
const CANCEL_SELECT = { ...REQUEST_SELECT, cancel: 1 };
const PAYMENT_SELECT = { ...REQUEST_SELECT, payment: 1 };
const CONFIRM_SELECT = { ...PAYMENT_SELECT, confirm: 1 };

const selectStage = {
  request: REQUEST_SELECT,
  cancelled: CANCEL_SELECT,
  payment: PAYMENT_SELECT,
  confirm: CONFIRM_SELECT,
};

router.get("/:stageCompleted", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;
    const stageCompleted = req.params.stageCompleted;
    if (
      stageCompleted === "request" ||
      stageCompleted === "payment" ||
      stageCompleted === "confirm" ||
      stageCompleted === "cancelled"
    ) {
      //simple query
      //finding transaction belonging to the requester and the selected stage
      const transactionDocs = await TransactionCustSuppl.find({
        $and: [
          { "request.requester_id": reg_id },
          { stageCompleted: stageCompleted },
        ],
      }).select(selectStage[stageCompleted]);

      for (let i = 0; i < transactionDocs.length; i++) {
        //populating product details
        await transactionDocs[i]
          .populate("request.orders.product", "name unit price")
          .execPopulate();

        //populating supplier details
        await transactionDocs[i]
          .populate("request.provider_id", "name address location mobNo email")
          .execPopulate();
      }
      transactionDocs.reverse();
      res.json(transactionDocs);
    } else {
      res.status(400).json({
        error:
          "Invalid query param sent, must be either request, payment, confirm, cancelled",
      });
      return;
    }
    /*
    //formatting all param request
    if (stageCompleted === "all") {
      const respTransactions = {
        request: [],
        payment: [],
        confirm: [],
        cancelled: [],
      };
      const transactionDocs = await TransactionCustSuppl.find({"request.requester_id": reg_id})
      transactionDocs.forEach((trans) => {
        if (trans.stageCompleted === "request") {
          respTransactions.request.push(trans);
        } else if (trans.stageCompleted === "payment") {
          respTransactions.payment.push(trans);
        } else if (trans.stageCompleted === "confirm") {
          respTransactions.confirm.push(trans);
        } else if (trans.stageCompleted === "cancelled") {
          respTransactions.cancelled.push(trans);
        } else {
          console.error(
            `Invalid transaction document with invalid stageCompleted found!!: transaction_id: ${trans._id}`
          );
        }
      });
      res.json(respTransactions);
    } else {
      res.json(transactionDocs);
    }*/
  } catch (err) {
    next(err);
  }
});

module.exports = router;
